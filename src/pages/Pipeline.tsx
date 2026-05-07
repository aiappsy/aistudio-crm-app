import React, { useState } from "react";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Plus, Sparkles } from "lucide-react";
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
  status: "Active" | "Lead" | "Inactive";
  type: "customer" | "supplier" | "custom";
}

const STAGES = ["Lead", "Active", "Inactive"] as const;

export default function Pipeline() {
  const { t } = useLanguage();
  const { data: contacts, loading, update, add } = useFirestoreCollection<Contact>("contacts");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<Partial<Contact>>({
    name: "",
    company: "",
    email: "",
    type: "customer",
    status: "Lead"
  });

  const moveContact = async (id: string, newStatus: Contact["status"]) => {
    await update(id, { status: newStatus });
  };

  const handleAddDeal = async () => {
    if (!newDeal.name || !newDeal.company) return;
    await add(newDeal);
    setIsAddModalOpen(false);
    setNewDeal({ name: "", company: "", email: "", type: "customer", status: "Lead" });
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
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          {t("new_deal")}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {STAGES.map((stage) => (
          <div key={stage} className="flex flex-col gap-4 bg-muted/30 rounded-xl p-4 border border-dashed">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs text-muted-foreground">
                {t(stage.toLowerCase())}
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
                    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.company}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">{contact.type}</Badge>
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
                value={newDeal.name || ""}
                onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input 
                type="email"
                value={newDeal.email || ""}
                onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company")}</Label>
              <Input 
                value={newDeal.company || ""}
                onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("pipeline_stage")}</Label>
              <Select 
                value={newDeal.status} 
                onValueChange={(val: any) => setNewDeal({ ...newDeal, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">{t("lead")}</SelectItem>
                  <SelectItem value="Active">{t("active")}</SelectItem>
                  <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleAddDeal} disabled={!newDeal.name || !newDeal.company}>
              {t("save_deal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
