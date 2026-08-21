import { Card } from "@/components/ui/card";
import { Sparkles, Search, Plus, MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function CustomersPreview() {
  const { t } = useLanguage();

  const customers = [
    { name: "Nordic Solutions AS", industry: "Tech", status: "Active", risk: "Low" },
    { name: "Global Logistics Ltd", industry: "Shipping", status: "Lead", risk: "High" },
    { name: "Innovate Design", industry: "Creative", status: "Active", risk: "Medium" },
  ];

  return (
    <div className="w-full h-full bg-background flex flex-col text-[10px] sm:text-xs">
      <div className="h-8 border-b border-border/40 bg-muted/30 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-[6.5rem] bg-primary/20 rounded-full flex items-center px-2 text-[6px] text-primary font-bold">{(t("customers") || "CUSTOMERS").toUpperCase()}</div>
        </div>
        <div className="flex gap-2">
          <div className="w-4 h-4 rounded bg-muted flex items-center justify-center"><Plus className="h-2 w-2" /></div>
          <div className="w-4 h-4 rounded bg-muted flex items-center justify-center"><MoreHorizontal className="h-2 w-2" /></div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm">{t("customer_directory") || "Customer Directory"}</h3>
          <div className="h-6 px-3 bg-primary rounded-lg flex items-center text-[8px] text-primary-foreground font-bold">{t("add_new") || "Add New"}</div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
          <div className="h-7 w-full border border-border/50 rounded-lg bg-muted/20 flex items-center px-8 text-muted-foreground text-[8px]">
            {t("search_customers_placeholder") || "Search by name, industry or risk level..."}
          </div>
        </div>

        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
          <div className="h-8 bg-muted/30 border-b border-border/40 flex items-center px-3 gap-4 text-[7px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className="w-24">{t("company_name") || "Company Name"}</div>
            <div className="w-16">{t("industry") || "Industry"}</div>
            <div className="w-12">{t("risk_level") || "Risk"}</div>
          </div>
          <div className="divide-y divide-border/40">
            {customers.map((c, i) => (
              <div key={i} className="p-3 flex items-center gap-4">
                <div className="w-24 font-medium truncate">{c.name}</div>
                <div className="w-16 text-muted-foreground">{c.industry}</div>
                <div className={`px-2 py-0.5 rounded-full text-[6px] font-bold uppercase ${
                  c.risk === "High" ? "bg-red-500/10 text-red-500" : 
                  c.risk === "Medium" ? "bg-amber-500/10 text-amber-500" :
                  "bg-green-500/10 text-green-500"
                }`}>
                  {c.risk} {t("risk_level") || "Risk"}
                </div>
                <div className="ml-auto flex gap-2">
                  <div className="w-4 h-4 rounded bg-muted/20 flex items-center justify-center text-[8px]">ID</div>
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight Overlay */}
        <Card className="rounded-xl border-primary/20 bg-primary/5 shadow-lg p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            <div className="text-[8px] font-bold uppercase tracking-widest">{t("ai_smart_insight") || "AI Smart Insight"}</div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-medium leading-tight">
              <span className="text-primary font-bold">Global Logistics Ltd</span> {t("insight_decrease") || "has shown a 40% decrease in platform activity this week."}
            </p>
            <p className="text-[8px] text-muted-foreground leading-tight">
              {t("insight_recommendation") || "Recommendation: Schedule a check-in call to discuss retention strategies."}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 -rotate-45 translate-x-8 -translate-y-8" />
        </Card>
      </div>
    </div>
  );
}
