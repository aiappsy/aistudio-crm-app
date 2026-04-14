import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreQuery } from "@/lib/useFirestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, updateDoc, where } from "firebase/firestore";
import { CheckCircle2, XCircle, Mail } from "lucide-react";
import { useState } from "react";

export default function InvitationBanner() {
  const { user } = useAuth();
  const { data: invitations } = useFirestoreQuery<any>("invitations", [
    where("email", "==", user?.email || "none"),
    where("status", "==", "pending")
  ]);

  const [processing, setProcessing] = useState<string | null>(null);

  const handleAccept = async (inv: any) => {
    if (!user) return;
    setProcessing(inv.id);
    try {
      // 1. Update invitation status
      await updateDoc(doc(db, "invitations", inv.id), { status: "accepted" });
      
      // 2. Update user profile with organizationId
      await updateDoc(doc(db, "users", user.uid), { 
        organizationId: inv.organizationId,
        role: inv.role || "user"
      });
      
      window.location.reload(); // Refresh to apply changes
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invitations/${inv.id}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessing(id);
    try {
      await updateDoc(doc(db, "invitations", id), { status: "declined" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invitations/${id}`);
    } finally {
      setProcessing(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {invitations.map((inv) => (
        <Card key={inv.id} className="border-primary bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  You've been invited to join <span className="font-bold">{inv.organizationName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Invited by {inv.invitedBy}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleDecline(inv.id)}
                disabled={processing === inv.id}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleAccept(inv)}
                disabled={processing === inv.id}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
