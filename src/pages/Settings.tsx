import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc, useFirestoreQuery } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Mail, Globe, Sparkles, UserPlus, Trash2, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

interface UserSettings {
  companyName: string;
  email: string;
  website: string;
  geminiApiKey: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  vatRegion: "NO" | "SE" | "DK" | "INT";
  currency: string;
  aiModel: string;
  tier: "free" | "pro";
}

export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: settings, loading, set: saveSettings } = useFirestoreDoc<UserSettings>("settings", user?.uid);
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: teamMembers } = useFirestoreQuery<any>("users", [where("organizationId", "==", userProfile?.organizationId || "none")]);
  const { data: invitations } = useFirestoreQuery<any>("invitations", [where("organizationId", "==", userProfile?.organizationId || "none"), where("status", "==", "pending")]);
  
  const [formData, setFormData] = useState<UserSettings>({
    companyName: "",
    email: "",
    website: "",
    geminiApiKey: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    vatRegion: "NO",
    currency: "USD",
    aiModel: "gemini-2.0-flash",
    tier: "free",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    } else if (user) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [settings, user]);

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
    let limit = 3; // Default Free
    if (formData.tier === "pro") limit = 50;
    if (formData.tier === "enterprise") limit = 1000;

    if (teamMembers.length + invitations.length >= limit) {
      alert(t("member_limit_reached"));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("settings_desc")}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
          {t("save_changes")}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("subscription_tier")}</CardTitle>
            <CardDescription>{t("pro_features_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div 
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.tier === "free" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setFormData({ ...formData, tier: "free" })}
              >
                <p className="font-bold text-lg">{t("free_tier")}</p>
                <p className="text-sm text-muted-foreground">Basic CRM tools. No AI features.</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold">$0</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </div>
              <div 
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden",
                  formData.tier === "pro" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setFormData({ ...formData, tier: "pro" })}
              >
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <p className="font-bold text-lg">{t("pro_tier")}</p>
                <p className="text-sm text-muted-foreground">{t("pro_features_desc")}</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold">$19</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-[10px] mt-2 text-primary font-medium italic">{t("byok_desc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("team_management")}</CardTitle>
            <CardDescription>
              {t("team_members")} ({teamMembers.length} / {formData.tier === "pro" ? 50 : (formData.tier === "enterprise" ? "∞" : 3)})
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
                  value={inviteEmail}
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
            <CardTitle>{t("company_profile")}</CardTitle>
            <CardDescription>{t("company_profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("company_name")}</label>
              <Input 
                value={formData.companyName} 
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Aiappsy CRM" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("email")}</label>
              <Input 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@aiappsy.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("website")}</label>
              <Input 
                value={formData.website} 
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://aiappsy.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("vat_region")}</label>
              <Select 
                value={formData.vatRegion} 
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
              <label className="text-sm font-medium">Default Currency</label>
              <Select 
                value={formData.currency} 
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
                value={formData.smtpHost} 
                onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.example.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_port")}</label>
              <Input 
                value={formData.smtpPort} 
                onChange={e => setFormData({ ...formData, smtpPort: e.target.value })}
                placeholder="587" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_user")}</label>
              <Input 
                value={formData.smtpUser} 
                onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="user@example.com" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("smtp_pass")}</label>
              <Input 
                type="password"
                value={formData.smtpPass} 
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
              <Button variant="outline">{t("disabled")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
