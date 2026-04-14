import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useFirestoreCollection } from "@/lib/useFirestore";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { t } = useLanguage();
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection<any>("contacts");
  const { data: invoices, loading: invoicesLoading } = useFirestoreCollection<any>("invoices");
  const { data: payments, loading: paymentsLoading } = useFirestoreCollection<any>("payments");

  const revenueByCustomer = useMemo(() => {
    if (payments.length === 0) {
      return [
        { name: "Nordic Solutions", value: 4500 },
        { name: "Global Logistics", value: 3200 },
        { name: "Innovate Design", value: 2800 },
        { name: "Tech Corp", value: 2100 },
        { name: "Skyline Ltd", value: 1500 },
      ];
    }
    const revenue: Record<string, number> = {};
    payments.forEach(p => {
      revenue[p.customerName] = (revenue[p.customerName] || 0) + p.amount;
    });
    return Object.entries(revenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [payments]);

  const contactStatusData = useMemo(() => {
    if (contacts.length === 0) {
      return [
        { name: t("active"), value: 12 },
        { name: t("lead"), value: 8 },
        { name: t("inactive"), value: 3 },
      ];
    }
    const statusCount: Record<string, number> = {};
    contacts.forEach(c => {
      const statusLabel = c.status === "Active" ? t("active") : 
                         c.status === "Lead" ? t("lead") : t("inactive");
      statusCount[statusLabel] = (statusCount[statusLabel] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [contacts, t]);

  const invoiceStatusData = useMemo(() => {
    if (invoices.length === 0) {
      return [
        { name: t("paid"), value: 15 },
        { name: t("pending"), value: 7 },
        { name: t("overdue"), value: 2 },
      ];
    }
    const statusCount: Record<string, number> = {};
    invoices.forEach(inv => {
      const statusLabel = inv.status === "Paid" ? t("paid") : 
                         inv.status === "Pending" ? t("pending") : t("overdue");
      statusCount[statusLabel] = (statusCount[statusLabel] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [invoices, t]);

  if (contactsLoading || invoicesLoading || paymentsLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">{t("reports")}</h1>
          <p className="text-muted-foreground">{t("reports_desc")}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download size={18} />
          {t("export_data")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("top_customers_revenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCustomer} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("customer_distribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contactStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contactStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("invoice_status_overview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                    dataKey="value"
                  >
                    {invoiceStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
