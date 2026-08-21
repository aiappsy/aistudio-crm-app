import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, Send, Globe, ShieldCheck } from "lucide-react";

export default function PublicLeadForm() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [searchParams] = useSearchParams();

  // Customization Options from Query Parameters
  const theme = searchParams.get("theme") || "glass"; // light, dark, glass
  const color = searchParams.get("color") || "indigo"; // indigo, blue, emerald, violet, rose
  const customTitle = searchParams.get("title") || "Get in Touch";
  const customDesc = searchParams.get("desc") || "Leave your details below and our team will get back to you shortly.";
  const visibleFields = (searchParams.get("fields") || "name,email,phone,company,notes").split(",");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    honeypot: "" // Simple anti-spam honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Theme Styling
  const getThemeClass = () => {
    switch (theme) {
      case "dark":
        return "bg-slate-950 text-slate-100 border-slate-800 shadow-slate-950/50";
      case "light":
        return "bg-white text-slate-900 border-slate-200 shadow-slate-200/50";
      case "glass":
      default:
        return "bg-white/10 backdrop-blur-md text-white border-white/20 shadow-white/5";
    }
  };

  const getBackgroundClass = () => {
    switch (theme) {
      case "dark":
        return "bg-slate-900";
      case "light":
        return "bg-slate-50";
      case "glass":
      default:
        return "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950";
    }
  };

  const getColorClass = () => {
    switch (color) {
      case "blue":
        return {
          btn: "bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-500",
          text: "text-blue-500",
          inputFocus: "focus:border-blue-500 focus:ring-blue-500/20",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "emerald":
        return {
          btn: "bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500",
          text: "text-emerald-500",
          inputFocus: "focus:border-emerald-500 focus:ring-emerald-500/20",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "violet":
        return {
          btn: "bg-violet-600 hover:bg-violet-500 text-white focus-visible:ring-violet-500",
          text: "text-violet-500",
          inputFocus: "focus:border-violet-500 focus:ring-violet-500/20",
          badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        };
      case "rose":
        return {
          btn: "bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-500",
          text: "text-rose-500",
          inputFocus: "focus:border-rose-500 focus:ring-rose-500/20",
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      case "indigo":
      default:
        return {
          btn: "bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-indigo-500",
          text: "text-indigo-500",
          inputFocus: "focus:border-indigo-500 focus:ring-indigo-500/20",
          badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        };
    }
  };

  const style = getColorClass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return; // Silent discard for bots
    if (!ownerId) {
      setError("No owner ID provided for this form.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          notes: formData.notes,
          ownerId: ownerId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${getBackgroundClass()}`}>
      <div className={`w-full max-w-lg rounded-2xl border p-8 shadow-2xl transition-all duration-300 ${getThemeClass()}`}>
        {submitted ? (
          <div className="text-center py-12 space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mb-2 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Thank You!</h2>
            <p className={`${theme === "light" ? "text-slate-500" : "text-slate-300"} max-w-sm mx-auto`}>
              Your information has been successfully received. A representative will contact you shortly.
            </p>
            <div className="pt-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${style.badge}`}>
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Lead Capture
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">{customTitle}</h1>
              <p className={`text-sm ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>{customDesc}</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                {error}
              </div>
            )}

            {/* Anti-spam honeypot */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={e => setFormData({ ...formData, honeypot: e.target.value })}
              className="hidden"
              autoComplete="off"
            />

            <div className="space-y-4">
              {visibleFields.includes("name") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full h-11 px-3.5 rounded-lg border transition-all ${
                      theme === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-900" 
                        : "bg-slate-900/50 border-slate-800 text-white"
                    } ${style.inputFocus} outline-none`}
                    placeholder="Jane Doe"
                  />
                </div>
              )}

              {visibleFields.includes("email") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full h-11 px-3.5 rounded-lg border transition-all ${
                      theme === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-900" 
                        : "bg-slate-900/50 border-slate-800 text-white"
                    } ${style.inputFocus} outline-none`}
                    placeholder="jane@example.com"
                  />
                </div>
              )}

              {visibleFields.includes("phone") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full h-11 px-3.5 rounded-lg border transition-all ${
                      theme === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-900" 
                        : "bg-slate-900/50 border-slate-800 text-white"
                    } ${style.inputFocus} outline-none`}
                    placeholder="+47 900 00 000"
                  />
                </div>
              )}

              {visibleFields.includes("company") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className={`w-full h-11 px-3.5 rounded-lg border transition-all ${
                      theme === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-900" 
                        : "bg-slate-900/50 border-slate-800 text-white"
                    } ${style.inputFocus} outline-none`}
                    placeholder="Acme Corp"
                  />
                </div>
              )}

              {visibleFields.includes("notes") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Inquiry / Message</label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className={`w-full p-3.5 rounded-lg border transition-all resize-none ${
                      theme === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-900" 
                        : "bg-slate-900/50 border-slate-800 text-white"
                    } ${style.inputFocus} outline-none`}
                    placeholder="Tell us how we can help you..."
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full h-12 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 ${style.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Request
                </>
              )}
            </button>

            <div className="flex justify-between items-center text-[10px] opacity-40 pt-4 border-t border-slate-800/10 dark:border-slate-100/10">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Powered by Aiappsy CRM</span>
              <span>Secure 256-bit SSL</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
