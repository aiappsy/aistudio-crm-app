import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useLanguage } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callManagedAi } from "@/services/gemini";

export default function Leads() {
  const { user } = useAuth();
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection<any>("contacts");
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [scoring, setScoring] = useState<string | null>(null);

  // Filter contacts to only those with a leadScore object (or we can just show all and score them)
  const scoredLeads = contacts.filter((c: any) => c.leadScore && c.leadScore.compositeScore !== undefined);
  
  let filteredLeads = scoredLeads.filter((c: any) => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (priorityFilter !== "all") {
    filteredLeads = filteredLeads.filter((c: any) => c.leadScore?.priority?.toLowerCase() === priorityFilter.toLowerCase());
  }

  // Sort by highest score first
  filteredLeads.sort((a, b) => (b.leadScore?.compositeScore || 0) - (a.leadScore?.compositeScore || 0));

  const handleScoreLead = async (contact: any) => {
    if (!user) return;
    setScoring(contact.id);
    
    try {
      const framework = settings?.leadScoringFramework || "BANT";
      const weights = settings?.leadScoringWeights || { Budget: 25, Authority: 25, Need: 30, Timeline: 20 };
      
      const promptData = `
        Evaluate the following lead using the ${framework} framework.
        Name: ${contact.name}
        Company: ${contact.company}
        Notes: ${contact.notes || "No standard notes"}
        History: ${JSON.stringify(contact.history || [])}
        
        Using the available information and context, estimate criteria scores between 0 and 10.
        Provide a JSON response with keys corresponding to the framework: ${Object.keys(weights).join(", ")}.
        Output raw JSON strictly.
      `;

      // Call AI to evaluate lead
      let response;
      if (settings?.geminiApiKey) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptData,
          config: { responseMimeType: "application/json" }
        });
        response = JSON.parse(response.text || "{}");
      } else {
        const result = await callManagedAi({
          prompt: promptData,
          responseMimeType: "application/json"
        });
        response = JSON.parse(result.text || "{}");
      }

      // Calculate composite score
      let composite = 0;
      let criteriaScores = response;
      for (const [key, weight] of Object.entries(weights)) {
        const scoreValue = criteriaScores[key] || 0;
        composite += (scoreValue * ((weight as number) / 100)) * 10;
      }
      
      // We limit to 100 max just to be safe
      composite = Math.min(100, Math.round(composite));
      
      let priority = "Low";
      if (composite >= 80) priority = "High";
      else if (composite >= 50) priority = "Medium";

      const previousHistory = contact.leadScore?.scoreHistory || [];
      const scoreHistory = [
        ...previousHistory,
        {
          date: new Date().toISOString(),
          compositeScore: composite,
          criteriaScores
        }
      ];

      await updateDoc(doc(db, "contacts", contact.id), {
        leadScore: {
          framework,
          criteriaScores,
          compositeScore: composite,
          priority,
          lastScored: serverTimestamp(),
          scoreHistory
        }
      });

    } catch (e) {
      console.error(e);
      alert("Failed to score lead. Try again later.");
    } finally {
      setScoring(null);
    }
  };

  const scoreAllUnscored = async () => {
    const unscored = contacts.filter((c: any) => !c.leadScore);
    for (const contact of unscored) {
      await handleScoreLead(contact);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      default: return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    }
  };

  if (contactsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring Dashboard</h1>
          <p className="text-muted-foreground">Prioritize prospects automatically with {settings?.leadScoringFramework || "BANT"} framework.</p>
        </div>
        <Button onClick={scoreAllUnscored} disabled={scoring !== null || contacts.filter((c: any) => !c.leadScore).length === 0}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Score All Unscored ({contacts.filter((c: any) => !c.leadScore).length})
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search leads..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High (80-100)</SelectItem>
            <SelectItem value="medium">Medium (50-79)</SelectItem>
            <SelectItem value="low">Low (0-49)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Framework Score Breakdown</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Composite Score</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No scored leads found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.company || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.leadScore?.criteriaScores && Object.keys(contact.leadScore.criteriaScores).map(k => (
                          <Badge variant="outline" key={k} className="text-[10px]">
                            {k.substring(0, 1)}: {contact.leadScore.criteriaScores[k]}/10
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(contact.leadScore?.priority)}>
                        {contact.leadScore?.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {contact.leadScore?.compositeScore}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleScoreLead(contact)} disabled={scoring === contact.id}>
                        {scoring === contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
