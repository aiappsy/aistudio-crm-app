import React, { useState, FormEvent, useRef } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  Sparkles,
  Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { callManagedAi } from "@/services/gemini";

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Active" | "Lead" | "Inactive";
  type: "customer" | "supplier" | "custom";
  lastContact: string;
}

export default function Contacts({ type }: { type?: "customer" | "supplier" | "custom" }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: contacts, loading, add, update, remove } = useFirestoreCollection<Contact>("contacts");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [isResearching, setIsResearching] = useState<string | null>(null);
  
  const handleResearch = async (contact: Contact) => {
    setIsResearching(contact.id);
    try {
      const result = await callManagedAi({
        prompt: `Research the company "${contact.company}" and provide a brief summary of what they do, their industry, and 2-3 potential pain points they might have that a CRM could solve.`,
        systemInstruction: "You are a competitive research assistant. Provide concise, professional insights."
      });
      alert(`Research for ${contact.company}:\n\n${result.text}`);
    } catch (error) {
      console.error("Research error:", error);
      alert("Failed to perform research. AI features might be limited.");
    } finally {
      setIsResearching(null);
    }
  };

  const [formData, setFormData] = useState<Omit<Contact, "id" | "lastContact">>({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "Lead",
    type: type || "customer",
  });

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      status: "Lead",
      type: type || "customer",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      status: contact.status,
      type: contact.type || "customer",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      await update(editingContact.id, {
        ...formData,
        lastContact: new Date().toISOString(),
      });
    } else {
      await add({
        ...formData,
        lastContact: new Date().toISOString(),
      });
    }
    setIsDialogOpen(false);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const newContacts = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(",").map(v => v.trim());
        const contact: any = {
          lastContact: new Date().toISOString(),
          status: "Lead",
          type: type || "customer"
        };
        
        headers.forEach((header, index) => {
          if (header === "name") contact.name = values[index];
          if (header === "company") contact.company = values[index];
          if (header === "email") contact.email = values[index];
          if (header === "phone") contact.phone = values[index];
          if (header === "status") contact.status = values[index] || "Lead";
          if (header === "type") contact.type = values[index] || type || "customer";
        });
        
        return contact;
      });

      for (const contact of newContacts) {
        if (contact.name && contact.email) {
          await add(contact);
        }
      }
      
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert(t("csv_import_success"));
    };
    reader.readAsText(file);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !type || c.type === type;
    
    return matchesSearch && matchesType;
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">{t("please_sign_in")}</h2>
        <p className="text-muted-foreground">{t("auth_required_customers") || "You need to be authenticated to manage contacts."}</p>
      </div>
    );
  }

  const title = type === "customer" ? t("customers") : 
                type === "supplier" ? t("suppliers") : 
                type === "custom" ? t("custom_types") : t("contacts");

  const desc = type === "customer" ? t("customers_desc") : 
               type === "supplier" ? t("suppliers_desc") : 
               type === "custom" ? t("custom_types_desc") : t("customers_desc");

  const addButtonText = type === "customer" ? t("add_customer") : 
                        type === "supplier" ? t("add_supplier") : 
                        type === "custom" ? t("add_custom_type") : t("add_customer");

  const editButtonText = type === "customer" ? t("edit_customer") : 
                         type === "supplier" ? t("edit_supplier") : 
                         type === "custom" ? t("edit_custom_type") : t("edit_customer");

  const detailsText = type === "customer" ? t("customer_details") : 
                      type === "supplier" ? t("supplier_details") : 
                      type === "custom" ? t("custom_type_details") : t("customer_details");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{desc}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {t("import_csv")}
          </Button>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus size={18} />
            {addButtonText}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9"
            value={searchQuery ?? ""}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          {t("filters")}
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("company")}</TableHead>
                <TableHead>{t("contact")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("last_contact")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? t("no_results") : t("create_first")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {contact.name}
                        {contact.status === "Active" && (
                          <Sparkles className="h-3 w-3 text-primary animate-pulse" aria-label="AI Insight: High value contact" />
                        )}
                        {new Date().getTime() - new Date(contact.lastContact).getTime() > 30 * 24 * 60 * 60 * 1000 && (
                          <Badge variant="destructive" className="text-[8px] h-4 px-1 uppercase tracking-tighter">{t("churn_risk") || "Churn Risk"}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail size={12} />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone size={12} />
                          {contact.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          contact.status === "Active" ? "default" : 
                          contact.status === "Lead" ? "secondary" : "outline"
                        }
                      >
                        {contact.status === "Active" ? t("active") : 
                         contact.status === "Lead" ? t("lead") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(contact.lastContact).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(contact)}
                          title={t("edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                            <MoreHorizontal size={18} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href=`/app/contacts/${contact.id}`}>
                            <Globe className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(contact)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResearch(contact)} disabled={isResearching === contact.id}>
                            {isResearching === contact.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                            {t("research_company") || "Research Company"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(contact.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingContact ? editButtonText : addButtonText}</DialogTitle>
              <DialogDescription>
                {detailsText}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={formData.name ?? ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">{t("company")}</Label>
                <Input
                  id="company"
                  value={formData.company ?? ""}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone ?? ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">{t("contact_type") || "Contact Type"}</Label>
                <Select
                  value={formData.type ?? ""}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t("customers")}</SelectItem>
                    <SelectItem value="supplier">{t("suppliers")}</SelectItem>
                    <SelectItem value="custom">{t("custom_types")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  value={formData.status ?? ""}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t("active")}</SelectItem>
                    <SelectItem value="Lead">{t("lead")}</SelectItem>
                    <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingContact ? t("save_changes") : addButtonText}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
