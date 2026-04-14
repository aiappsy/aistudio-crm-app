import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, CreditCard, Sparkles, Globe, Zap } from "lucide-react";

interface IntegrationSettings {
  geminiApiKey: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  aiModel: string;
}

export default function Integrations() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  
  // Scope settings to the organization so the whole team shares the keys
  const { data: settings, loading, set: saveSettings } = useFirestoreDoc<IntegrationSettings>(
    "settings", 
    userProfile?.organizationId || user?.uid
  );
  
  const [formData, setFormData] = useState<IntegrationSettings>({
    geminiApiKey: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    aiModel: "gemini-2.0-flash",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        geminiApiKey: settings.geminiApiKey || "",
        stripePublishableKey: settings.stripePublishableKey || "",
        stripeSecretKey: settings.stripeSecretKey || "",
        aiModel: settings.aiModel || "gemini-2.0-flash",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Connect your own services to power your CRM.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
          Save Integrations
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Stripe Integration */}
        <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Stripe Payments</CardTitle>
                <CardDescription>Accept credit card payments on your invoices.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Setup Instructions
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Log in to your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Stripe Dashboard</a>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Copy your <strong>Publishable key</strong> and <strong>Secret key</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Paste them below to enable "Pay Now" buttons for your clients.</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Publishable Key</label>
                <Input 
                  value={formData.stripePublishableKey} 
                  onChange={e => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                  placeholder="pk_test_..." 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Secret Key</label>
                <Input 
                  type="password"
                  value={formData.stripeSecretKey} 
                  onChange={e => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                  placeholder="sk_test_..." 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gemini AI Integration */}
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Gemini AI Intelligence</CardTitle>
                <CardDescription>Power your outreach and research with your own AI key.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-primary flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Setup Instructions
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Create a new API key and copy it.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Paste it below to unlock AI-powered features.</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Gemini API Key</label>
                <Input 
                  type="password"
                  value={formData.geminiApiKey} 
                  onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="Paste your API key here" 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Preferred AI Model</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.aiModel}
                  onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
