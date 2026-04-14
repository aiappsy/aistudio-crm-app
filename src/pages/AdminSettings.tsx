import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

interface GlobalConfig {
  tiers: {
    free: { price: number; memberLimit: number };
    pro: { price: number; memberLimit: number };
    enterprise: { price: number; memberLimit: number };
  };
}

export default function AdminSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: config, loading, set: saveConfig } = useFirestoreDoc<GlobalConfig>("global_config", "main");
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  
  const [formData, setFormData] = useState<GlobalConfig>({
    tiers: {
      free: { price: 0, memberLimit: 3 },
      pro: { price: 19, memberLimit: 50 },
      enterprise: { price: 49, memberLimit: 1000 },
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await saveConfig(formData);
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

  if (userProfile?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to access the global administration settings.
          Please contact the platform owner if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Admin Settings</h1>
          <p className="text-muted-foreground">Manage platform-wide tiers, pricing, and limits.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
          Save Configuration
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(["free", "pro", "enterprise"] as const).map((tier) => (
          <Card key={tier}>
            <CardHeader>
              <CardTitle className="capitalize">{tier} Tier</CardTitle>
              <CardDescription>Configure limits for the {tier} plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Monthly Price ($)</label>
                <Input 
                  type="number"
                  value={formData.tiers[tier].price} 
                  onChange={e => setFormData({
                    ...formData,
                    tiers: {
                      ...formData.tiers,
                      [tier]: { ...formData.tiers[tier], price: Number(e.target.value) }
                    }
                  })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Team Member Limit</label>
                <Input 
                  type="number"
                  value={formData.tiers[tier].memberLimit} 
                  onChange={e => setFormData({
                    ...formData,
                    tiers: {
                      ...formData.tiers,
                      [tier]: { ...formData.tiers[tier], memberLimit: Number(e.target.value) }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
