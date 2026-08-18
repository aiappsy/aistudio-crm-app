import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc, useFirestoreQuery } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Mail, Globe, Sparkles, UserPlus, Trash2, Clock, CreditCard, Coins } from "lucide-react";
import { cn, formatCurrency, convertBasePrice } from "@/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface UserSettings {
  companyName: string;
  email: string;
  website: string;
  geminiApiKey: string;
  openaiApiKey?: string;
  openAiVoice?: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  vatRegion: "NO" | "SE" | "DK" | "INT";
  currency: string;
  aiModel: string;
  tier: "free" | "pro" | "enterprise";
  leadScoringFramework?: "BANT" | "MEDDIC" | "CHAMP";
  leadScoringWeights?: any;
  brandVoice?: {
    tone: string;
    formalityLevel: number;
    greetingPreference: string;
    closingPreference: string;
    prohibitedPhrases: string;
  };
  autopilotEnabled?: boolean;
}

export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: settings, loading, set: saveSettings } = useFirestoreDoc<UserSettings>("settings", user?.uid);
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: teamMembers } = useFirestoreQuery<any>("users", [where("organizationId", "==", userProfile?.organizationId || "none")]);
  const { data: invitations } = useFirestoreQuery<any>("invitations", [where("invitedBy", "==", user?.uid || "none"), where("status", "==", "pending")]);
  
  const [formData, setFormData] = useState<UserSettings>({
    companyName: "",
    email: "",
    website: "",
    geminiApiKey: "",
    openaiApiKey: "",
    openAiVoice: "alloy",
    stripePublishableKey: "",
    stripeSecretKey: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    vatRegion: "NO",
    currency: "USD",
    aiModel: "gemini-2.5-flash",
    tier: "free",
    leadScoringFramework: "BANT",
    leadScoringWeights: { Budget: 25, Authority: 25, Need: 30, Timeline: 20 },
    brandVoice: {
      tone: "Professional",
      formalityLevel: 3,
      greetingPreference: "Hi [Name]",
      closingPreference: "Best regards",
      prohibitedPhrases: ""
    }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const { data: globalConfig } = useFirestoreDoc<any>("global_config", "main");
  const [searchParams, setSearchParams] = useSearchParams();
  const subscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let baseData = { ...formData };
    if (settings) {
      baseData = { 
        ...formData, 
        ...settings,
        leadScoringWeights: settings.leadScoringWeights || formData.leadScoringWeights,
        brandVoice: {
          ...formData.brandVoice,
          ...(settings.brandVoice || {})
        }
      };
    } else if (user) {
      baseData.email = user.email || "";
    }
    
    const plan = searchParams.get("plan");
    if (plan && ["free", "pro", "enterprise"].includes(plan)) {
      baseData.tier = plan as UserSettings["tier"];
      searchParams.delete("plan");
      setSearchParams(searchParams);
      
      // Attempt to scroll to Subscription settings
      setTimeout(() => {
        subscriptionRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Simulate immediate checkout for paid plans
        if (plan !== "free") {
            // Because there's no actual subscription checkout endpoint right now, we simulate with an alert per instructions
            alert(`Initiating Stripe checkout for ${plan.toUpperCase()} plan!`);
        }
      }, 500);
    }
    
    setFormData(baseData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, user, searchParams]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !userProfile?.organizationId) return;
    
    // Check limit
    const currentTier = formData.tier || settings?.tier || userProfile?.tier || (userProfile?.role === "super_admin" ? "enterprise" : "free");
    let limit = globalConfig?.tiers?.[currentTier]?.memberLimit;
    if (!limit) {
      limit = currentTier === "enterprise" ? 9999 : (currentTier === "pro" ? 5 : 1);
    }

    if (teamMembers.length + invitations.length >= limit) {
      const event = new CustomEvent("trigger-ai-assistant", { 
        detail: { prompt: `I tried to invite a member but my tier (${currentTier}) member limit of ${limit} has been reached. Please explain this to me and suggest upgrading my plan.` } 
      });
      window.dispatchEvent(event);
      return;
    }

    setInviting(true);
    try {
      await addDoc(collection(db, "invitations"), {
        email: inviteEmail,
        organizationId: userProfile.organizationId,
        organizationName: formData.companyName || "Our Team",
        role: "user",
        status: "pending",
        invitedBy: user?.uid,
        createdAt: serverTimestamp()
      });
      setInviteEmail("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "invitations");
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      await deleteDoc(doc(db, "invitations", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invitations/${id}`);
    }
  };

  const seedMockData = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      // 4 Mock Customers
      const customerNames = ["Hugh Jass", "Anita Bath", "Seymour Butz", "Eileen Dover"];
      const customerDocs = [];
      for (const name of customerNames) {
        const docRef = await addDoc(collection(db, "contacts"), {
          name,
          email: `${name.replace(" ", ".").toLowerCase()}@funny.mock`,
          phone: "+1 555-0192",
          company: "Mock Inc",
          status: "Active",
          type: "customer",
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        customerDocs.push({ id: docRef.id, name });
      }

      // Add one incomplete contact
      await addDoc(collection(db, "contacts"), {
        name: "Incomplete Ian",
        status: "Lead",
        type: "customer",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Add a duplicate pair
      await addDoc(collection(db, "contacts"), {
        name: "Duplicate Dan",
        email: "dan@duplicate.com",
        phone: "+1 222-3333",
        company: "Duplicate Corp",
        status: "Lead",
        type: "customer",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "contacts"), {
        name: "Duplicate Danny",
        email: "dan@duplicate.com", // Exact email match (50 points)
        phone: "+1 222-3333", // Exact phone match (30 points)
        company: "Duplicate Corporation", // High similarity company
        status: "Lead",
        type: "customer",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // Add an inconsistency
      await addDoc(collection(db, "contacts"), {
        name: "Mismatch Mary",
        email: "mary@example.org",
        company: "Google", // Mismatched domain
        status: "Active",
        type: "customer",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2 Mock Products
      const products = [
        { name: "SaaS Premium License", price: 299, category: "Software", stockLevel: 999, status: "Available" },
        { name: "Cloud Storage 1TB", price: 49, category: "Software", stockLevel: 999, status: "Available" }
      ];
      for (const prod of products) {
        await addDoc(collection(db, "products"), {
          ...prod,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      // 1 Pending Invoice
      if (customerDocs.length > 0) {
        await addDoc(collection(db, "invoices"), {
          customerId: customerDocs[0].id,
          customerName: customerDocs[0].name,
          amount: 299,
          status: "Pending",
          invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      alert("Mock data successfully seeded!");
    } catch (error) {
      alert("Failed to seed mock data. Please try again.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const useGmailDefaults = () => {
    setFormData({
      ...formData,
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      smtpUser: user?.email || "",
    });
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("settings_desc")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                if (user) {
                  await updateDoc(doc(db, "users", user.uid), { onboardingCompleted: false });
                }
              } catch (e) {
                console.error(e);
              }
            }}
          >
            Re-run Setup Wizard
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
            {t("save_changes")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card ref={subscriptionRef}>
          <CardHeader>
            <CardTitle>{t("subscription_tier")} & Tokens</CardTitle>
            <CardDescription>{t("manage_plan_ai") || "Manage your plan and AI token balance."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div 
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.tier === "free" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setFormData({ ...formData, tier: "free" })}
              >
                <p className="font-bold text-lg">{t("free_plan")}</p>
                <div className="mt-4 mb-4">
                  <span className="text-2xl font-bold">{formatCurrency((convertBasePrice(globalConfig?.tiers?.free?.price || 0, formData.currency)), formData.currency)}</span>
                  <span className="text-sm text-muted-foreground">{t("monthly") || "/mo"}</span>
                </div>
                <div className="space-y-2 mt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{globalConfig?.tiers?.free?.memberLimit || 1} {t("user_singular") || "User"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{globalConfig?.tiers?.free?.aiTokens || 30} {t("ai_actions_mo") || "AI Actions/month"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{t("basic_crm_features") || "Basic CRM Features"}</span>
                  </div>
                </div>
              </div>
              <div 
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col",
                  formData.tier === "pro" ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setFormData({ ...formData, tier: "pro" })}
              >
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <p className="font-bold text-lg">{t("pro_plan")}</p>
                <div className="mt-4 mb-4">
                  <span className="text-2xl font-bold">{formatCurrency((convertBasePrice(globalConfig?.tiers?.pro?.price || 29, formData.currency)), formData.currency)}</span>
                  <span className="text-sm text-muted-foreground">{t("monthly") || "/mo"}</span>
                </div>
                <div className="space-y-2 mt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{t("up_to_users") || "Up to"} {globalConfig?.tiers?.pro?.memberLimit || 5} {t("users") || "Users"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{globalConfig?.tiers?.pro?.aiTokens || 200} {t("ai_actions_mo") || "AI Actions/month"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{t("automated_outreach") || "Advanced Automated Outreach"}</span>
                  </div>
                </div>
                <p className="text-[10px] mt-4 text-primary font-medium italic">{t("byok_standard")}</p>
              </div>
              <div 
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col",
                  formData.tier === "enterprise" ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setFormData({ ...formData, tier: "enterprise" })}
              >
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <p className="font-bold text-lg">{t("enterprise_plan") || "Enterprise"}</p>
                <div className="mt-4 mb-4">
                  <span className="text-2xl font-bold">{formatCurrency((convertBasePrice(globalConfig?.tiers?.enterprise?.price || 79, formData.currency)), formData.currency)}</span>
                  <span className="text-sm text-muted-foreground">{t("monthly") || "/mo"}</span>
                </div>
                <div className="space-y-2 mt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{globalConfig?.tiers?.enterprise?.memberLimit || 100} {t("users")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{globalConfig?.tiers?.enterprise?.aiTokens || 1000} {t("ai_actions_mo") || "AI Actions/month"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{t("dedicated_manager") || "Dedicated Account Manager"}</span>
                  </div>
                </div>
                <p className="text-[10px] mt-4 text-primary font-medium italic">{t("byok_standard")}</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{t("ai_token_balance") || "AI Action Balance"}</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.aiTokens || 0} {t("tokens_remaining") || "actions remaining."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed border-l-2 border-primary/20 pl-2">
                    <strong className="text-foreground">{t("what_is_token")}</strong> {t("token_explanation")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Get more AI Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['small', 'medium', 'large'].map((pk) => {
                  const p = globalConfig?.tokenPackages?.[pk];
                  if (!p) return null;
                  return (
                    <div key={pk} className="border border-border/50 rounded-lg p-4 flex flex-col items-center text-center bg-card shadow-sm">
                      <p className="font-semibold text-sm">{p.name || `${pk} Package`}</p>
                      <p className="text-2xl font-bold my-2 text-primary">{p.tokens}</p>
                      <p className="text-xs text-muted-foreground mb-4">actions</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-auto"
                        onClick={() => {
                          alert(`This would open a Stripe checkout for $${p.price} to get ${p.tokens} tokens.`);
                        }}
                      >
                        {formatCurrency(convertBasePrice(p.price, formData.currency), formData.currency)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("team_management")}</CardTitle>
            <CardDescription>
              {t("team_members")} ({teamMembers.length} / {globalConfig?.tiers?.[formData.tier]?.memberLimit || (formData.tier === "enterprise" ? "∞" : (formData.tier === "pro" ? 5 : 1))})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {teamMembers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {member.displayName?.charAt(0) || member.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.displayName || member.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  {member.uid !== user?.uid && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {invitations.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("pending_invitations")}
                </h4>
                {invitations.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs">
                        ?
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => cancelInvitation(inv.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">{t("invite_member")}</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="colleague@example.com" 
                  value={inviteEmail ?? ""}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button 
                  onClick={handleInvite} 
                  disabled={inviting || !inviteEmail}
                  className="gap-2 shrink-0"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {t("invite_member")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("invite_desc")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ai_configuration") || "AI Configuration"}</CardTitle>
            <CardDescription>{t("ai_config_desc") || "The system provides a default token-based API key. Optionally, configure your own custom Gemini API key for higher limits."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("gemini_api_key")} (Optional)</label>
              <Input 
                type="password"
                value={formData.geminiApiKey ?? ""} 
                onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..." 
                disabled={!(["pro", "growth", "enterprise"].includes(settings?.tier || userProfile?.tier || (userProfile?.role === "super_admin" ? "enterprise" : "free")))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {!(["pro", "growth", "enterprise"].includes(settings?.tier || userProfile?.tier || (userProfile?.role === "super_admin" ? "enterprise" : "free"))) ? (
                  <span className="text-orange-500 font-medium">Bring Your Own Key (BYOK) is only available on paid plans. </span>
                ) : null}
                {t("dont_have_api_key")} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{t("get_free_gemini_key") || "Get a free Gemini API key from Google AI Studio"}</a>.
              </p>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("ai_model")}</label>
              <Select 
                value={formData.aiModel || "gemini-2.5-flash"} 
                onValueChange={(val: string) => setFormData({ ...formData, aiModel: val })}
                disabled={!formData.geminiApiKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-3.1-pro-preview" disabled={!formData.geminiApiKey}>Gemini 3.1 Pro Preview</SelectItem>
                  <SelectItem value="gemini-3.1-flash-lite" disabled={!formData.geminiApiKey}>Gemini 3.1 Flash Lite</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {t("ai_model_desc")}
                {!formData.geminiApiKey && (
                  <span className="block mt-1 text-primary font-medium">
                    Note: Premium models are only available when using your own custom API key (BYOK).
                  </span>
                )}
              </p>
            </div>

            <div className="grid gap-2 border-t pt-6">
              <label className="text-sm font-medium">OpenAI API Key (Optional)</label>
              <Input 
                type="password"
                value={formData.openaiApiKey ?? ""} 
                onChange={e => setFormData({ ...formData, openaiApiKey: e.target.value })}
                placeholder="sk-proj-..." 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide an OpenAI API key to enable high-quality natural voice generation (TTS) during conversations with the AI Assistant. If empty, the system will use the browser's built-in voice.
              </p>
            </div>

            <div className="grid gap-2 mt-2">
              <label className="text-sm font-medium">OpenAI Voice</label>
              <Select 
                value={formData.openAiVoice || "alloy"} 
                onValueChange={(val: string) => setFormData({ ...formData, openAiVoice: val })}
                disabled={!formData.openaiApiKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                  <SelectItem value="echo">Echo (Male)</SelectItem>
                  <SelectItem value="fable">Fable (British/Male)</SelectItem>
                  <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                  <SelectItem value="nova">Nova (Female)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Clear Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4 mt-6">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-primary">Autonomous Flywheel (Auto-Pilot)</label>
                <p className="text-sm text-muted-foreground mr-8">
                  Allow the AI agent to execute non-destructive workflow automations, send pre-approved nurture emails, and execute proactive deal management in the background without manual approval.
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                <Button 
                  variant={formData.autopilotEnabled ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, autopilotEnabled: !formData.autopilotEnabled })}
                  className={formData.autopilotEnabled ? "bg-primary text-primary-foreground font-bold" : ""}
                >
                  {formData.autopilotEnabled ? "ENABLED" : "DISABLED"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Scoring</CardTitle>
            <CardDescription>Configure scoring frameworks and criterion percentages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Primary Framework</label>
              <Select 
                value={formData.leadScoringFramework || "BANT"} 
                onValueChange={(val: "BANT" | "MEDDIC" | "CHAMP") => setFormData({ 
                  ...formData, 
                  leadScoringFramework: val,
                  leadScoringWeights: val === "BANT" ? { Budget: 25, Authority: 25, Need: 30, Timeline: 20 } :
                                      val === "MEDDIC" ? { Metrics: 15, EconomicBuyer: 20, DecisionCriteria: 15, DecisionProcess: 15, IdentifyPain: 20, Champion: 15 } :
                                      { Challenges: 30, Authority: 25, Money: 25, Prioritization: 20 }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANT">BANT (Budget, Authority, Need, Timeline)</SelectItem>
                  <SelectItem value="MEDDIC">MEDDIC (Metrics, Economic Buyer, Decision Criteria...)</SelectItem>
                  <SelectItem value="CHAMP">CHAMP (Challenges, Authority, Money, Prioritization)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Framework Weights (%)</h4>
              {Object.keys(formData.leadScoringWeights || {}).map((key) => (
                <div key={key} className="grid gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>{key}</span>
                    <span className="text-muted-foreground">{formData.leadScoringWeights?.[key] || 0}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={formData.leadScoringWeights?.[key] || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        leadScoringWeights: {
                          ...formData.leadScoringWeights,
                          [key]: val
                        }
                      });
                    }}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Note: For a perfect 100-point scale, ensure all weights sum to 100%.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Voice</CardTitle>
            <CardDescription>Configure the tone and style for AI-generated communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tone</label>
              <Select 
                value={formData.brandVoice?.tone || "Professional"} 
                onValueChange={(val) => setFormData({ ...formData, brandVoice: { ...(formData.brandVoice || {}), tone: val } as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Formality Level</span>
                <span className="text-muted-foreground">{formData.brandVoice?.formalityLevel || 3}/5</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1"
                value={formData.brandVoice?.formalityLevel || 3}
                onChange={(e) => setFormData({ ...formData, brandVoice: { ...(formData.brandVoice || {}), formalityLevel: parseInt(e.target.value) } as any })}
                className="w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Greeting Preference</label>
                <Input 
                  value={formData.brandVoice?.greetingPreference || ""} 
                  onChange={(e) => setFormData({ ...formData, brandVoice: { ...(formData.brandVoice || {}), greetingPreference: e.target.value } as any })}
                  placeholder="e.g. Hi [Name],"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Closing Preference</label>
                <Input 
                  value={formData.brandVoice?.closingPreference || ""} 
                  onChange={(e) => setFormData({ ...formData, brandVoice: { ...(formData.brandVoice || {}), closingPreference: e.target.value } as any })}
                  placeholder="e.g. Best regards,"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Prohibited Phrases</label>
              <Input 
                value={formData.brandVoice?.prohibitedPhrases || ""} 
                onChange={(e) => setFormData({ ...formData, brandVoice: { ...(formData.brandVoice || {}), prohibitedPhrases: e.target.value } as any })}
                placeholder="Comma separated words or phrases the AI should never use"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("company_profile")}</CardTitle>
            <CardDescription>{t("company_profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("company_name")}</label>
              <Input 
                value={formData.companyName ?? ""} 
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Aiappsy CRM" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("email")}</label>
              <Input 
                value={formData.email ?? ""} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@aiappsy.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("website")}</label>
              <Input 
                value={formData.website ?? ""} 
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://aiappsy.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("vat_region")}</label>
              <Select 
                value={formData.vatRegion ?? ""} 
                onValueChange={(val: any) => setFormData({ ...formData, vatRegion: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO">{t("norway")}</SelectItem>
                  <SelectItem value="SE">{t("sweden")}</SelectItem>
                  <SelectItem value="DK">{t("denmark")}</SelectItem>
                  <SelectItem value="INT">{t("international")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("default_currency") || "Default Currency"}</label>
              <Select 
                value={formData.currency ?? ""} 
                onValueChange={(val: string) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="NOK">NOK (kr)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("smtp_settings")}</CardTitle>
              <CardDescription>{t("smtp_settings_desc")}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={useGmailDefaults} className="gap-2">
              <Mail className="h-4 w-4" />
              {t("use_gmail_defaults")}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_host")}</label>
              <Input 
                value={formData.smtpHost ?? ""} 
                onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.example.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_port")}</label>
              <Input 
                value={formData.smtpPort ?? ""} 
                onChange={e => setFormData({ ...formData, smtpPort: e.target.value })}
                placeholder="587" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_user")}</label>
              <Input 
                value={formData.smtpUser ?? ""} 
                onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="user@example.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_pass")}</label>
              <Input 
                type="password"
                value={formData.smtpPass ?? ""} 
                onChange={e => setFormData({ ...formData, smtpPass: e.target.value })}
                placeholder="••••••••" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("notifications")}</CardTitle>
            <CardDescription>{t("notifications_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("email_notifications")}</p>
                <p className="text-sm text-muted-foreground">{t("email_notifications_desc")}</p>
              </div>
              <Button variant="outline">{t("enabled")}</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("push_notifications")}</p>
                <p className="text-sm text-muted-foreground">{t("push_notifications_desc")}</p>
              </div>
              <Button 
                variant={Notification.permission === "granted" ? "default" : "outline"}
                onClick={() => {
                  if (Notification.permission !== "granted") {
                    Notification.requestPermission().then(perm => {
                      if (perm === "granted") {
                        new Notification("Notifications enabled!");
                        // Force re-render to update button
                        setFormData({ ...formData });
                      } else {
                        alert("Permission denied. Check your browser settings.");
                      }
                    });
                  } else {
                    alert("Push Notifications are already enabled for this browser.");
                  }
                }}
              >
                {Notification.permission === "granted" ? t("enabled") : t("disabled")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer & Testing</CardTitle>
            <CardDescription>Tools for testing the application capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Seed Mock Data</p>
                <p className="text-sm text-muted-foreground">Generates fake customers, products, and a pending invoice to test the AI assistant.</p>
              </div>
              <Button onClick={seedMockData} variant="secondary" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Seed Test Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
