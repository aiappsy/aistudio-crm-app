import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, CreditCard, Sparkles, Globe, Zap, Mail, Calendar, FileText } from "lucide-react";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, GoogleAuthProvider, linkWithPopup, signInWithPopup, fetchSignInMethodsForEmail } from "firebase/auth";

interface GoogleIntegration {
  connectedEmail?: string;
  refreshToken?: string;
  gmailEnabled?: boolean;
  calendarEnabled?: boolean;
  driveEnabled?: boolean;
  updatedAt?: any;
}

interface IntegrationSettings {
  geminiApiKey: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  aiModel: string;
  googleIntegration?: GoogleIntegration;
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
    aiModel: "gemini-2.5-flash",
    googleIntegration: {
      gmailEnabled: false,
      calendarEnabled: false,
      driveEnabled: false,
    }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        geminiApiKey: settings.geminiApiKey || "",
        stripePublishableKey: settings.stripePublishableKey || "",
        stripeSecretKey: settings.stripeSecretKey || "",
        aiModel: settings.aiModel || "gemini-2.5-flash",
        googleIntegration: settings.googleIntegration || {
          gmailEnabled: false,
          calendarEnabled: false,
          driveEnabled: false,
        }
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

  const handleConnectGoogle = async (type: 'gmail' | 'calendar' | 'drive', scope: string) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;
      const provider = new GoogleAuthProvider();
      provider.addScope(scope);
      // Ask for offline access to potentially get a refresh token in the backend later
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: 'consent'
      });
      
      let result;
      try {
        result = await linkWithPopup(auth.currentUser, provider);
      } catch (err: any) {
        // If already linked or credential in use, fall back to signInWithPopup
        if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/provider-already-linked') {
          result = await signInWithPopup(auth, provider);
        } else {
          throw err;
        }
      }
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || "ENCRYPTED_REFRESH_TOKEN"; // Fallback representation
      const email = result.user.email || "user@gmail.com";

      const currentGoogle = formData.googleIntegration || {};
      const newGoogle: GoogleIntegration = {
        ...currentGoogle,
        connectedEmail: email,
        refreshToken: token,
        updatedAt: serverTimestamp(),
      };

      if (type === 'gmail') newGoogle.gmailEnabled = true;
      if (type === 'calendar') newGoogle.calendarEnabled = true;
      if (type === 'drive') newGoogle.driveEnabled = true;

      const newFormData = { ...formData, googleIntegration: newGoogle };
      setFormData(newFormData);
      
      // Auto-save
      await saveSettings(newFormData);
    } catch (err) {
      console.error("Error connecting Google Workspace:", err);
      alert("Failed to connect Google Workspace. Please try again.");
    }
  };

  const handleDisconnectGoogle = async (type: 'gmail' | 'calendar' | 'drive') => {
    const currentGoogle = formData.googleIntegration || {};
    const newGoogle: GoogleIntegration = { ...currentGoogle };

    if (type === 'gmail') newGoogle.gmailEnabled = false;
    if (type === 'calendar') newGoogle.calendarEnabled = false;
    if (type === 'drive') newGoogle.driveEnabled = false;

    // If none are enabled anymore, clear token
    if (!newGoogle.gmailEnabled && !newGoogle.calendarEnabled && !newGoogle.driveEnabled) {
      newGoogle.connectedEmail = "";
      newGoogle.refreshToken = "";
    }

    const newFormData = { ...formData, googleIntegration: newGoogle };
    setFormData(newFormData);
    await saveSettings(newFormData);
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
          <h1 className="text-3xl font-bold tracking-tight">{t("integrations") || "Integrations"}</h1>
          <p className="text-muted-foreground">{t("integrations_desc") || "Connect your own services to power your CRM."}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : null)}
          Save Integrations
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Google Workspace Integration */}
        <Card className="border-green-500/20 shadow-lg shadow-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Google Workspace Integrations</CardTitle>
                <CardDescription>Authorize access to Gmail, Calendar, and Drive incrementally.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid gap-4 sm:grid-cols-3">
               
               {/* Gmail */}
               <div className="border border-border/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 font-semibold text-lg">
                      <Mail className="h-5 w-5 text-red-500" /> Gmail
                   </div>
                   <p className="text-sm text-muted-foreground">Read and send emails directly from the CRM.</p>
                 </div>
                 {formData.googleIntegration?.gmailEnabled ? (
                   <div className="space-y-3">
                     <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                       <CheckCircle2 className="h-4 w-4" /> Connected as {formData.googleIntegration.connectedEmail}
                     </div>
                     <Button variant="outline" className="w-full" onClick={() => handleDisconnectGoogle('gmail')}>Disconnect</Button>
                   </div>
                 ) : (
                   <Button className="w-full" onClick={() => handleConnectGoogle('gmail', 'https://www.googleapis.com/auth/gmail.readonly')}>Connect Gmail</Button>
                 )}
               </div>

               {/* Calendar */}
               <div className="border border-border/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 font-semibold text-lg">
                      <Calendar className="h-5 w-5 text-blue-500" /> Google Calendar
                   </div>
                   <p className="text-sm text-muted-foreground">Sync events and meetings automatically.</p>
                 </div>
                 {formData.googleIntegration?.calendarEnabled ? (
                   <div className="space-y-3">
                     <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                       <CheckCircle2 className="h-4 w-4" /> Connected as {formData.googleIntegration.connectedEmail}
                     </div>
                     <Button variant="outline" className="w-full" onClick={() => handleDisconnectGoogle('calendar')}>Disconnect</Button>
                   </div>
                 ) : (
                   <Button className="w-full" onClick={() => handleConnectGoogle('calendar', 'https://www.googleapis.com/auth/calendar')}>Connect Calendar</Button>
                 )}
               </div>

               {/* Drive */}
               <div className="border border-border/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 font-semibold text-lg">
                      <FileText className="h-5 w-5 text-yellow-500" /> Google Drive
                   </div>
                   <p className="text-sm text-muted-foreground">Store proposals and client files securely.</p>
                 </div>
                 {formData.googleIntegration?.driveEnabled ? (
                   <div className="space-y-3">
                     <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                       <CheckCircle2 className="h-4 w-4" /> Connected as {formData.googleIntegration.connectedEmail}
                     </div>
                     <Button variant="outline" className="w-full" onClick={() => handleDisconnectGoogle('drive')}>Disconnect</Button>
                   </div>
                 ) : (
                   <Button className="w-full" onClick={() => handleConnectGoogle('drive', 'https://www.googleapis.com/auth/drive.file')}>Connect Drive</Button>
                 )}
               </div>

             </div>
          </CardContent>
        </Card>

        {/* Stripe Integration */}

        <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{t("stripe_payments") || "Stripe Payments"}</CardTitle>
                <CardDescription>{t("accept_credit_cards") || "Accept credit card payments on your invoices."}</CardDescription>
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
                  <span>{t("stripe_step_1")} <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Stripe Dashboard</a>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>{t("stripe_step_2")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>{t("stripe_step_3")}</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("publishable_key") || "Publishable Key"}</label>
                <Input 
                  value={formData.stripePublishableKey ?? ""} 
                  onChange={e => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                  placeholder="pk_test_..." 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("secret_key") || "Secret Key"}</label>
                <Input 
                  type="password"
                  value={formData.stripeSecretKey ?? ""} 
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
                <CardTitle>{t("gemini_ai_intelligence") || "Gemini AI Intelligence"}</CardTitle>
                <CardDescription>{t("power_your_ai") || "Power your outreach and research with your own AI key."}</CardDescription>
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
                  <span>{t("ai_step_1")} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>{t("ai_step_2")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>{t("ai_step_3")}</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("gemini_api_key") || "Gemini API Key"}</label>
                <Input 
                  type="password"
                  value={formData.geminiApiKey ?? ""} 
                  onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="Paste your API key here" 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("preferred_ai_model") || "Preferred AI Model"}</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.aiModel ?? ""}
                  onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash ({t("recommended") || "Recommended"})</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                </select>
                {formData.aiModel !== "gemini-2.5-flash" && (
                  <p className="text-xs mt-1 text-primary font-medium">
                    Note: Using premium models requires you to provide your own Google AI Studio API key above.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Capturing card */}
        <Card className="border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Inbound Lead Capturing</CardTitle>
                <CardDescription>Capture leads from external websites, forms, or automation tools.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-indigo-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Integration Instructions
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>
                    Use our visual <strong>Form Builder</strong> to generate fully responsive, embeddable forms.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>
                    For custom integrations (Zapier, Webflow, Make), send a <code>POST</code> request to the webhook URL below.
                  </span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Your Public Webhook URL</label>
                <div className="flex gap-2">
                  <Input 
                    readOnly
                    value={`${window.location.origin}/api/leads/webhook?ownerId=${user?.uid || "YOUR_OWNER_ID"}`}
                    className="bg-muted font-mono text-xs" 
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/leads/webhook?ownerId=${user?.uid || "YOUR_OWNER_ID"}`);
                      alert("Webhook URL copied to clipboard!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Example cURL Payload</label>
                <pre className="p-3.5 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800">
{`curl -X POST "${window.location.origin}/api/leads/webhook?ownerId=${user?.uid || "YOUR_OWNER_ID"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phone": "+47 900 00 000",
    "company": "Acme Corp",
    "notes": "Interested in premium CRM features."
  }'`}
                </pre>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Captured leads automatically appear in your Contacts pipeline with the "Lead" status.</span>
                <a href="/app/contacts/forms" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
                  Open Form Builder &rarr;
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
