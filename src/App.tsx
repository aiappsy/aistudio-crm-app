/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Quotes from "./pages/Quotes";
import Products from "./pages/Products";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Outreach from "./pages/Outreach";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Integrations from "./pages/Integrations";
import AdminSettings from "./pages/AdminSettings";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Notebook from "./pages/Notebook";
import Pipeline from "./pages/Pipeline";
import Leads from "./pages/Leads";
import DataHygiene from "./pages/DataHygiene";
import CustomerSuccess from "./pages/CustomerSuccess";
import Workflows from "./pages/Workflows";
import AIAssistant from "./components/AIAssistant";
import ReleaseBanner from "./components/ReleaseBanner";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { ScrollArea } from "./components/ui/scroll-area";

import { AuthProvider, useAuth } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/i18n";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { ReactNode, useEffect } from "react";
import { fetchExchangeRates } from "./lib/utils";

import { VoiceProvider } from "./lib/VoiceContext";
import { useProactiveEngine } from "./hooks/useProactiveEngine";

function AppEngine() {
  useProactiveEngine();
  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  
  return (
    <>
      <OnboardingWizard />
      <AppEngine />
      {children}
    </>
  );
}

export default function App() {
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <VoiceProvider>
            <Router>
              <CookieConsent />
              <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/app/*" element={
                <ProtectedRoute>
                  <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
                    <ReleaseBanner />
                    <div className="flex flex-1 overflow-hidden">
                      <Sidebar />
                      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                        <Header />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6">
                          <div className="max-w-7xl mx-auto w-full pb-12">
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/notebook" element={<Notebook />} />
                              <Route path="/contacts" element={<Contacts />} />
                              <Route path="/contacts/:id" element={<ContactDetail />} />
                              <Route path="/contacts/customers" element={<Contacts type="customer" />} />
                              <Route path="/contacts/suppliers" element={<Contacts type="supplier" />} />
                              <Route path="/contacts/custom" element={<Contacts type="custom" />} />
                              <Route path="/pipeline" element={<Pipeline />} />
                              <Route path="/leads" element={<Leads />} />
                              <Route path="/data-hygiene" element={<DataHygiene />} />
                              <Route path="/customer-success" element={<CustomerSuccess />} />
                              <Route path="/workflows" element={<Workflows />} />
                              <Route path="/quotes" element={<Quotes />} />
                              <Route path="/invoices" element={<Invoices />} />
                              <Route path="/products" element={<Products />} />
                              <Route path="/payments" element={<Payments />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/outreach" element={<Outreach />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/integrations" element={<Integrations />} />
                              <Route path="/admin" element={<AdminSettings />} />
                            </Routes>
                          </div>
                        </main>
                      </div>
                    </div>
                  </div>
                  <AIAssistant />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          </VoiceProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

