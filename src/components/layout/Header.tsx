import { useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, LogIn, Languages, HelpCircle, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage, Language } from "@/lib/i18n";
import HelpModal from "@/components/HelpModal";
import NotificationBell from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useVoice } from "@/lib/VoiceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const navigate = useNavigate();
  const { user, signIn, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { voiceMode, setVoiceMode } = useVoice();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "no", label: "Norsk", flag: "🇳🇴" },
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    { code: "da", label: "Dansk", flag: "🇩🇰" },
  ];

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search") + "..."}
            className="pl-9 bg-accent/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
            <div className="flex items-center gap-2">
              <Languages size={18} />
              <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
            </div>
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

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setVoiceMode(!voiceMode)}
          className={cn("relative", voiceMode && "text-primary bg-primary/10")}
          title={voiceMode ? "Voice Mode Active" : "Enable Voice Mode"}
        >
          {voiceMode ? <Mic size={20} /> : <MicOff size={20} className="opacity-50" />}
        </Button>

        <ThemeToggle />

        <HelpModal />

        <NotificationBell />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full overflow-hidden shrink-0")}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col px-2 py-1.5 text-sm font-medium">
                  <span>{user.displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/app/profile")}>{t("profile")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/settings")}>{t("settings")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("sign_out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" size="sm" onClick={() => signIn()} className="gap-2">
            <LogIn size={18} />
            {t("sign_in")}
          </Button>
        )}
      </div>
    </header>
  );
}
