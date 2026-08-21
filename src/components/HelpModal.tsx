import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Separator } from "@/components/ui/separator";
import Markdown from "react-markdown";

export default function HelpModal() {
  const { t } = useLanguage();
  const location = useLocation();

  const currentSection = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/dashboard") || path === "/app") return { title: t("help_dashboard_title"), content: t("help_dashboard_content") };
    if (path.includes("/notebook")) return { title: t("help_hub_title"), content: t("help_hub_content") };
    if (path.includes("/leads")) return { title: t("help_leads_title"), content: t("help_leads_content") };
    if (path.includes("/contacts")) return { title: t("help_customers_title"), content: t("help_crm_customers") || t("help_customers_content") };
    if (path.includes("/data-hygiene")) return { title: t("help_hygiene_title"), content: t("help_hygiene_content") };
    if (path.includes("/customer-success")) return { title: t("help_success_title"), content: t("help_success_content") };
    if (path.includes("/workflows")) return { title: t("help_workflows_title"), content: t("help_workflows_content") };
    if (path.includes("/pipeline")) return { title: t("help_pipeline_title") || "Pipeline", content: t("help_pipeline_content") };
    if (path.includes("/quotes")) return { title: t("help_quotes_title"), content: t("help_quotes_content") };
    if (path.includes("/invoices")) return { title: t("help_invoices_title"), content: t("help_invoices_content") };
    if (path.includes("/products")) return { title: t("help_products_title"), content: t("help_products_content") };
    if (path.includes("/payments")) return { title: t("help_payments_title"), content: t("help_payments_content") };
    if (path.includes("/outreach")) return { title: t("help_outreach_title"), content: t("help_outreach_content") };
    if (path.includes("/reports")) return { title: t("help_reports_title"), content: t("help_reports_content") };
    if (path.includes("/settings") || path.includes("/admin") || path.includes("/integrations")) return { title: t("help_settings_title"), content: t("help_settings_content") };
    return { title: t("user_guide"), content: t("help_dashboard_content") };
  }, [location.pathname, t]);

  return (
    <Dialog>
      <DialogTrigger 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 relative"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="sr-only">{t("help")}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {currentSection.title}
          </DialogTitle>
        </DialogHeader>
        <Separator className="my-2" />
        <div className="py-2">
          <div className="text-sm text-muted-foreground leading-relaxed [&_p]:mb-4 [&_strong]:text-foreground [&_strong]:font-semibold">
            <Markdown>{currentSection.content}</Markdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
