import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, Wand2, Merge, XCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreQuery, useFirestoreDoc } from "@/lib/useFirestore";
import { where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function calculateCompleteness(contact: any) {
  let score = 0;
  let total = 10; // name(2), email(2), company(2), phone(1), industry(1), title(1), notes(1)
  
  if (contact.name && contact.name.trim() !== "") score += 2;
  if (contact.email && contact.email.trim() !== "") score += 2;
  if (contact.company && contact.company.trim() !== "") score += 2;
  if (contact.phone && contact.phone.trim() !== "") score += 1;
  if (contact.industry && contact.industry.trim() !== "") score += 1;
  if (contact.title && contact.title.trim() !== "") score += 1;
  if (contact.notes && contact.notes.trim() !== "") score += 1;
  
  return Math.round((score / total) * 100);
}

function levenshteinDistance(s1: string, s2: string) {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    let currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      let insertions = previousRow[j + 1] + 1;
      let deletions = currentRow[j] + 1;
      let substitutions = previousRow[j] + (s1[i] === s2[j] ? 0 : 1);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[s2.length];
}

function calculateSimilarity(c1: any, c2: any) {
  let score = 0;
  if (c1.email && c2.email && c1.email.toLowerCase() === c2.email.toLowerCase()) score += 50;
  if (c1.phone && c2.phone && c1.phone === c2.phone) score += 30;
  
  if (c1.name && c2.name) {
    const dist = levenshteinDistance(c1.name.toLowerCase(), c2.name.toLowerCase());
    const maxLen = Math.max(c1.name.length, c2.name.length);
    const sim = maxLen === 0 ? 1 : (maxLen - dist) / maxLen;
    if (sim > 0.8) score += 40;
    else if (sim > 0.6) score += 20;
  }

  if (c1.company && c2.company) {
    const dist = levenshteinDistance(c1.company.toLowerCase(), c2.company.toLowerCase());
    const maxLen = Math.max(c1.company.length, c2.company.length);
    const sim = maxLen === 0 ? 1 : (maxLen - dist) / maxLen;
    if (sim > 0.8) score += 20;
  }
  
  return Math.min(score, 100);
}

export default function DataHygiene() {
  const { user } = useAuth();
  const { data: contacts, loading: contactsLoading } = useFirestoreQuery<any>("contacts", [where("ownerId", "==", user?.uid)]);
  
  const [enriching, setEnriching] = useState<string | null>(null);
  const [merging, setMerging] = useState<string | null>(null);

  const { duplicates, incompleteContacts, inconsistencies } = useMemo(() => {
    if (!contacts.length) return { duplicates: [], incompleteContacts: [], inconsistencies: [] };
    
    // Incomplete Contacts
    const incomplete = contacts
      .map((c: any) => ({ ...c, completenessScore: calculateCompleteness(c) }))
      .filter((c: any) => c.completenessScore < 70)
      .sort((a, b) => a.completenessScore - b.completenessScore);

    // Duplicates
    const dups = [];
    const checked = new Set();
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const c1 = contacts[i];
        const c2 = contacts[j];
        if (checked.has(`${c1.id}-${c2.id}`)) continue;
        
        const sim = calculateSimilarity(c1, c2);
        if (sim >= 70) {
          dups.push({ c1, c2, confidence: sim });
        }
        checked.add(`${c1.id}-${c2.id}`);
      }
    }
    
    // Inconsistencies
    const issues = [];
    contacts.forEach((c: any) => {
      if (c.email && c.company) {
        const domain = c.email.split('@')[1]?.split('.')[0]?.toLowerCase();
        const companyName = c.company.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (domain && companyName && !domain.includes(companyName) && !companyName.includes(domain)) {
          if (domain !== 'gmail' && domain !== 'yahoo' && domain !== 'hotmail' && domain !== 'outlook') {
            issues.push({ contact: c, issue: "Email domain does not match company name." });
          }
        }
      }
    });

    return { duplicates: dups.sort((a,b)=>b.confidence - a.confidence), incompleteContacts: incomplete, inconsistencies: issues };
  }, [contacts]);

  const handleMerge = async (pair: any) => {
    if (!user) return;
    setMerging(`${pair.c1.id}-${pair.c2.id}`);
    try {
      const mergedData = {
        ...pair.c1,
        ...pair.c2, // c2 overrides c1 for simple fields
        name: pair.c1.name || pair.c2.name, // prefer c1
        email: pair.c1.email || pair.c2.email,
        phone: pair.c1.phone || pair.c2.phone,
        company: pair.c1.company || pair.c2.company,
        history: [...(pair.c1.history || []), ...(pair.c2.history || [])],
        updatedAt: serverTimestamp()
      };
      
      // Update c1
      await updateDoc(doc(db, "contacts", pair.c1.id), mergedData);
      
      // Delete c2
      await deleteDoc(doc(db, "contacts", pair.c2.id));
      
      // Log
      await addDoc(collection(db, "dataHygieneLog"), {
        action: "merge",
        contactId: pair.c1.id,
        before: { c1: pair.c1, c2: pair.c2 },
        after: mergedData,
        confidence: pair.confidence,
        timestamp: serverTimestamp(),
      });
      
    } catch (e) {
      console.error(e);
      alert("Failed to merge contacts");
    } finally {
      setMerging(null);
    }
  };

  const logAudit = async (action: string, contactId: string, details: any) => {
    await addDoc(collection(db, "dataHygieneLog"), {
      action,
      contactId,
      ...details,
      timestamp: serverTimestamp(),
    });
  };

  if (contactsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const overallHealth = Math.round(
    (contacts.reduce((acc, c) => acc + calculateCompleteness(c), 0) / (contacts.length || 1))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Hygiene Engine</h1>
        <p className="text-muted-foreground">Continuously audit, enrich, and deduplicate your CRM records.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Data Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${overallHealth}%` }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duplicates Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{duplicates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incomplete Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{incompleteContacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Inconsistencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inconsistencies.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList>
          <TabsTrigger value="duplicates">Duplicate Detection</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete Records</TabsTrigger>
          <TabsTrigger value="inconsistencies">Inconsistencies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="duplicates" className="space-y-4 pt-4">
          {duplicates.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 border rounded-lg">
              <ShieldCheck className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="font-medium">No duplicates detected</p>
              <p className="text-sm text-muted-foreground">Your database is clean.</p>
            </div>
          ) : (
            duplicates.map((pair, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={pair.confidence >= 90 ? "default" : "secondary"}>
                        {pair.confidence}% Match
                      </Badge>
                      {pair.confidence >= 90 && <span className="text-xs text-primary font-medium">Auto-merge candidate</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="p-2 border rounded bg-background">
                        <p className="font-semibold">{pair.c1.name}</p>
                        <p className="text-xs text-muted-foreground">{pair.c1.email}</p>
                        <p className="text-xs text-muted-foreground">{pair.c1.company}</p>
                      </div>
                      <div className="p-2 border rounded bg-background">
                        <p className="font-semibold">{pair.c2.name}</p>
                        <p className="text-xs text-muted-foreground">{pair.c2.email}</p>
                        <p className="text-xs text-muted-foreground">{pair.c2.company}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleMerge(pair)} 
                    disabled={merging === `${pair.c1.id}-${pair.c2.id}`}
                    variant={pair.confidence >= 90 ? "default" : "outline"}
                  >
                    {merging === `${pair.c1.id}-${pair.c2.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Merge className="mr-2 h-4 w-4" />}
                    Merge Records
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="incomplete" className="space-y-4 pt-4">
          {incompleteContacts.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 border rounded-lg">
              <ShieldCheck className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="font-medium">All records complete</p>
            </div>
          ) : (
            incompleteContacts.slice(0, 10).map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{c.name || "Unknown Name"}</p>
                    <p className="text-xs text-muted-foreground">{c.email || c.company || "No contact info"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${c.completenessScore}%` }}></div>
                      </div>
                      <span className="text-xs font-medium w-10">{c.completenessScore}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => alert("Enrichment triggers a Gemini web search in a real scenario to find Linkedin/Company Data.")}>
                    <Wand2 className="mr-2 h-4 w-4" /> Auto-Enrich
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          {incompleteContacts.length > 10 && (
            <p className="text-center text-sm text-muted-foreground">Showing top 10 most incomplete records.</p>
          )}
        </TabsContent>

        <TabsContent value="inconsistencies" className="space-y-4 pt-4">
          {inconsistencies.length === 0 ? (
           <div className="p-8 text-center bg-muted/20 border rounded-lg">
              <ShieldCheck className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="font-medium">No inconsistencies found</p>
            </div>
          ) : (
            inconsistencies.map((item, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
                    <div>
                      <p className="font-semibold">{item.contact.name}</p>
                      <p className="text-sm text-muted-foreground">{item.issue}</p>
                      <div className="flex gap-4 mt-1 text-xs font-medium">
                        <span className="text-destructive">Email: {item.contact.email}</span>
                        <span className="text-primary">Company: {item.contact.company}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Review</Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
