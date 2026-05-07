import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Users, Zap, Shield, Globe, ArrowRight, X, DollarSign, FileText, TrendingUp, ArrowUpRight, Languages } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import DashboardPreview from "@/components/landing/DashboardPreview";
import CustomersPreview from "@/components/landing/CustomersPreview";
import { useLanguage, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "no", label: "Norsk", flag: "🇳🇴" },
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    { code: "da", label: "Dansk", flag: "🇩🇰" },
  ];

  const detailedPlanFeatures = {
    Free: {
      description: "Perfect for solo founders starting their journey.",
      ai: [
        { title: "Natural Language Commands", desc: "Tell the AI to 'Create an invoice for John' and watch it happen instantly." },
        { title: "Basic Data Insights", desc: "Ask questions about your revenue and customer counts." },
        { title: "10 AI Tokens/month", desc: "1 token equals 1 hour of active AI assistant usage." }
      ],
      core: [
        { title: "Unlimited Customers & Invoices", desc: "Store as many contacts and generate as many PDFs as you need." },
        { title: "Standard VAT Handling", desc: "Automated tax handling for NO, SE, and DK." },
        { title: "1 Team Member", desc: "Single user access with community support." }
      ]
    },
    Pro: {
      description: "For growing teams that need to close deals faster with AI.",
      ai: [
        { title: "Automated Outreach Drafting", desc: "AI drafts highly personalized Email and WhatsApp messages based on customer history." },
        { title: "Competitive Research", desc: "AI searches the web to give you insights on your competitors before a sales call." },
        { title: "Churn Risk Prediction", desc: "Proactively identifies customers who might leave so you can save the relationship." },
        { title: "Smart Business Insights", desc: "Deep analytical reports generated simply by asking 'How did we do last quarter?'" },
        { title: "20 AI Tokens/user/mo", desc: "Generous allowance for your whole team." }
      ],
      core: [
        { title: "Multi-Currency Support", desc: "Bill clients globally in USD, EUR, NOK, or GBP." },
        { title: "Up to 5 Team Members", desc: "Collaborate with your core team." },
        { title: "Priority Email Support", desc: "Get answers fast when you need them." }
      ]
    },
    Enterprise: {
      description: "For large organizations requiring custom AI and limitless scale.",
      ai: [
        { title: "Custom AI Models", desc: "Train the AI on your specific company data and sales playbooks." },
        { title: "Advanced Automation", desc: "Set up complex, multi-step AI workflows." },
        { title: "Unlimited AI Tokens", desc: "Never worry about usage limits again." }
      ],
      core: [
        { title: "Custom Integrations & API", desc: "Connect Aiappsy to your existing ERP or legacy systems." },
        { title: "Unlimited Team Members", desc: "Scale across your entire organization." },
        { title: "24/7 Phone Support & SLA", desc: "Guaranteed uptime and immediate assistance." }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">Aiappsy CRM</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#features" className="hover:text-primary transition-colors">{t("features")}</a>
              <a href="#pricing" className="hover:text-primary transition-colors">{t("pricing")}</a>
              <a href="#about" className="hover:text-primary transition-colors">{t("about")}</a>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
                  <Languages size={18} />
                  <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem 
                      key={lang.code} 
                      onClick={() => setLanguage(lang.code)}
                      className={cn(language === lang.code && "bg-accent font-medium")}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {user ? (
                <Link to="/app">
                  <Button size="sm" className="gap-2">
                    {t("go_to_dashboard")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm">{t("sign_in")}</Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm">{t("get_started")}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Layout (Recipe 11) */}
      <main className="pt-16">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                  <Sparkles className="h-3 w-3" />
                  AI-First Customer Intelligence
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] md:leading-[0.9] tracking-tighter mb-8">
                  {t("hero_title_1")}{" "}
                  <span className="text-primary italic">{t("hero_title_2")}</span>{" "}
                  <br className="hidden md:block" />
                  {t("hero_title_3")}
                </h1>
                <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed font-light">
                  {t("hero_subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link to="/auth">
                    <Button size="lg" className="h-16 px-10 text-lg gap-3 rounded-full shadow-xl shadow-primary/20">
                      {t("start_for_free")} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 80 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 2.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Live App Preview (Mimics actual Dashboard) */}
                <div className="relative z-10 rounded-3xl border border-border/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden bg-background aspect-[4/3] flex flex-col group">
                  <DashboardPreview />
                </div>
                
                {/* Floating feature bubbles (Recipe 11) */}
                <motion.div 
                  animate={{ y: [0, -15, 0], rotate: [-6, -4, -6] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -right-8 z-20 bg-background p-6 rounded-2xl shadow-2xl border border-border/50 hidden xl:block max-w-[240px]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-bold">AI Insight</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    "Customer John Doe is 85% likely to churn. Send a loyalty discount now."
                  </p>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0], rotate: [4, 6, 4] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-10 -left-12 z-20 bg-background p-6 rounded-2xl shadow-2xl border border-border/50 hidden xl:block max-w-[200px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Live Activity</span>
                  </div>
                  <p className="text-sm font-medium">Quote #124 Accepted</p>
                  <p className="text-[10px] text-muted-foreground">by Nordic Solutions AS</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>        {/* Features Grid */}
        <section id="features" className="py-32 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{t("features_title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                {t("features_subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { icon: Sparkles, title: "AI-Powered Intelligence", desc: "Our AI agent researches your leads, predicts churn, and suggests the perfect time to reach out." },
                { icon: Zap, title: "Instant Quotes & Invoices", desc: "Generate professional PDFs in seconds. Convert quotes to invoices with a single click." },
                { icon: Users, title: "Collaborative Workspace", desc: "Bring your whole team. Shared pipelines, centralized communication, and role-based access." },
                { icon: Shield, title: "Enterprise-Grade Security", desc: "Your data stays yours. Bring your own API key for AI features to maintain full privacy control." },
                { icon: Globe, title: "Global Compliance", desc: "Automated VAT handling for EU/Scandinavia and multi-currency support for international growth." },
                { icon: CheckCircle2, title: "Automated Outreach", desc: "Let AI draft your follow-ups and reminders based on customer behavior and history." }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 120, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="group p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{t("pricing_title")}</h2>
              <p className="text-xl text-muted-foreground font-light">{t("pricing_subtitle")}</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Tier */}
              <motion.div
                initial={{ opacity: 0, y: 150, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="flex flex-col rounded-[2rem] border-border/50 overflow-hidden h-full">
                  <CardContent className="pt-10 flex-1 px-8">
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <p className="text-sm text-muted-foreground mb-8">{t("free_description") || "Perfect for solo founders."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">$0</span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {["1 Team Member", "10 AI Tokens/mo", "AI Assistant Included", "Bring Your Own Key (BYOK)"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <Link to="/auth">
                      <Button variant="outline" className="w-full h-12 rounded-xl">{t("get_started")}</Button>
                    </Link>
                    <button 
                      onClick={() => setSelectedPlan("Free")}
                      className="w-full text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      Learn More
                    </button>
                  </div>
                </Card>
              </motion.div>

              {/* Pro Tier */}
              <motion.div
                initial={{ opacity: 0, y: 150, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="flex flex-col rounded-[2rem] border-primary shadow-2xl relative overflow-hidden scale-105 z-10 h-full">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-4 py-1.5 rounded-bl-xl tracking-widest">
                    Most Popular
                  </div>
                  <CardContent className="pt-10 flex-1 px-8">
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <p className="text-sm text-muted-foreground mb-8 text-primary/80">{t("pro_description") || "For growing teams."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">$19</span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {[
                        "Up to 5 Team Members",
                        "20 AI Tokens/user/mo",
                        "Smart Insights",
                        "Competitive Research",
                        "AI Outreach Drafting"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <Link to="/auth">
                      <Button className="w-full h-12 rounded-xl shadow-lg shadow-primary/20">{t("upgrade_now") || "Upgrade Now"}</Button>
                    </Link>
                    <button 
                      onClick={() => setSelectedPlan("Pro")}
                      className="w-full text-xs text-primary/80 hover:text-primary transition-colors font-medium"
                    >
                      Learn More
                    </button>
                  </div>
                </Card>
              </motion.div>

              {/* Enterprise Tier */}
              <motion.div
                initial={{ opacity: 0, y: 150, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="flex flex-col rounded-[2rem] border-border/50 overflow-hidden h-full">
                  <CardContent className="pt-10 flex-1 px-8">
                    <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                    <p className="text-sm text-muted-foreground mb-8">{t("enterprise_description") || "For large organizations."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">$49</span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {[
                        "Unlimited Team Members",
                        "Unlimited AI Tokens",
                        "Custom AI Models",
                        "Priority Support",
                        "API Access"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <Link to="/auth">
                      <Button variant="outline" className="w-full h-12 rounded-xl">{t("contact_sales") || "Contact Sales"}</Button>
                    </Link>
                    <button 
                      onClick={() => setSelectedPlan("Enterprise")}
                      className="w-full text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      Learn More
                    </button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 bg-primary text-primary-foreground overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -150 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter leading-none">
                  {t("about_title_1")} <br />
                  <span className="opacity-50">{t("about_title_2")}</span> {t("about_title_3")}
                </h2>
                <p className="text-xl opacity-80 mb-8 font-light leading-relaxed">
                  Aiappsy was born from a simple observation: most CRMs are just glorified spreadsheets that demand more time than they save. 
                </p>
                <p className="text-xl opacity-80 mb-12 font-light leading-relaxed">
                  We built Aiappsy to be the brain of your business. By combining Scandinavian design principles with cutting-edge AI, we've created a tool that feels natural, works tirelessly, and helps you build deeper connections with your customers.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-4xl font-bold mb-1">98%</p>
                    <p className="text-sm opacity-60 uppercase tracking-widest">Customer Satisfaction</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-1">10k+</p>
                    <p className="text-sm opacity-60 uppercase tracking-widest">Invoices Processed</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 150, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl relative group">
                  <CustomersPreview />
                </div>
                <div className="absolute -bottom-8 -left-8 bg-background text-foreground p-8 rounded-3xl shadow-2xl -rotate-3 hidden md:block">
                  <p className="text-lg font-bold mb-2">"Aiappsy changed how we work."</p>
                  <p className="text-sm text-muted-foreground">— Sarah Jenkins, CEO at FlowState</p>
                </div>
              </motion.div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-1/2" />
        </section>

        {/* Footer */}
        <footer className="bg-muted/50 border-t border-border/40 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">Aiappsy CRM</span>
              </div>
              <div className="flex gap-8 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
                <a href="mailto:support@aiappsy.com" className="hover:text-primary">Contact</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2026 Aiappsy CRM. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">{selectedPlan} Plan</h2>
                    <p className="text-muted-foreground font-light">{detailedPlanFeatures[selectedPlan as keyof typeof detailedPlanFeatures].description}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                      <Sparkles className="h-5 w-5" /> AI Capabilities
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detailedPlanFeatures[selectedPlan as keyof typeof detailedPlanFeatures].ai.map((feature, i) => (
                        <motion.div 
                          key={`ai-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-primary/5 border border-primary/10 p-4 rounded-xl"
                        >
                          <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> Core Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detailedPlanFeatures[selectedPlan as keyof typeof detailedPlanFeatures].core.map((feature, i) => (
                        <motion.div 
                          key={`core-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (i + 3) * 0.05 }}
                          className="bg-muted/30 border border-border/50 p-4 rounded-xl"
                        >
                          <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                  <Link to="/auth" className="flex-1">
                    <Button className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20">
                      Get Started with {selectedPlan}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="h-14 rounded-2xl px-8"
                    onClick={() => setSelectedPlan(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
