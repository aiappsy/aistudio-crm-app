import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Package, 
  CreditCard, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSignature,
  Send,
  ShieldCheck,
  LogOut,
  Puzzle,
  Kanban,
  UserCircle,
  Truck,
  PlusCircle,
  Search,
  Globe
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useFirestoreDoc } from "@/lib/useFirestore";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = useMemo(() => {
    const items = [
      { icon: LayoutDashboard, label: t("home") || "Home", path: "/app" },
      { icon: Sparkles, label: "Intelligence Hub", path: "/app/notebook" },
      { 
        icon: Users, 
        label: t("crm_leads") || "CRM & Leads", 
        path: "/app/crm",
        stateKey: "crmOpen",
        submenu: [
          { icon: UserCircle, label: t("customers") || "Customers", path: "/app/contacts/customers" },
          { icon: Truck, label: t("suppliers") || "Suppliers", path: "/app/contacts/suppliers" },
          { icon: PlusCircle, label: t("custom_types") || "Custom Types", path: "/app/contacts/custom" },
          { icon: Search, label: "Lead Finder", path: "/app/contacts/finder" },
          { icon: Globe, label: "Lead Forms", path: "/app/contacts/forms" },
        ]
      },
      { icon: BarChart3, label: t("reports"), path: "/app/reports" },
      {
        icon: Settings,
        label: t("system") || "System",
        path: "/app/system",
        stateKey: "systemOpen",
        submenu: [
          { icon: Puzzle, label: "Integrations", path: "/app/integrations" },
          { icon: UserCircle, label: t("profile"), path: "/app/profile" },
          { icon: Settings, label: t("settings"), path: "/app/settings" },
          ...(userProfile?.role === "super_admin" ? [{ icon: ShieldCheck, label: "Admin", path: "/app/admin" }] : [])
        ]
      }
    ];

    return items;
  }, [t, userProfile?.role]);

  // We need state for these open menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    crmOpen: true,
    commerceOpen: false,
    systemOpen: false
  });

  const toggleSubmenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-primary">
            Aiappsy <span className="text-muted-foreground font-normal">CRM</span>
          </span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto w-full">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.submenu?.some(sub => location.pathname === sub.path));
          const isSubmenuOpen = item.submenu && openMenus[item.stateKey as string] && !collapsed;

          if (item.submenu) {
            return (
              <div key={item.path} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenMenus(prev => ({ ...prev, [item.stateKey as string]: true }));
                    } else {
                      toggleSubmenu(item.stateKey as string);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive && !isSubmenuOpen
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="font-medium flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown size={14} className={cn("transition-transform shrink-0", isSubmenuOpen ? "" : "-rotate-90")} />
                    </>
                  )}
                </button>
                {isSubmenuOpen && (
                  <div className="ml-4 pl-4 border-l space-y-1 mt-1">
                    {item.submenu.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm",
                            isSubActive 
                              ? "text-primary font-bold" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <sub.icon size={16} className="shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-4">
        {!collapsed && user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.displayName || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "sm"} 
          className={cn("w-full justify-start text-muted-foreground hover:text-destructive", !collapsed && "px-3")}
          onClick={handleLogout}
        >
          <LogOut size={20} className={cn(collapsed ? "mx-auto" : "mr-3")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
