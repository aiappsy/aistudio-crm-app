import React, { useState } from "react";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Plus, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Reorder } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: string;
  type: string;
  industry?: string;
  dealValue?: number;
  probability?: number;
  leadScore?: {
    compositeScore: number;
    priority: "High" | "Medium" | "Low";
  };
}

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function Pipeline() {
  const { t } = useLanguage();
  const { data: contacts, loading, update, add } = useFirestoreCollection<Contact>("contacts");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState<Partial<Contact>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "customer",
    status: "Lead",
    industry: "",
    dealValue: 0,
    probability: 50
  });

  const moveContact = async (id: string, newStatus: string) => {
    await update(id, { status: newStatus });
  };

  const handleSaveDeal = async () => {
    if (!newDeal.name || !newDeal.company) return;
    if (editingDealId) {
      await update(editingDealId, newDeal);
    } else {
      await add(newDeal as any);
    }
    setIsAddModalOpen(false);
    setEditingDealId(null);
    setNewDeal({ name: "", company: "", email: "", phone: "", type: "customer", status: "Lead", dealValue: 0, probability: 50 });
  };
  
  const openAppModal = (deal?: Contact) => {
    if (deal) {
      setEditingDealId(deal.id);
      setNewDeal({
        name: deal.name,
        company: deal.company,
        email: deal.email || "",
        phone: deal.phone || "",
        type: deal.type,
        status: deal.status,
        industry: deal.industry || "",
        dealValue: deal.dealValue || 0,
        probability: deal.probability || 50
      });
    } else {
      setEditingDealId(null);
      setNewDeal({ name: "", company: "", email: "", phone: "", type: "customer", status: "Lead", industry: "", dealValue: 0, probability: 50 });
    }
    setIsAddModalOpen(true);
  };

  const onDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData("contactId", contactId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    if (contactId) {
      await moveContact(contactId, stage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pipeline")}</h1>
          <p className="text-muted-foreground">{t("visual_sales_pipeline")}</p>
        </div>
        <Button className="gap-2" onClick={() => openAppModal()}>
          <Plus size={18} />
          {t("new_deal")}
        </Button>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-4 pb-4">
        {STAGES.map((stage) => (
          <div 
            key={stage} 
            className="flex flex-col gap-4 bg-muted/40 rounded-xl p-4 border break-inside-avoid min-w-[300px] max-w-[350px] flex-shrink-0"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage)}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs text-muted-foreground">
                {t(stage.toLowerCase()) || stage}
                <Badge variant="secondary" className="ml-2">{contacts.filter(c => c.status === stage).length}</Badge>
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal size={14} />
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {contacts
                .filter((c) => c.status === stage)
                .map((contact) => (
                  <motion.div
                    key={contact.id}
                    layoutId={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group bg-card"
                      draggable
                      onDragStart={(e: any) => onDragStart(e, contact.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{contact.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">{contact.company}</p>
                            
                            <div className="flex flex-col gap-0.5 mt-1">
                              {contact.email && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                  {contact.phone}
                                </span>
                              )}
                            </div>

                            {contact.leadScore && (
                              <Badge 
                                variant="outline" 
                                className={`mt-1 text-[10px] ${
                                  contact.leadScore.priority === 'High' ? 'text-green-600 border-green-600/30 bg-green-50/50 dark:bg-green-900/20' : 
                                  contact.leadScore.priority === 'Medium' ? 'text-amber-600 border-amber-600/30 bg-amber-50/50 dark:bg-amber-900/20' : 
                                  'text-red-600 border-red-600/30 bg-red-50/50 dark:bg-red-900/20'
                                }`}
                              >
                                {contact.leadScore.priority} ({contact.leadScore.compositeScore})
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              {contact.industry && (
                                <Badge variant="secondary" className="text-[10px] capitalize bg-muted/50">{contact.industry}</Badge>
                              )}
                              <Badge variant="outline" className="text-[10px] capitalize">{contact.type}</Badge>
                              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-transparent" onClick={() => openAppModal(contact)}>
                                <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                              </Button>
                            </div>
                            {contact.dealValue ? (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                ${(contact.dealValue || 0).toLocaleString()} ({contact.probability || 50}%)
                              </span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                              {contact.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {STAGES.filter(s => s !== stage).map(s => (
                              <Button 
                                key={s}
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2"
                                onClick={() => moveContact(contact.id, s)}
                              >
                                To {s}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add_new_deal")}</DialogTitle>
            <DialogDescription>{t("create_new_prospect")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("contact_name")}</Label>
              <Input 
                value={newDeal.name ?? ""}
                onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input 
                type="email"
                value={newDeal.email ?? ""}
                onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input 
                type="tel"
                value={newDeal.phone ?? ""}
                onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company")}</Label>
              <Input 
                value={newDeal.company ?? ""}
                onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry / Niche</Label>
              <Input 
                value={newDeal.industry ?? ""}
                onChange={(e) => setNewDeal({ ...newDeal, industry: e.target.value })}
                placeholder="e.g. Healthcare, Technology..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deal Value ($)</Label>
                <Input 
                  type="number"
                  value={newDeal.dealValue || ""}
                  onChange={(e) => setNewDeal({ ...newDeal, dealValue: Number(e.target.value) })}
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={newDeal.probability || ""}
                  onChange={(e) => setNewDeal({ ...newDeal, probability: Number(e.target.value) })}
                  placeholder="e.g. 50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("pipeline_stage")}</Label>
              <Select 
                value={newDeal.status ?? ""} 
                onValueChange={(val: any) => setNewDeal({ ...newDeal, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">{t("lead")}</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSaveDeal} disabled={!newDeal.name || !newDeal.company}>
              {editingDealId ? "Update Deal" : t("save_deal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
