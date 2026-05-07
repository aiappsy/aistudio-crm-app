import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Send, Search, Plus, Filter, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { draftOutreach } from "@/services/gemini";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";

import { useLanguage } from "@/lib/i18n";

interface OutreachRecord {
  id: string;
  customerId: string;
  customerName: string;
  platform: "Email" | "WhatsApp";
  message: string;
  subject?: string;
  status: "Sent" | "Failed";
  createdAt: any;
}

export default function Outreach() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: outreach, loading, add } = useFirestoreCollection<OutreachRecord>("outreach");
  const { data: customers } = useFirestoreCollection<any>("contacts");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  
  const [newOutreach, setNewOutreach] = useState({
    customerId: "",
    platform: "Email" as "Email" | "WhatsApp",
    subject: "",
    message: ""
  });

  const handleDraft = async () => {
    if (!newOutreach.customerId) return;
    const customer = customers.find(c => c.id === newOutreach.customerId);
    
    setIsDrafting(true);
    try {
      const draft = await draftOutreach({
        customerName: customer?.name || "Customer",
        customerContext: `Company: ${customer?.company || "Unknown"}, Email: ${customer?.email || "Unknown"}`,
        platform: newOutreach.platform,
        purpose: "General follow-up and relationship building",
        customApiKey: settings?.geminiApiKey,
        model: settings?.aiModel
      });

      if (draft) {
        setNewOutreach({
          ...newOutreach,
          subject: draft.subject || newOutreach.subject,
          message: draft.message
        });
      }
    } catch (error) {
      console.error("Drafting error:", error);
      alert("Failed to draft message with AI. Make sure your Gemini API key is configured in Integrations.");
    } finally {
      setIsDrafting(false);
    }
  };

  const filteredOutreach = outreach.filter(item => 
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    const customer = customers.find(c => c.id === newOutreach.customerId);
    
    let status: "Sent" | "Failed" = "Sent";
    let errorMessage = "";

    if (newOutreach.platform === "Email") {
      if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass || !customer?.email) {
        alert("Cannot send email. Please ensure SMTP settings are configured and the customer has an email address.");
        return;
      }

      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: settings.smtpHost,
            port: settings.smtpPort || "587",
            user: settings.smtpUser,
            pass: settings.smtpPass,
            to: customer.email,
            subject: newOutreach.subject,
            body: newOutreach.message
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to send email");
        }
      } catch (error: any) {
        console.error("Failed to send email:", error);
        status = "Failed";
        errorMessage = error.message;
        alert(`Failed to send email: ${errorMessage}`);
      }
    } else {
      // For WhatsApp, we currently just log it visually or could add an API here later
      // A common approach is opening wa.me link
      if (customer?.phone) {
        window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(newOutreach.message)}`, '_blank');
      } else {
        alert("Customer does not have a phone number for WhatsApp.");
      }
    }

    await add({
      ...newOutreach,
      customerName: customer?.name || "Unknown",
      status
    });
    
    setIsDialogOpen(false);
    setNewOutreach({ customerId: "", platform: "Email", subject: "", message: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("outreach")}</h1>
          <p className="text-muted-foreground">{t("outreach_desc")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
            <Plus size={18} />
            {t("new_outreach")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("send_new_message")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">{t("customer")}</Label>
                <Select 
                  value={newOutreach.customerId} 
                  onValueChange={(val) => setNewOutreach({...newOutreach, customerId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_customer_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.filter((c: any) => !c.type || c.type === 'customer').map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">{t("platform")}</Label>
                <Select 
                  value={newOutreach.platform} 
                  onValueChange={(val: any) => setNewOutreach({...newOutreach, platform: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">{t("email")}</SelectItem>
                    <SelectItem value="WhatsApp">{t("whatsapp")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newOutreach.platform === "Email" && (
                <div className="grid gap-2">
                  <Label htmlFor="subject">{t("subject")}</Label>
                  <Input 
                    id="subject" 
                    value={newOutreach.subject} 
                    onChange={(e) => setNewOutreach({...newOutreach, subject: e.target.value})}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">{t("message")}</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleDraft}
                    disabled={isDrafting || !newOutreach.customerId}
                  >
                    {isDrafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {t("ai_draft") || "AI Draft"}
                  </Button>
                </div>
                <Textarea 
                  id="message" 
                  rows={5}
                  value={newOutreach.message} 
                  onChange={(e) => setNewOutreach({...newOutreach, message: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("cancel")}</Button>
              <Button onClick={handleSend} disabled={!newOutreach.customerId || !newOutreach.message}>
                {t("send_message")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_sent")}</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outreach.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("email_outreach")}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outreach.filter(o => o.platform === "Email").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("whatsapp_outreach")}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outreach.filter(o => o.platform === "WhatsApp").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>{t("communication_history")}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search_history")}
                  className="pl-9 w-[200px] md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("platform")}</TableHead>
                  <TableHead>{t("message_preview")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutreach.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("no_outreach_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOutreach.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.platform === "Email" ? <Mail size={14} /> : <MessageSquare size={14} />}
                          {item.platform === "Email" ? t("email") : t("whatsapp")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {item.subject && <span className="font-semibold mr-1">[{item.subject}]</span>}
                        {item.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Sent" ? "default" : "destructive"}>
                          {item.status === "Sent" ? t("sent") : t("failed")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.createdAt?.toDate ? format(item.createdAt.toDate(), "MMM d, yyyy HH:mm") : t("just_now")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
