import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  UserPlus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Button } from "@/components/ui/button";
import SmartInsights from "@/components/dashboard/SmartInsights";
import InvitationBanner from "@/components/InvitationBanner";
import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", userProfile?.organizationId || user?.uid);
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection<any>("contacts");
  const { data: invoices, loading: invoicesLoading } = useFirestoreCollection<any>("invoices");
  const { data: payments, loading: paymentsLoading } = useFirestoreCollection<any>("payments");
  const { data: outreach, loading: outreachLoading } = useFirestoreCollection<any>("outreach");

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const activeInvoices = invoices.filter(inv => inv.status === "Pending").length;
    const totalContacts = contacts.length;
    
    // Mocking changes for now as we don't have historical data easily accessible
    return [
      { 
        title: t("total_revenue"), 
        value: formatCurrency(totalRevenue, settings?.currency), 
        change: "+12.5%", 
        trend: "up",
        icon: DollarSign 
      },
      { 
        title: t("contacts"), 
        value: totalContacts.toString(), 
        change: "+5.2%", 
        trend: "up",
        icon: Users 
      },
      { 
        title: t("active_invoices"), 
        value: activeInvoices.toString(), 
        change: "+2.1%", 
        trend: "up",
        icon: FileText 
      },
      { 
        title: t("conversion_rate"), 
        value: "24.5%", 
        change: "-1.2%", 
        trend: "down",
        icon: TrendingUp 
      },
    ];
  }, [contacts, invoices, payments, t]);

  const chartData = useMemo(() => {
    // Group revenue by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push({
        name: months[monthIndex],
        revenue: 0,
        leads: 0
      });
    }

    // Fill with real data if available, otherwise use some mock data for visualization if empty
    if (payments.length === 0 && contacts.length === 0) {
      return [
        { name: "Jan", revenue: 4000, leads: 240 },
        { name: "Feb", revenue: 3000, leads: 198 },
        { name: "Mar", revenue: 2000, leads: 980 },
        { name: "Apr", revenue: 2780, leads: 390 },
        { name: "May", revenue: 1890, leads: 480 },
        { name: "Jun", revenue: 2390, leads: 380 },
      ];
    }

    // This is a simplified grouping, in a real app you'd parse the dates properly
    payments.forEach(p => {
      const date = new Date(p.date);
      const monthName = months[date.getMonth()];
      const monthData = last6Months.find(m => m.name === monthName);
      if (monthData) monthData.revenue += p.amount;
    });

    contacts.forEach(c => {
      if (c.status === "Lead") {
        const date = new Date(c.lastContact || Date.now());
        const monthName = months[date.getMonth()];
        const monthData = last6Months.find(m => m.name === monthName);
        if (monthData) monthData.leads += 1;
      }
    });

    return last6Months;
  }, [payments, contacts]);

  if (contactsLoading || invoicesLoading || paymentsLoading || outreachLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InvitationBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-muted-foreground">{t("welcome_back")}, {t("todays_overview")}</p>
        </div>
        <Button onClick={() => navigate("/app/settings")} className="gap-2">
          <UserPlus size={18} />
          {t("invite_member")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>{" "}
                {t("from_last_month")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t("revenue_overview")}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          {settings?.tier === "pro" ? (
            <SmartInsights data={{ contacts, invoices, payments, outreach }} />
          ) : (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Sparkles className="h-4 w-4" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">{t("ai_smart_insights")}</CardTitle>
                </div>
                <CardDescription className="text-xs">{t("pro_features_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full text-xs h-8" 
                  variant="default"
                  onClick={() => navigate("/app/settings")}
                >
                  {t("upgrade_to_pro")}
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>{t("lead_generation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2} 
                      dot={{ fill: "hsl(var(--primary))" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

