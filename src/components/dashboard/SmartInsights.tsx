import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";
import { getSmartInsights } from "@/services/gemini";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";

interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
  action?: {
    label: string;
    prompt: string;
  };
}

export default function SmartInsights({ data }: { data: any }) {
  const { user } = useAuth();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", userProfile?.organizationId || user?.uid);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAction = (prompt: string) => {
    // Dispatch custom event to trigger AI Assistant
    const event = new CustomEvent("trigger-ai-assistant", { detail: { prompt } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    async function fetchInsights() {
      // Don't fetch if all data arrays are empty
      if (data.contacts.length === 0 && data.invoices.length === 0 && data.payments.length === 0 && (!data.outreach || data.outreach.length === 0)) {
        setInsights([
          {
            title: "Getting Started",
            description: "Add some contacts, invoices, or payments to see AI-powered business insights here.",
            type: "info"
          }
        ]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await getSmartInsights(data, settings?.geminiApiKey, settings?.aiModel);
      setInsights(result);
      setLoading(false);
    }
    fetchInsights();
  }, [data, settings?.geminiApiKey]);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <CardTitle className="text-lg">AI Smart Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex gap-3">
                  {insight.type === "positive" && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                  {insight.type === "warning" && <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />}
                  {insight.type === "info" && <Info className="h-5 w-5 text-blue-500 shrink-0" />}
                  <div>
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
                {insight.action && (
                  <div className="pl-8">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10"
                      onClick={() => handleAction(insight.action!.prompt)}
                    >
                      {insight.action.label}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
