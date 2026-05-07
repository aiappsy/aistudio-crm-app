import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc, useFirestoreCollection } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ShieldAlert, Send, Users, CreditCard, Settings2, Rocket } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GlobalConfig {
  tiers: {
    free: { price: number; memberLimit: number; aiTokens: number };
    pro: { price: number; memberLimit: number; aiTokens: number };
    enterprise: { price: number; memberLimit: number; aiTokens: number };
  };
  tokenPrice?: number;
  paymentProviders?: {
    stripePublicKey?: string;
    stripeSecretKey?: string;
    paypalClientId?: string;
    paypalSecretKey?: string;
  };
  systemApis?: {
    geminiApiKey?: string;
    openaiApiKey?: string;
  };
}

export default function AdminSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: config, loading, set: saveConfig } = useFirestoreDoc<GlobalConfig>("global_config", "main");
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: usersList, loading: loadingUsers } = useFirestoreCollection<any>("users");
  
  const [formData, setFormData] = useState<GlobalConfig>({
    tiers: {
      free: { price: 0, memberLimit: 1, aiTokens: 10 },
      pro: { price: 19, memberLimit: 5, aiTokens: 20 },
      enterprise: { price: 49, memberLimit: 9999, aiTokens: 9999 },
    },
    tokenPrice: 1.5,
    paymentProviders: { stripePublicKey: "", stripeSecretKey: "", paypalClientId: "" },
    systemApis: { geminiApiKey: "", openaiApiKey: "" }
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Release Form State
  const [releaseTitle, setReleaseTitle] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        tiers: config.tiers || formData.tiers,
        tokenPrice: config.tokenPrice || formData.tokenPrice,
        paymentProviders: config.paymentProviders || formData.paymentProviders,
        systemApis: config.systemApis || formData.systemApis
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await saveConfig(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePublishRelease = async () => {
    if (!releaseTitle || !releaseNotes) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, "releases"), {
        title: releaseTitle,
        notes: releaseNotes,
        targetAudience,
        publishedAt: serverTimestamp(),
        publishedBy: user?.uid
      });
      setPublished(true);
      setReleaseTitle("");
      setReleaseNotes("");
      setTimeout(() => setPublished(false), 3000);
    } catch (error) {
      console.error("Error publishing release:", error);
    } finally {
      setPublishing(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">{t("super_admin_control_center") || "Super Admin Control Center"}</h1>
          <p className="text-muted-foreground">{t("manage_platform_settings") || "Manage platform-wide settings, customers, and releases."}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="plans" className="gap-2"><CreditCard className="h-4 w-4" /> Plans & Billing</TabsTrigger>
          <TabsTrigger value="customers" className="gap-2"><Users className="h-4 w-4" /> Customers</TabsTrigger>
          <TabsTrigger value="system" className="gap-2"><Settings2 className="h-4 w-4" /> System & APIs</TabsTrigger>
          <TabsTrigger value="releases" className="gap-2"><Rocket className="h-4 w-4" /> Releases</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {(["free", "pro", "enterprise"] as const).map((tier) => (
              <Card key={tier}>
                <CardHeader>
                  <CardTitle className="capitalize">{tier} Tier</CardTitle>
                  <CardDescription>Configure limits for the {tier} plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("monthly_price") || "Monthly Price ($)"}</label>
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
                    <label className="text-sm font-medium">{t("team_member_limit") || "Team Member Limit"}</label>
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
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("included_ai_tokens_mo") || "Included AI Tokens/mo"}</label>
                    <Input 
                      type="number"
                      value={formData.tiers[tier].aiTokens} 
                      onChange={e => setFormData({
                        ...formData,
                        tiers: {
                          ...formData.tiers,
                          [tier]: { ...formData.tiers[tier], aiTokens: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("ai_token_pricing") || "AI Token Pricing"}</CardTitle>
              <CardDescription>Set the price for purchasing additional AI tokens (1 token = 1 hour of use).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Price per Token ($)</label>
                <Input 
                  type="number"
                  step="0.1"
                  value={formData.tokenPrice} 
                  onChange={e => setFormData({
                    ...formData,
                    tokenPrice: Number(e.target.value)
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PayPal Payment Provider configuration</CardTitle>
              <CardDescription>Configure your global PayPal API keys to receive payments from users for subscriptions and tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid gap-2">
                <label className="text-sm font-medium">PayPal Client ID</label>
                <Input 
                  type="text"
                  placeholder="Enter your PayPal Client ID"
                  value={formData.paymentProviders?.paypalClientId || ""} 
                  onChange={e => setFormData({
                    ...formData,
                    paymentProviders: { ...formData.paymentProviders, paypalClientId: e.target.value }
                  })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">PayPal Client Secret</label>
                <Input 
                  type="password"
                  placeholder="Enter your PayPal Secret"
                  value={formData.paymentProviders?.paypalSecretKey || ""} 
                  onChange={e => setFormData({
                    ...formData,
                    paymentProviders: { ...formData.paymentProviders, paypalSecretKey: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Registered Customers</CardTitle>
              <CardDescription>View and manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'super_admin' ? 'default' : 'secondary'}>
                            {u.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {u.organizationId || 'None'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!usersList || usersList.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System & APIs</CardTitle>
              <CardDescription>Manage global API keys and system integrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Gemini API Key</label>
                <Input 
                  type="password"
                  placeholder="AIzaSy..."
                  value={formData.systemApis?.geminiApiKey || ""} 
                  onChange={e => setFormData({
                    ...formData,
                    systemApis: { ...formData.systemApis, geminiApiKey: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">Used for platform-wide AI features if users don't provide their own.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">OpenAI API Key (Optional)</label>
                <Input 
                  type="password"
                  placeholder="sk-..."
                  value={formData.systemApis?.openaiApiKey || ""} 
                  onChange={e => setFormData({
                    ...formData,
                    systemApis: { ...formData.systemApis, openaiApiKey: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="releases">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Publish New Release</CardTitle>
                <CardDescription>Send updates and feature announcements to customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Release Title</label>
                  <Input 
                    placeholder="e.g., v2.1: New AI Features" 
                    value={releaseTitle}
                    onChange={(e) => setReleaseTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Release Notes (Markdown supported)</label>
                  <Textarea 
                    placeholder="Describe what's new..." 
                    className="min-h-[150px]"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
                    <option value="all">All Customers</option>
                    <option value="pro">Pro & Enterprise Only</option>
                    <option value="enterprise">Enterprise Only</option>
                    <option value="beta">Beta Testers</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="notify" defaultChecked />
                  <label htmlFor="notify" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Send in-app notification to targeted users
                  </label>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handlePublishRelease} 
                  disabled={publishing || !releaseTitle || !releaseNotes} 
                  className="w-full gap-2"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (published ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />)}
                  {published ? "Published!" : "Publish Release"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Releases</CardTitle>
                <CardDescription>History of published updates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Rocket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No releases published yet.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

