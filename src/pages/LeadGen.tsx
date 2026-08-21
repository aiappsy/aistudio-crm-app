import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Mail, Download, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { executeToolHelper } from "@/services/executeToolHelper";

export default function LeadGen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: globalConfig } = useFirestoreDoc<any>("global_config", "main");
  
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [offset, setOffset] = useState(0);

  const fetchLeads = async (isLoadMore = false) => {
    if (!query || !location || !user) return;
    
    setLoading(true);
    const currentOffset = isLoadMore ? offset + 25 : 0;
    
    try {
      const resp = await executeToolHelper("scrape_google_maps", { query, location, offset: currentOffset }, user, settings, globalConfig);
      const parsed = JSON.parse(resp);
      if (parsed.status === "error") {
        setImportStatus(parsed.message || "Failed to search leads");
        if (!isLoadMore) {
          setResults([]);
          setSelectedLeads(new Set());
        }
      } else {
        const newResults = parsed.results || [];
        if (isLoadMore) {
          setResults(prev => [...prev, ...newResults]);
          const newIndices = newResults.map((_: any, i: number) => results.length + i);
          setSelectedLeads(prev => new Set([...prev, ...newIndices]));
        } else {
          setResults(newResults);
          setSelectedLeads(new Set(newResults.map((_: any, i: number) => i)));
        }
        setOffset(currentOffset);
        setImportStatus("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchLeads(false);
  };

  const handleExtractEmails = async () => {
    if (!user) return;
    setExtracting(true);
    try {
      const websites = results.filter((_, i) => selectedLeads.has(i)).map(r => r.website || `www.${r.company.replace(/\s+/g, '').toLowerCase()}.com`);
      const resp = await executeToolHelper("extract_emails_from_websites", { websites }, user, settings, globalConfig);
      const parsed = JSON.parse(resp);
      
      setResults(prev => {
        const next = [...prev];
        parsed.results.forEach((r: any, idx: number) => {
          // Simply assigning derived emails to selection
          const origIdx = Array.from(selectedLeads)[idx];
          if (origIdx !== undefined && next[origIdx]) {
            next[origIdx].email = r.email;
          }
        });
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setExtracting(false);
    }
  };

  const handleImportLeads = async () => {
    if (!user) return;
    setImporting(true);
    setImportStatus("");
    try {
      const leadsToImport = results.filter((_, i) => selectedLeads.has(i)).map(r => ({
        company: r.company,
        name: r.decision_maker_name || r.company + " Contact",
        title: r.decision_maker_title || "",
        email: r.email || "",
        phone: r.phone || "",
        address: r.address || "",
        rating: r.rating || 0
      }));
      
      const resp = await executeToolHelper("import_leads_to_crm", { leads: leadsToImport }, user, settings, globalConfig);
      setImportStatus(resp);
    } catch (error) {
      console.error(error);
      setImportStatus("Failed to import leads.");
    } finally {
      setImporting(false);
    }
  };

  const toggleSelection = (index: number) => {
    const next = new Set(selectedLeads);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedLeads(next);
  };

  const handleExportCSV = () => {
    const selectedData = results.filter((_, i) => selectedLeads.has(i));
    if (selectedData.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Company,Name,Email,Phone,Website,Address,Rating\n";
    
    selectedData.forEach((row) => {
      const company = row.company ? `"${row.company.replace(/"/g, '""')}"` : "";
      const name = row.name ? `"${row.name.replace(/"/g, '""')}"` : (row.company ? `"${row.company.replace(/"/g, '""')} Contact"` : "");
      const email = row.email ? `"${row.email.replace(/"/g, '""')}"` : "";
      const phone = row.phone ? `"${row.phone.replace(/"/g, '""')}"` : "";
      const website = row.website ? `"${row.website.replace(/"/g, '""')}"` : "";
      const address = row.address ? `"${row.address.replace(/"/g, '""')}"` : "";
      const rating = row.rating || "";

      csvContent += `${company},${name},${email},${phone},${website},${address},${rating}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Generation</h1>
        <p className="text-muted-foreground">Scrape leads from Google Maps and find contact information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Businesses</CardTitle>
          <CardDescription>Enter a niche and location to find local businesses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. Plumber, Dentist, Cafe"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. Oslo, Austin TX"
                className="pl-9"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
            <div>
              <CardTitle>Search Results ({results.length})</CardTitle>
              <CardDescription>Select leads to extract emails, import to CRM, or export.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportCSV} disabled={selectedLeads.size === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExtractEmails} disabled={extracting || selectedLeads.size === 0}>
                {extracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Extract Emails
              </Button>
              <Button onClick={handleImportLeads} disabled={importing || selectedLeads.size === 0}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Import to CRM
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {importStatus && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md text-sm">
                {importStatus}
              </div>
            )}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedLeads.size === results.length} 
                        onCheckedChange={(c) => {
                          if (c) {
                            setSelectedLeads(new Set(results.map((_, i) => i)));
                          } else {
                            setSelectedLeads(new Set());
                          }
                        }} 
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Decision Maker</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((lead, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedLeads.has(idx)} 
                          onCheckedChange={() => toggleSelection(idx)} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.company}</TableCell>
                      <TableCell>
                        {lead.decision_maker_name ? (
                          <div className="flex flex-col">
                            <span>{lead.decision_maker_name}</span>
                            <span className="text-xs text-muted-foreground">{lead.decision_maker_title}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{lead.address}</TableCell>
                      <TableCell>{lead.phone || "-"}</TableCell>
                      <TableCell>{lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Link</a> : "-"}</TableCell>
                      <TableCell>{lead.rating}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {results.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => fetchLeads(true)} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load More Leads
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
