import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Zap
} from "lucide-react";

export default function DashboardPreview() {
  const stats = [
    { title: "Total Revenue", value: "$12,450.00", change: "+12.5%", trend: "up", icon: DollarSign },
    { title: "Active Leads", value: "48", change: "+5.2%", trend: "up", icon: Users },
    { title: "Quotes Sent", value: "124", change: "+2.1%", trend: "up", icon: FileText },
    { title: "Conversion", value: "24.5%", change: "-1.2%", trend: "down", icon: TrendingUp },
  ];

  return (
    <div className="w-full h-full bg-background flex flex-col text-[10px] sm:text-xs">
      {/* Browser Header */}
      <div className="h-8 border-b border-border/40 bg-muted/30 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/20" />
            <div className="w-2 h-2 rounded-full bg-amber-500/20" />
            <div className="w-2 h-2 rounded-full bg-green-500/20" />
          </div>
          <div className="h-4 w-32 bg-muted rounded-full flex items-center px-2 text-[8px] text-muted-foreground">
            app.aiappsy.com
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-3 w-3 text-primary" />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-muted rounded-full" />
            <div className="h-2 w-32 bg-muted/60 rounded-full" />
          </div>
          <div className="h-6 w-20 bg-primary rounded-lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="rounded-xl border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-[8px] font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-sm font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-[7px] text-green-500">
                  <ArrowUpRight className="h-2 w-2" /> {stat.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 h-40">
          <Card className="col-span-4 rounded-xl border-border/50 shadow-sm p-3">
            <div className="h-2 w-24 bg-muted rounded-full mb-4" />
            <div className="flex-1 flex items-end gap-1.5 h-24">
              {[40, 70, 45, 90, 65, 80, 55, 95, 60, 85, 50, 75].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-primary/20 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </Card>
          <div className="col-span-3 space-y-3">
            <Card className="rounded-xl border-primary/20 bg-primary/5 shadow-sm p-3">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="h-3 w-3" />
                <div className="h-2 w-16 bg-primary/20 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-primary/10 rounded-full" />
                <div className="h-1.5 w-3/4 bg-primary/10 rounded-full" />
              </div>
            </Card>
            <Card className="rounded-xl border-border/50 shadow-sm p-3 h-20">
              <div className="h-2 w-16 bg-muted rounded-full mb-2" />
              <div className="h-12 w-full bg-muted/20 rounded-lg" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
