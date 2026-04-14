import React, { useState } from "react";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Reorder } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  company: string;
  status: "Active" | "Lead" | "Inactive";
  type: "customer" | "supplier" | "custom";
}

const STAGES = ["Lead", "Active", "Inactive"] as const;

export default function Pipeline() {
  const { t } = useLanguage();
  const { data: contacts, loading, update } = useFirestoreCollection<Contact>("contacts");

  const moveContact = async (id: string, newStatus: Contact["status"]) => {
    await update(id, { status: newStatus });
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
          <p className="text-muted-foreground">Visual sales pipeline. Drag and drop to update status.</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          New Deal
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
    </div>
  );
}
