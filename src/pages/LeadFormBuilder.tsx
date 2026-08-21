import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, Check, Eye, Code, Smartphone, Monitor } from "lucide-react";

export default function LeadFormBuilder() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Get in Touch");
  const [desc, setDesc] = useState("Please fill out the form below to connect with us.");
  const [theme, setTheme] = useState("glass"); // light, dark, glass
  const [color, setColor] = useState("indigo"); // indigo, blue, emerald, violet, rose
  const [fields, setFields] = useState({
    name: true,
    email: true,
    phone: true,
    company: true,
    notes: true
  });
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Generate URL & Iframe
  const visibleFieldsQuery = Object.entries(fields)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name)
    .join(",");

  const host = window.location.origin;
  const publicFormUrl = `${host}/forms/${user?.uid}?theme=${theme}&color=${color}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}&fields=${visibleFieldsQuery}`;
  const iframeCode = `<iframe src="${publicFormUrl}" width="100%" height="600px" style="border:none;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,0.1);background:transparent;" allowtransparency="true"></iframe>`;

  const copyToClipboard = (type: "link" | "embed", text: string) => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  // Styles for live preview
  const getPreviewBg = () => {
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

  const getPreviewCard = () => {
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

  const getPreviewColor = () => {
    switch (color) {
      case "blue":
        return { btn: "bg-blue-600", text: "text-blue-500", border: "focus:border-blue-500" };
      case "emerald":
        return { btn: "bg-emerald-600", text: "text-emerald-500", border: "focus:border-emerald-500" };
      case "violet":
        return { btn: "bg-violet-600", text: "text-violet-500", border: "focus:border-violet-500" };
      case "rose":
        return { btn: "bg-rose-600", text: "text-rose-500", border: "focus:border-rose-500" };
      case "indigo":
      default:
        return { btn: "bg-indigo-600", text: "text-indigo-500", border: "focus:border-indigo-500" };
    }
  };

  const activeColor = getPreviewColor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Capture Form Builder</h1>
        <p className="text-muted-foreground">Create inbound contact forms to embed on your website and capture leads directly into your pipeline.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Form Settings */}
        <div className="xl:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Configuration</CardTitle>
              <CardDescription>Customize the content, fields, and appearance of your web form.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Titles */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input 
                    id="form-title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Get in Touch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-desc">Form Description</Label>
                  <textarea 
                    id="form-desc" 
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    value={desc} 
                    onChange={e => setDesc(e.target.value)} 
                    placeholder="Describe what the form is for..."
                  />
                </div>
              </div>

              {/* Visible Fields */}
              <div className="space-y-3">
                <Label>Form Fields</Label>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border">
                  {Object.entries(fields).map(([fieldName, checked]) => (
                    <div key={fieldName} className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        id={`field-${fieldName}`} 
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                        checked={checked}
                        disabled={fieldName === "name" || fieldName === "email"}
                        onChange={e => setFields({ ...fields, [fieldName]: e.target.checked })}
                      />
                      <label htmlFor={`field-${fieldName}`} className="text-sm font-medium capitalize cursor-pointer">
                        {fieldName} { (fieldName === "name" || fieldName === "email") && <span className="text-rose-500 font-bold">*</span> }
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Settings */}
              <div className="space-y-3">
                <Label>Theme Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["glass", "dark", "light"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-3 text-xs font-semibold hover:bg-accent cursor-pointer text-center capitalize transition-all ${theme === t ? "border-primary bg-accent text-accent-foreground" : "border-muted bg-popover"}`}
                    >
                      {t === "glass" ? "Glassmorphic" : t === "dark" ? "Deep Dark" : "Modern Light"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Settings */}
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex gap-3">
                  {["indigo", "blue", "emerald", "violet", "rose"].map((c) => {
                    const bgClass = 
                      c === "indigo" ? "bg-indigo-600" :
                      c === "blue" ? "bg-blue-600" :
                      c === "emerald" ? "bg-emerald-600" :
                      c === "violet" ? "bg-violet-600" : "bg-rose-600";
                    
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full border-2 ${bgClass} transition-transform ${color === c ? "scale-125 ring-2 ring-ring ring-offset-2 border-white" : "border-transparent"}`}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Real-time Live Preview */}
        <div className="xl:col-span-7 space-y-6">
          <Card className="overflow-hidden flex flex-col h-[560px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Eye className="w-4 h-4 text-primary" /> Real-time Preview</CardTitle>
                <CardDescription className="text-xs">This is how your live form will appear on your website.</CardDescription>
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 border">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${previewMode === "desktop" ? "bg-background shadow-sm font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${previewMode === "mobile" ? "bg-background shadow-sm font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </CardHeader>
            <CardContent className={`flex-1 overflow-auto flex items-center justify-center p-6 transition-all duration-500 ${getPreviewBg()}`}>
              <div className={`transition-all duration-300 w-full ${previewMode === "mobile" ? "max-w-[340px]" : "max-w-[460px]"}`}>
                {/* Form Card Mockup */}
                <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${getPreviewCard()}`}>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    <p className={`text-xs mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>{desc}</p>
                  </div>

                  <div className="space-y-3">
                    {fields.name && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold opacity-70">Name</span>
                        <div className={`h-8 px-2 rounded border text-xs flex items-center opacity-60 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>Jane Doe</div>
                      </div>
                    )}
                    {fields.email && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold opacity-70">Email</span>
                        <div className={`h-8 px-2 rounded border text-xs flex items-center opacity-60 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>jane@example.com</div>
                      </div>
                    )}
                    {fields.phone && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold opacity-70">Phone</span>
                        <div className={`h-8 px-2 rounded border text-xs flex items-center opacity-60 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>+47 900 00 000</div>
                      </div>
                    )}
                    {fields.company && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold opacity-70">Company</span>
                        <div className={`h-8 px-2 rounded border text-xs flex items-center opacity-60 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>Acme Corp</div>
                      </div>
                    )}
                    {fields.notes && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold opacity-70">Message</span>
                        <div className={`h-16 p-2 rounded border text-xs opacity-60 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>Inquiry details...</div>
                      </div>
                    )}
                  </div>

                  <div className={`h-9 rounded font-bold text-xs flex items-center justify-center text-white cursor-not-allowed ${activeColor.btn}`}>
                    Submit Request
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Panel: Publish & Embed */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-1.5"><Code className="w-5 h-5 text-primary" /> Publish & Embed Your Form</CardTitle>
          <CardDescription>Use the following links to share the form or embed it into your website pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Link */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Direct Link</h4>
            <div className="flex gap-2">
              <Input readOnly value={publicFormUrl} className="bg-muted font-mono text-xs h-10 flex-1" />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard("link", publicFormUrl)} 
                className="gap-2 h-10 w-32 justify-center"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="default" onClick={() => window.open(publicFormUrl, "_blank")} className="h-10">
                Test Form
              </Button>
            </div>
          </div>

          {/* Iframe Embed */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">HTML Embed Code (Iframe)</h4>
            <div className="flex gap-2">
              <Input readOnly value={iframeCode} className="bg-muted font-mono text-xs h-10 flex-1" />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard("embed", iframeCode)} 
                className="gap-2 h-10 w-32 justify-center"
              >
                {copiedEmbed ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedEmbed ? "Copied!" : "Copy Code"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Copy and paste this code block directly into the HTML of your page (e.g. inside WordPress, Webflow, or Shopify Custom HTML module).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
