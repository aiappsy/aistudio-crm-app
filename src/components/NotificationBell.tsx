import { useState } from "react";
import { useFirestoreQuery } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp, where } from "firebase/firestore";
import { Bell, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications } = useFirestoreQuery<any>("agentNotifications", [
    where("ownerId", "==", user?.uid || ""),
    where("status", "==", "pending_approval")
  ]);
  
  // No need to manually filter anymore
  const myNots = notifications;
  
  const handleApprove = async (notification: any) => {
    // In a real system, this would trigger the approved action via backend
    await updateDoc(doc(db, "agentNotifications", notification.id), {
      status: "approved",
      resolvedAt: serverTimestamp()
    });
    alert(`Approved action: ${notification.actionNeeded}`);
  };

  const handleDismiss = async (id: string) => {
    await updateDoc(doc(db, "agentNotifications", id), {
      status: "dismissed",
      resolvedAt: serverTimestamp()
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted transition-colors">
          <Bell size={20} />
          {myNots.length > 0 && (
            <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold border border-card shadow-sm">
              {myNots.length}
            </span>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>AI Agent Notifications</span>
          <Badge variant="secondary">{myNots.length} pending</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] overflow-y-auto">
          {myNots.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              You're all caught up!
            </div>
          ) : (
            myNots.map((notif: any) => (
              <div key={notif.id} className="p-3 border-b border-border/50 hover:bg-muted/50 flex flex-col gap-2 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm">{notif.dealName || notif.type.replace(/_/g, ' ')}</div>
                  <span className="text-[10px] text-muted-foreground uppercase">{notif.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notif.details}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApprove(notif)}>
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleDismiss(notif.id)}>
                    <X className="mr-1 h-3 w-3" /> Dismiss
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
