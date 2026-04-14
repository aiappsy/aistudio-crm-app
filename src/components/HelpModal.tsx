import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function HelpModal() {
  const { t } = useLanguage();

  const helpSections = [
    { title: t("help_dashboard_title"), content: t("help_dashboard_content") },
    { title: t("help_customers_title"), content: t("help_customers_content") },
    { title: t("help_quotes_title"), content: t("help_quotes_content") },
    { title: t("help_invoices_title"), content: t("help_invoices_content") },
    { title: t("help_products_title"), content: t("help_products_content") },
    { title: t("help_payments_title"), content: t("help_payments_content") },
    { title: t("help_outreach_title"), content: t("help_outreach_content") },
    { title: t("help_reports_title"), content: t("help_reports_content") },
    { title: t("help_settings_title"), content: t("help_settings_content") },
  ];

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <HelpCircle className="h-5 w-5" />
        <span className="sr-only">{t("help")}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t("user_guide")}
          </DialogTitle>
          <DialogDescription>
            {t("help_dashboard_content").split(".")[0]}.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {helpSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-bold text-lg text-primary">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
                {index < helpSections.length - 1 && <Separator className="mt-4 opacity-50" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
