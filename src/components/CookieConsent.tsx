import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/lib/i18n";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            
            <div className="flex-1 relative z-10 space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">We value your privacy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                We use cookies and similar technologies to enhance your experience, analyze our traffic, and for security purposes. By clicking "Accept All", you consent to our use of cookies. 
                Read our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to learn more about how we process your personal data in compliance with GDPR.
              </p>
            </div>
            
            <div className="flex flex-row sm:flex-col gap-3 shrink-0 w-full sm:w-auto relative z-10 shrink-0">
              <Button onClick={handleAccept} className="flex-1 sm:w-32 rounded-xl" size="lg">
                Accept All
              </Button>
              <Button onClick={handleDecline} variant="outline" className="flex-1 sm:w-32 rounded-xl" size="lg">
                Decline
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
