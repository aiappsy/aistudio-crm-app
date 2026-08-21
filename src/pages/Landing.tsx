import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Users, Zap, Shield, Globe, ArrowRight, X, DollarSign, FileText, TrendingUp, ArrowUpRight, Languages, GitBranch, HeartPulse, BrainCircuit, BarChart3, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import DashboardPreview from "@/components/landing/DashboardPreview";
import CustomersPreview from "@/components/landing/CustomersPreview";
import { useLanguage, Language } from "@/lib/i18n";
import { cn, formatCurrency, convertBasePrice } from "@/lib/utils";
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
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "no", label: "Norsk", flag: "🇳🇴" },
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    { code: "da", label: "Dansk", flag: "🇩🇰" },
  ];

  const getDerivedCurrency = () => {
    switch (language) {
      case "no": return "NOK";
      case "sv": return "SEK";
      case "da": return "DKK";
      default: return "USD";
    }
  };
  
  const getDerivedPrice = (usdPrice: number) => {
    return convertBasePrice(usdPrice, getDerivedCurrency());
  };

  const featureCategories = [
    {
      id: "pipeline",
      icon: GitBranch,
      title: t("cat1_title") || "Sales & Pipeline Operations",
      subtitle: t("cat1_sub") || "Built to close. A modern Kanban that keeps deals moving seamlessly.",
      span: "md:col-span-2",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      features: [
        { t: t("cat1_f1_t"), d: t("cat1_f1_d") },
        { t: t("cat1_f2_t"), d: t("cat1_f2_d") },
        { t: t("cat1_f3_t"), d: t("cat1_f3_d") },
        { t: t("cat1_f4_t"), d: t("cat1_f4_d") },
        { t: t("cat1_f5_t"), d: t("cat1_f5_d") },
      ]
    },
    {
      id: "ai",
      icon: Sparkles,
      title: t("cat2_title") || "Autonomous Agent",
      subtitle: t("cat2_sub") || "Your proactive AI copilot that does the heavy lifting.",
      span: "md:col-span-1",
      color: "bg-primary/10 text-primary border-primary/20",
      features: [
        { t: t("cat2_f1_t"), d: t("cat2_f1_d") },
        { t: t("cat2_f2_t"), d: t("cat2_f2_d") },
        { t: t("cat2_f3_t"), d: t("cat2_f3_d") },
        { t: t("cat2_f4_t"), d: t("cat2_f4_d") },
        { t: t("cat2_f5_t"), d: t("cat2_f5_d") }
      ]
    },
    {
      id: "commerce",
      icon: DollarSign,
      title: t("cat3_title") || "Billing & Invoicing",
      subtitle: t("cat3_sub") || "Accelerate your quote-to-cash lifecycle.",
      span: "md:col-span-1",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      features: [
        { t: t("cat3_f1_t"), d: t("cat3_f1_d") },
        { t: t("cat3_f2_t"), d: t("cat3_f2_d") },
        { t: t("cat3_f3_t"), d: t("cat3_f3_d") },
        { t: t("cat3_f4_t"), d: t("cat3_f4_d") },
      ]
    },
    {
      id: "insights",
      icon: TrendingUp,
      title: t("cat4_title") || "Intelligence & Forecasting",
      subtitle: t("cat4_sub") || "See the exact future of your recurring revenue.",
      span: "md:col-span-1",
      color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      features: [
        { t: t("cat4_f1_t"), d: t("cat4_f1_d") },
        { t: t("cat4_f2_t"), d: t("cat4_f2_d") },
        { t: t("cat4_f3_t"), d: t("cat4_f3_d") },
        { t: t("cat4_f4_t"), d: t("cat4_f4_d") },
        { t: t("cat4_f5_t"), d: t("cat4_f5_d") },
        { t: t("cat4_f6_t"), d: t("cat4_f6_d") },
      ]
    },
    {
      id: "security",
      icon: Shield,
      title: t("cat5_title") || "Enterprise Ready Scale",
      subtitle: t("cat5_sub") || "Secure infrastructure, compliant, and deeply localized.",
      span: "md:col-span-1",
      color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      features: [
        { t: t("cat5_f1_t"), d: t("cat5_f1_d") },
        { t: t("cat5_f2_t"), d: t("cat5_f2_d") },
        { t: t("cat5_f3_t"), d: t("cat5_f3_d") },
        { t: t("cat5_f4_t"), d: t("cat5_f4_d") },
      ]
    }
  ];

  const detailedPlanFeatures = {
    Free: {
      description: "Perfect for solo founders starting their journey.",
      ai: [
        { title: "Natural Language CRM", desc: "Tell the AI to 'Create an invoice for John' and watch it happen instantly." },
        { title: "Standard Insights", desc: "Basic summaries of your business health." },
        { title: "10 AI Actions/mo", desc: "Enough to taste the power of AI-first CRM." }
      ],
      core: [
        { title: "Unlimited Customers & Invoices", desc: "No limits on your basic database entries." },
        { title: "Visual Pipeline", desc: "Drag and drop your deals with ease." },
        { title: "1 Team Member", desc: "Single user access to keep things simple." }
      ]
    },
    Pro: {
      description: "For growing teams that need to close deals faster with AI.",
      ai: [
        { title: "100 AI Actions/mo", desc: "Power your daily outreach and research." },
        { title: "Automated Outreach Drafting", desc: "AI drafts personalized Email and WhatsApp messages." },
        { title: "Competitive Research", desc: "Automated web searches before every sales call." },
        { title: "BYOK Support", desc: "Connect your own key for unlimited AI beyond your allowance." }
      ],
      core: [
        { title: "Up to 5 Team Members", desc: "Collaborate with your core sales team." },
        { title: "Multi-Currency Billing", desc: "Invoices in any currency based on localization." },
        { title: "Email Integration (SMTP)", desc: "Send outreach directly from your own domain." }
      ]
    },
    Enterprise: {
      description: "For large organizations requiring custom AI and limitless scale.",
      ai: [
        { title: "500 AI Actions/mo", desc: "High-volume intelligence for the whole organization." },
        { title: "Predictive Churn Analytics", desc: "Identify fragile relationships before they break." },
        { title: "Custom Sales Playbooks", desc: "AI trained on your specific winning strategies." },
        { title: "Unlimited via BYOK", desc: "Total freedom with your own API infrastructure." }
      ],
      core: [
        { title: "Unlimited Team Members", desc: "Scale across every department." },
        { title: "Advanced Revenue Reports", desc: "Deep financial analytics and forecasting." },
        { title: "24/7 Priority Support", desc: "Dedicated account manager and instant help." }
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
                    <span className="text-sm font-bold">{t("ai_insight") || "AI Insight"}</span>
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
                    <span className="text-xs font-bold uppercase tracking-wider">{t("live_activity") || "Live Activity"}</span>
                  </div>
                  <p className="text-sm font-medium">{t("quote_accepted_example") || "Quote #124 Accepted"}</p>
                  <p className="text-[10px] text-muted-foreground">{t("by_nordic_solutions_example") || "by Nordic Solutions AS"}</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Social Proof */}
        <section className="py-12 border-b border-border/40 bg-muted/10 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">{t("trusted_by") || "Trusted by next-generation sales teams worldwide"}</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-xl font-bold font-sans"><Globe className="w-6 h-6"/> GlobalNet</div>
              <div className="flex items-center gap-2 text-xl font-bold font-mono"><Users className="w-6 h-6"/> PeopleFirst</div>
              <div className="flex items-center gap-2 text-xl font-bold italic"><Sparkles className="w-6 h-6"/> Nexus</div>
              <div className="flex items-center gap-2 text-xl font-bold tracking-tighter"><Shield className="w-6 h-6"/> SECURECORP</div>
              <div className="flex items-center gap-2 text-xl font-bold"><Zap className="w-6 h-6"/> Velocity</div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{t("features_title_new") || "The Autonomous CRM Engine"}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                {t("features_subtitle_new") || "Discover a feature-complete platform designed to replace five different tools. Every module natively infused with AI."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featureCategories.map((category, i) => (
                <motion.div 
                  key={category.id} 
                  initial={{ opacity: 0, y: 50, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.0, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelectedFeature(category.id)}
                  className={cn(
                    "group relative p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col justify-between overflow-hidden",
                    category.span
                  )}
                >
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowUpRight className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110", category.color)}>
                      <category.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{category.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-light mb-8 max-w-md">{category.subtitle}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.features.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="text-xs font-medium px-3 py-1 bg-muted rounded-full">
                        {feat.t}
                      </span>
                    ))}
                    {category.features.length > 3 && (
                      <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                        +{category.features.length - 3} {t("and_more") || "more"}
                      </span>
                    )}
                  </div>
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
                    <h3 className="text-2xl font-bold mb-2">{t("free_plan") || "Free"}</h3>
                    <p className="text-sm text-muted-foreground mb-8">{t("free_description") || "Perfect for solo founders."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">{formatCurrency(getDerivedPrice(0), getDerivedCurrency())}</span>
                      <span className="text-muted-foreground ml-2">{t("monthly") || "/mo"}</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {[
                        `1 ${t("user_singular") || "Team Member"}`, 
                        `30 ${t("ai_actions_mo")} ${t("token_equals_task")}`, 
                        t("basic_crm_features"), 
                        t("visual_sales_pipeline")
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <Link to="/auth?plan=free">
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
                <Card className="flex flex-col rounded-[2rem] border-primary shadow-2xl relative overflow-hidden md:scale-105 z-10 h-full">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-4 py-1.5 rounded-bl-xl tracking-widest">
                    Most Popular
                  </div>
                  <CardContent className="pt-10 flex-1 px-8">
                    <h3 className="text-2xl font-bold mb-2">{t("pro_plan") || "Pro"}</h3>
                    <p className="text-sm text-muted-foreground mb-8 text-primary/80">{t("pro_description") || "For growing teams."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">{formatCurrency(getDerivedPrice(29), getDerivedCurrency())}</span>
                      <span className="text-muted-foreground ml-2">{t("monthly") || "/mo"}</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {[
                        `${t("up_to_users")} 5 ${t("users")}`,
                        `200 ${t("ai_actions_mo")} ${t("token_equals_task")}`,
                        t("automated_outreach"),
                        "Role-based Access Control",
                        t("byok_standard")
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <Link to="/auth?plan=pro">
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
                    <h3 className="text-2xl font-bold mb-2">{t("enterprise_plan") || "Enterprise"}</h3>
                    <p className="text-sm text-muted-foreground mb-8">{t("enterprise_description") || "For large organizations."}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold">{formatCurrency(getDerivedPrice(79), getDerivedCurrency())}</span>
                      <span className="text-muted-foreground ml-2">{t("monthly") || "/mo"}</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {[
                        t("unlimited_users"),
                        `1000 ${t("ai_actions_mo")} ${t("token_equals_task")}`,
                        t("dedicated_manager"),
                        t("predictive_analytics"),
                        "Full Customization API",
                        t("revenue_reports")
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-8 pt-0 mt-auto space-y-3">
                    <a href="https://wa.me/4740059493" target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full h-12 rounded-xl">{t("contact_sales") || "Contact Sales"}</Button>
                    </a>
                    <button 
                      onClick={() => setSelectedPlan("Enterprise")}
                      className="w-full text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {t("learn_more") || "Learn More"}
                    </button>
                  </div>
                </Card>
              </motion.div>
            </div>
            
            <div className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
              <strong className="block mb-2">{t("what_is_token") || "What is an AI Token?"}</strong> 
              {t("token_explanation") || "One token represents one task performed by the AI agent, such as reading an email, generating a response, translating text, or updating a lead. Tokens reset at the beginning of each billing cycle. You can always buy extra tokens if you run out."}
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
                  {t("about_paragraph_1") || "Aiappsy was born from a simple observation: most CRMs are just glorified spreadsheets that demand more time than they save."}
                </p>
                <p className="text-xl opacity-80 mb-12 font-light leading-relaxed">
                  {t("about_paragraph_2") || "We built Aiappsy to be the brain of your business. By combining Scandinavian design principles with cutting-edge AI, we've created a tool that feels natural, works tirelessly, and helps you build deeper connections with your customers."}
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-4xl font-bold mb-1">98%</p>
                    <p className="text-sm opacity-60 uppercase tracking-widest">{t("customer_satisfaction") || "Customer Satisfaction"}</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-1">10k+</p>
                    <p className="text-sm opacity-60 uppercase tracking-widest">{t("invoices_processed") || "Invoices Processed"}</p>
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
                  <p className="text-lg font-bold mb-2">{t("testimonial_quote") || '"Aiappsy changed how we work."'}</p>
                  <p className="text-sm text-muted-foreground">{t("testimonial_author") || "— Sarah Jenkins, CEO at FlowState"}</p>
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
                <Link to="/privacy" className="hover:text-primary">{t("privacy_policy") || "Privacy Policy"}</Link>
                <Link to="/terms" className="hover:text-primary">{t("terms_of_service") || "Terms of Service"}</Link>
                <a href="https://wa.me/4740059493" target="_blank" rel="noreferrer" className="hover:text-primary">{t("contact") || "Contact"}</a>
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
                    <h2 className="text-3xl font-bold tracking-tight mb-2">{selectedPlan} {t("plan") || "Plan"}</h2>
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
                      <Sparkles className="h-5 w-5" /> {t("ai_capabilities") || "AI Capabilities"}
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
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> {t("core_features") || "Core Features"}
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
                  <Link to={`/auth?plan=${selectedPlan?.toLowerCase()}`} className="flex-1">
                    <Button className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20">
                      {t("get_started_with") || "Get Started with"} {selectedPlan}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="h-14 rounded-2xl px-8"
                    onClick={() => setSelectedPlan(null)}
                  >
                    {t("close") || "Close"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Feature Details Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-card border border-border/50 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row"
            >
              {(() => {
                const category = featureCategories.find(c => c.id === selectedFeature);
                if (!category) return null;
                const Icon = category.icon;
                
                return (
                  <>
                    {/* Left Pane: Branding & Hero */}
                    <div className={cn("hidden md:flex flex-col justify-between w-1/3 p-10", category.color.replace('text-', 'bg-').split(' ')[0])}>
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-background/50 backdrop-blur-md flex items-center justify-center mb-8 shadow-inner border border-white/10">
                          <Icon className="h-8 w-8 text-foreground" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground">{category.title}</h2>
                        <p className="font-medium opacity-80 text-foreground leading-relaxed">{category.subtitle}</p>
                      </div>
                      <div className="mt-12 text-sm font-semibold opacity-60 uppercase tracking-widest text-foreground">
                        {t("explore_module") || "Module Exploration"}
                      </div>
                    </div>
                    
                    {/* Right Pane: Features List */}
                    <div className="flex-1 p-8 sm:p-12 max-h-[85vh] overflow-y-auto custom-scrollbar relative bg-card">
                      <div className="flex justify-between items-start mb-8 md:hidden">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-muted">
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>
                        <button 
                          onClick={() => setSelectedFeature(null)}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="md:hidden mb-8">
                         <h2 className="text-2xl font-bold tracking-tight mb-2">{category.title}</h2>
                         <p className="text-muted-foreground">{category.subtitle}</p>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedFeature(null)}
                        className="hidden md:flex absolute top-8 right-8 p-2 rounded-full hover:bg-muted transition-colors z-10"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      <div className="space-y-6">
                        {category.features.map((feature, i) => (
                          <motion.div 
                            key={`feat-${i}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted group-hover:bg-primary transition-colors" />
                            <h4 className="font-bold text-lg mb-2">{feature.t}</h4>
                            <p className="text-muted-foreground leading-relaxed">{feature.d}</p>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
                        <Link to="/auth" className="flex-1">
                          <Button className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20">
                            {t("try_feature_free") || "Try this feature for free"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
