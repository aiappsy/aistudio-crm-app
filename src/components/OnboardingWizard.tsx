import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Building2, Globe, Sparkles } from "lucide-react";

export function OnboardingWizard() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    companyName: "",
    currency: "USD",
    vatNumber: "",
    aiModel: "default",
    geminiApiKey: "",
    openRouterApiKey: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setUserProfile(data);
            if (data.onboardingCompleted !== true) {
              setOpen(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: userProfile.companyName || "",
        currency: userProfile.currency || "USD",
        vatNumber: userProfile.vatNumber || "",
      }));
    }
  }, [userProfile]);

  const handleSkip = async () => {
    try {
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          onboardingCompleted: true,
        });
      }
      setOpen(false);
    } catch (e) {
      console.error("Failed to skip onboarding", e);
      setOpen(false); // Close anyway so they aren't stuck
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (user) {
        const updateData: any = {
          companyName: formData.companyName,
          currency: formData.currency,
          vatNumber: formData.vatNumber,
          onboardingCompleted: true,
        };
        
        // Save API keys if provided
        if (formData.aiModel === "custom_gemini" && formData.geminiApiKey) {
          updateData.geminiApiKey = formData.geminiApiKey;
        } else if (formData.aiModel === "custom_openrouter" && formData.openRouterApiKey) {
          updateData.openRouterApiKey = formData.openRouterApiKey;
        }

        await updateDoc(doc(db, "users", user.uid), updateData);
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      // Don't allow closing by clicking outside
      if (!open) handleSkip();
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/3 bg-muted/50 p-6 hidden sm:block border-r">
            <h3 className="font-semibold text-lg mb-6">Setup Guide</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <span className={`text-sm ${step >= 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Company Details</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className={`text-sm ${step >= 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Preferences</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <span className={`text-sm ${step >= 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>AI Settings</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Welcome! Let's set up your workspace</h2>
                  <p className="text-sm text-muted-foreground">What's the name of your company or organization?</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input 
                      placeholder="e.g. Acme Corp" 
                      value={formData.companyName} 
                      onChange={e => setFormData({...formData, companyName: e.target.value})} 
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">VAT / Tax ID (Optional)</label>
                    <Input 
                      placeholder="e.g. NO123456789MVA" 
                      value={formData.vatNumber} 
                      onChange={e => setFormData({...formData, vatNumber: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Localization Preferences</h2>
                  <p className="text-sm text-muted-foreground">How do you want to manage your CRM data?</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Currency</label>
                    <Select value={formData.currency} onValueChange={val => setFormData({ ...formData, currency: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                        <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                        <SelectItem value="NOK">kr NOK - Norwegian Krone</SelectItem>
                        <SelectItem value="SEK">kr SEK - Swedish Krona</SelectItem>
                        <SelectItem value="DKK">kr DKK - Danish Krone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interface Language</label>
                    <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="no">Norsk (Norwegian)</SelectItem>
                        <SelectItem value="sv">Svenska (Swedish)</SelectItem>
                        <SelectItem value="da">Dansk (Danish)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">AI Capabilities</h2>
                  <p className="text-sm text-muted-foreground">Choose how your AI assistant will be powered.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Model Provider</label>
                    <Select value={formData.aiModel} onValueChange={val => setFormData({ ...formData, aiModel: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Included AI (Ready to go)</SelectItem>
                        <SelectItem value="custom_gemini">Use my own Gemini Key (Google AI Studio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.aiModel === "default" && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-sm flex gap-3 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        <strong>Ready to go!</strong> Our system uses Google's latest Gemini Flash models which are extremely fast and cost-effective. Your plan's AI action limits apply.
                      </div>
                    </div>
                  )}

                  {formData.aiModel === "custom_gemini" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-sm font-medium">Gemini API Key</label>
                      <Input 
                        placeholder="AIzaSy..." 
                        type="password"
                        value={formData.geminiApiKey} 
                        onChange={e => setFormData({...formData, geminiApiKey: e.target.value})} 
                      />
                      <p className="text-xs text-muted-foreground">You can get a free key from Google AI Studio. This enables unlimited AI usage.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">Skip for now</Button>
              <div className="space-x-2">
                {step > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button onClick={nextStep}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Complete Setup
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
