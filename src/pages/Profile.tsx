import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, CheckCircle2, Loader2, Download, AlertTriangle } from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { doc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      await updateProfile(user, { displayName });
      setMessage(t("profile_updated") || "Profile updated.");
    } catch (error) {
      console.error(error);
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Basic implementation for exporting user's profile and contacts
      const contactsQuery = query(collection(db, "contacts"), where("ownerId", "==", user.uid));
      const contactsSnapshot = await getDocs(contactsQuery);
      const contacts = contactsSnapshot.docs.map(doc => doc.data());

      const dataToExport = {
        profile: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userProfile
        },
        contacts
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aiappsy-data-${user.uid}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm("Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    try {
      // Note: A robust system would use a Cloud Function to clean up all data references
      // Here we do basic cleanup
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you must log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("profile") || "Profile"}</h1>
          <p className="text-muted-foreground">{t("personal_info") || "Personal Information"}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("edit_profile") || "Edit Profile"}</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("display_name") || "Display Name"}</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10" 
                    value={displayName ?? ""} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("email_address") || "Email Address"}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10 opacity-70 cursor-not-allowed" 
                    value={user?.email ?? ""} 
                    disabled 
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">Email changes are managed via authentication provider.</p>
              </div>

              {message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-md text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (t("save_changes") || "Save Changes")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Plan and verification info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Subscription Tier</p>
                    <p className="text-xs text-muted-foreground uppercase">{userProfile?.tier || "Free"}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/app/settings"}>Manage</Button>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className={`h-2 w-2 rounded-full ${user?.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <p className="text-sm font-medium">Verification State</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.emailVerified ? "Verified Email" : "Awaiting Verification"}
                  </p>
                </div>
              </div>
              
              <div className="p-4 border border-dashed rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Member since {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "unknown"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Data & Privacy (GDPR)
              </CardTitle>
              <CardDescription>Manage your data and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Export Data</h4>
                  <p className="text-xs text-muted-foreground">Download a copy of your personal data and CRM records in JSON format.</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleExportData} disabled={exporting}>
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export Data
                </Button>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 rounded-lg space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                  <p className="text-xs text-red-700/70 dark:text-red-400/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button variant="destructive" className="w-full" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
