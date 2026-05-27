import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, HeartPulse, Search, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CustomerSuccess() {
  const { user } = useAuth();
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection<any>("contacts");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const customers = contacts.filter((c: any) => c.type === 'customer' && c.customerHealth);
  
  let filteredCustomers = customers.filter((c: any) => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (riskFilter !== "all") {
    filteredCustomers = filteredCustomers.filter((c: any) => c.customerHealth?.riskLevel?.toLowerCase() === riskFilter.toLowerCase());
  }

  // Sort by lowest health score first
  filteredCustomers.sort((a, b) => (a.customerHealth?.score || 0) - (b.customerHealth?.score || 0));

  const averageHealth = customers.length ? Math.round(customers.reduce((acc, c) => acc + (c.customerHealth?.score || 0), 0) / customers.length) : 100;
  
  const atRiskCount = customers.filter((c: any) => c.customerHealth?.riskLevel === 'At Risk').length;
  const watchCount = customers.filter((c: any) => c.customerHealth?.riskLevel === 'Watch').length;
  const healthyCount = customers.filter((c: any) => c.customerHealth?.riskLevel === 'Healthy').length;

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "healthy": return "text-green-600 border-green-600/30 bg-green-50/50 dark:bg-green-900/20";
      case "watch": return "text-amber-600 border-amber-600/30 bg-amber-50/50 dark:bg-amber-900/20";
      default: return "text-red-600 border-red-600/30 bg-red-50/50 dark:bg-red-900/20";
    }
  };
  
  const getProgressColor = (score: number) => {
    if (score < 50) return "bg-red-500";
    if (score < 80) return "bg-amber-500";
    return "bg-green-500";
  };

  if (contactsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Success</h1>
          <p className="text-muted-foreground">Monitor account health, detect churn risk, and trigger proactive interventions.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <HeartPulse className={averageHealth < 50 ? "text-red-500" : averageHealth < 80 ? "text-amber-500" : "text-green-500"} />
              {averageHealth}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full ${getProgressColor(averageHealth)}`} style={{ width: `${averageHealth}%` }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Watch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{watchCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk (QBR Required)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search accounts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="healthy">Healthy (80-100)</SelectItem>
            <SelectItem value="watch">Watch (50-79)</SelectItem>
            <SelectItem value="at risk">At Risk (0-49)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Suggested Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No customers found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.company || "-"}</TableCell>
                    <TableCell className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-bold">{contact.customerHealth?.score || 0}</span>
                        <div className="flex-1 w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${getProgressColor(contact.customerHealth?.score || 0)}`} style={{ width: `${contact.customerHealth?.score || 0}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRiskColor(contact.customerHealth?.riskLevel)}>
                        {contact.customerHealth?.riskLevel || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {contact.customerHealth?.riskLevel === 'At Risk' ? (
                        <Button size="sm" variant="destructive" className="h-7 text-xs">
                          <Calendar className="mr-1 h-3 w-3" /> Schedule QBR
                        </Button>
                      ) : contact.customerHealth?.riskLevel === 'Watch' ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-600/30">
                          <FileText className="mr-1 h-3 w-3" /> Send Check-in
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
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
