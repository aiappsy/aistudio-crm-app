import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  MapPin, 
  Loader2, 
  Globe, 
  Mail, 
  Phone, 
  Map, 
  Star, 
  Import, 
  CheckCircle2, 
  Building2,
  ListPlus,
  Sparkles
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ScrapedLead {
  id: string;
  name: string;
  company: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  emails?: string[];
  status: "Scraped" | "Crawling" | "Enriched" | "Imported";
}

export default function LeadFinder() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [currentCrawlSite, setCurrentCrawlSite] = useState("");
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Run the Scraper
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !location) return;

    setLoading(true);
    setLeads([]);
    setSelectedLeads({});
    setImportSuccess(false);

    try {
      const response = await fetch("/api/leads/scrape-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to find leads");

      setLeads(data.leads || []);
      
      // Automatically initiate Website Email Extraction for results that have websites
      const sitesToCrawl = (data.leads || [])
        .filter((lead: ScrapedLead) => lead.website)
        .map((lead: ScrapedLead) => lead.website);

      if (sitesToCrawl.length > 0) {
        await runEmailExtraction(sitesToCrawl, data.leads);
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Run website email crawling
  const runEmailExtraction = async (websites: string[], currentLeads: ScrapedLead[]) => {
    setCrawling(true);
    
    // Simulate crawling steps to give visual feedback to the user (WOW factor)
    let leadIndex = 0;
    const interval = setInterval(() => {
      const site = websites[leadIndex];
      if (site) {
        setCurrentCrawlSite(site);
        setLeads(prev => prev.map(l => l.website === site ? { ...l, status: "Crawling" } : l));
        leadIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const response = await fetch("/api/leads/extract-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websites })
      });

      const data = await response.json();
      clearInterval(interval);

      if (response.ok && data.results) {
        setLeads(prev => prev.map(lead => {
          const emails = data.results[lead.website] || [];
          return {
            ...lead,
            emails,
            status: "Enriched"
          };
        }));
      }
    } catch (err) {
      console.error("Email extraction failed:", err);
      clearInterval(interval);
    } finally {
      setCrawling(false);
      setCurrentCrawlSite("");
    }
  };

  // Bulk Import
  const handleImport = async () => {
    if (!user) return;
    const selectedIds = Object.keys(selectedLeads).filter(id => selectedLeads[id]);
    if (selectedIds.length === 0) return;

    setImporting(true);
    let successCount = 0;

    try {
      const leadsToImport = leads.filter(l => selectedIds.includes(l.id));

      for (const lead of leadsToImport) {
        const email = lead.emails?.[0] || `info@${lead.website.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]}`;
        
        await addDoc(collection(db, "contacts"), {
          name: lead.name || `${lead.company} Office`,
          company: lead.company,
          email: email,
          phone: lead.phone || "",
          address: lead.address || "",
          rating: lead.rating || 0,
          status: "Lead",
          type: "customer",
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          lastContact: new Date().toISOString(),
          tag: `Scraper: ${query} ${location}`
        });
        
        successCount++;
        // Update lead status to Imported
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "Imported" } : l));
      }

      setImportSuccess(true);
      setSelectedLeads({});
      setTimeout(() => setImportSuccess(false), 4000);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import some leads to your CRM.");
    } finally {
      setImporting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      leads.forEach(l => {
        if (l.status !== "Imported") {
          newSelected[l.id] = true;
        }
      });
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    setSelectedLeads(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const selectedCount = Object.values(selectedLeads).filter(Boolean).length;
  const allImported = leads.length > 0 && leads.every(l => l.status === "Imported");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Local Business Lead Finder</h1>
          <p className="text-muted-foreground">Scrape business listings directly from Google Maps and crawl their websites for contact emails.</p>
        </div>
      </div>

      {/* Scraper Search Bar */}
      <Card className="border-primary/20 shadow-lg shadow-primary/5 bg-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Search className="w-3 h-3 text-primary" /> What niche are you targeting?</label>
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Dental Clinics, Real Estate, Gyms"
                required
                className="h-11"
              />
            </div>
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> Location</label>
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Oslo, Austin TX, London"
                required
                className="h-11"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full h-11 font-bold gap-2 cursor-pointer">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Find Leads
              </Button>
            </div>
          </form>

          {/* Scrape & Crawl Status Indicators */}
          {(loading || crawling) && (
            <div className="mt-6 p-4 rounded-xl border bg-muted/40 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <h4 className="font-semibold text-sm">
                  {loading ? "Searching Google Maps directory..." : "Crawling lead websites & extracting emails..."}
                </h4>
              </div>
              {crawling && currentCrawlSite && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-blue-500 animate-spin" /> Scanning: <span className="font-mono text-primary font-medium">{currentCrawlSite}</span></p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full animate-progress duration-300 w-1/3"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Notification Banner */}
      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 font-medium text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Successfully imported selected leads as "Leads" in your main CRM Contacts list!
        </div>
      )}

      {/* Results Section */}
      {leads.length > 0 && (
        <Card className="shadow-md border">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Scraped Lead Results ({leads.length})</CardTitle>
              <CardDescription>Select leads with valid emails to import them into your active CRM pipeline.</CardDescription>
            </div>
            
            {/* Bulk Import Action */}
            <div className="flex items-center gap-3">
              {selectedCount > 0 && (
                <Button 
                  onClick={handleImport} 
                  disabled={importing} 
                  variant="default"
                  className="font-bold gap-2"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
                  Import {selectedCount} to CRM
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                        checked={leads.length > 0 && Object.keys(selectedLeads).length === leads.filter(l => l.status !== "Imported").length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={allImported}
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Website & Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const isSelected = !!selectedLeads[lead.id];
                    const isImported = lead.status === "Imported";

                    return (
                      <TableRow key={lead.id} className={isImported ? "bg-muted/30 opacity-70" : ""}>
                        <TableCell className="text-center">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                            disabled={isImported}
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span>{lead.company}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Contact: {lead.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            {lead.website ? (
                              <a 
                                href={lead.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Globe className="w-3.5 h-3.5 text-blue-500" /> Visit Website
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Website</span>
                            )}
                            
                            {/* Extracted Emails */}
                            <div className="flex flex-wrap gap-1">
                              {lead.emails && lead.emails.length > 0 ? (
                                lead.emails.map((e, idx) => (
                                  <Badge key={idx} variant="secondary" className="gap-1 text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-mono">
                                    <Mail className="w-3 h-3" /> {e}
                                  </Badge>
                                ))
                              ) : (
                                crawling && lead.status === "Crawling" ? (
                                  <span className="text-[10px] italic text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Scanning site...
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">No emails extracted</span>
                                )
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={lead.address}>
                          <span className="flex items-start gap-1"><Map className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" /> {lead.address}</span>
                        </TableCell>
                        <TableCell>
                          {lead.rating > 0 ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-semibold">{lead.rating}</span>
                              <span className="text-muted-foreground">({lead.reviewsCount})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              isImported ? "default" :
                              lead.status === "Enriched" ? "secondary" : "outline"
                            }
                            className={isImported ? "bg-emerald-500 hover:bg-emerald-500 text-white" : ""}
                          >
                            {isImported ? "Imported" : lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {lead.phone && (
                              <a 
                                href={`tel:${lead.phone}`} 
                                className="inline-flex items-center justify-center p-2 rounded-lg border hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                title={`Call ${lead.phone}`}
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isImported}
                              onClick={async () => {
                                handleSelectLead(lead.id, true);
                                await handleImport();
                              }}
                              className="gap-1 h-8"
                            >
                              {isImported ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <ListPlus className="w-3.5 h-3.5" />}
                              {isImported ? "Imported" : "Import"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
