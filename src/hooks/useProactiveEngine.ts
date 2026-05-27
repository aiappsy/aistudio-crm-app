import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreQuery, useFirestoreDoc } from "@/lib/useFirestore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { callManagedAi } from "@/services/gemini";

// Helper to determine if a deal is stalled
function isDealStalled(deal: any) {
  if (deal.stage !== "Active" && deal.stage !== "Negotiation" && deal.stage !== "Proposal") return false;
  
  const updatedAt = deal.updatedAt?.toDate ? deal.updatedAt.toDate() : new Date(deal.updatedAt || Date.now());
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceUpdate > 14;
}

// Helper to simulate customer health calculation
function calculateCustomerHealth(customer: any) {
  let score = 100;
  
  // Example logic
  if (!customer.history || customer.history.length === 0) {
    score -= 30; // Low engagement
  } else {
    const lastInteraction = new Date(customer.history[customer.history.length - 1].date);
    const now = new Date();
    const daysSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) score -= 20;
  }
  
  // If there are support tickets
  const activeTickets = customer.supportTickets?.filter((t: any) => t.status === "open").length || 0;
  if (activeTickets > 0) score -= (activeTickets * 10);
  
  // Payment timeliness
  if (customer.unpaidInvoices > 0) score -= 15;
  
  score = Math.max(0, Math.min(100, score));
  
  let riskLevel = "Healthy";
  if (score < 50) riskLevel = "At Risk";
  else if (score < 80) riskLevel = "Watch";
  
  return { score, riskLevel };
}

export function useProactiveEngine() {
  const { user } = useAuth();
  const { data: globalSettings } = useFirestoreDoc<any>("settings", user?.uid);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!user || ranOnce.current) return;
    
    // In a real production app, this would be a server-side cron job.
    // For this context, we run the evaluation once per user session start to simulate the cron.
    const runEvaluation = async () => {
      ranOnce.current = true;
      try {
        const dealsRef = collection(db, "contacts");
        // For simplicity, we just evaluate all "customer" records as deals in pipeline
        const q = query(dealsRef, where("ownerId", "==", user.uid));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (e) {
          console.error("Proactive Engine Error (getDocs contacts):", e);
          throw e;
        }
        
        const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        for (const deal of deals) {
          if (deal.type !== 'customer') continue;

          let riskFlags = 0;
          let reasons = [];

          // 1. Stalled Deal Detection
          if (isDealStalled(deal)) {
            riskFlags++;
            reasons.push("Deal stalled (no updates in 14+ days)");
            
            // Check if we already notified recently
            if (!deal.lastStalledNotice || (Date.now() - new Date(deal.lastStalledNotice).getTime() > 7 * 24 * 60 * 60 * 1000)) {
              try {
                await addDoc(collection(db, "agentNotifications"), {
                  type: "stalled_deal",
                  dealId: deal.id,
                  dealName: deal.name,
                  actionNeeded: "Schedule review meeting",
                  status: "pending_approval",
                  timestamp: serverTimestamp(),
                  ownerId: user.uid,
                  details: `Deal ${deal.name} has been stalled. I have drafted an internal review brief.`
                });
                await updateDoc(doc(db, "contacts", deal.id), {
                  lastStalledNotice: serverTimestamp()
                });
              } catch (e) {
                console.error("Proactive Engine Error (stalled_deal):", e);
                throw e;
              }
            }
          }

          // 2. Velocity Drop Detection
          // We'll simulate velocity drop if they have a low composite score and high deal value
          if ((deal.leadScore?.compositeScore || 100) < 50 && deal.dealValue > 10000) {
            riskFlags++;
            reasons.push("Low lead score for high value deal");
            
            if (!deal.lastVelocityNotice || (Date.now() - new Date(deal.lastVelocityNotice).getTime() > 7 * 24 * 60 * 60 * 1000)) {
              await addDoc(collection(db, "agentNotifications"), {
                type: "velocity_drop",
                dealId: deal.id,
                dealName: deal.name,
                actionNeeded: "Send re-engagement email",
                status: "pending_approval",
                timestamp: serverTimestamp(),
                ownerId: user.uid,
                details: `Detected dropping engagement for high-value prospect ${deal.name}. Drafted re-engagement email.`
              });
              await updateDoc(doc(db, "contacts", deal.id), {
                lastVelocityNotice: serverTimestamp()
              });
            }
          }

          // 3. High Value Risk
          if (deal.dealValue > 20000 && riskFlags >= 2) {
             if (!deal.lastEscalationNotice || (Date.now() - new Date(deal.lastEscalationNotice).getTime() > 14 * 24 * 60 * 60 * 1000)) {
               await addDoc(collection(db, "agentNotifications"), {
                 type: "high_value_escalation",
                 dealId: deal.id,
                 dealName: deal.name,
                 actionNeeded: "Escalate to Senior",
                 status: "pending_approval",
                 timestamp: serverTimestamp(),
                 ownerId: user.uid,
                 details: `CRITICAL HIGH VALUE RISK: ${deal.name}. Recommended action: Escalate deal.`
               });
               await updateDoc(doc(db, "contacts", deal.id), {
                 lastEscalationNotice: serverTimestamp()
               });
             }
          }

          // 4. Customer Success Health Check
          const health = calculateCustomerHealth(deal);
          if (health.score !== deal.customerHealth?.score || !deal.customerHealth) {
            await updateDoc(doc(db, "contacts", deal.id), {
              customerHealth: {
                score: health.score,
                riskLevel: health.riskLevel,
                lastCalculated: serverTimestamp()
              }
            });
          }

          if (health.riskLevel === "At Risk") {
            if (!deal.lastAtRiskNotice || (Date.now() - new Date(deal.lastAtRiskNotice).getTime() > 30 * 24 * 60 * 60 * 1000)) {
               await addDoc(collection(db, "agentNotifications"), {
                 type: "customer_at_risk",
                 dealId: deal.id,
                 dealName: deal.name,
                 actionNeeded: "Schedule QBR Review",
                 status: "pending_approval",
                 timestamp: serverTimestamp(),
                 ownerId: user.uid,
                 details: `Customer ${deal.name} is At Risk (Health Score: ${health.score}). Suggesting Quarterly Business Review scheduling.`
               });
               await updateDoc(doc(db, "contacts", deal.id), {
                 lastAtRiskNotice: serverTimestamp()
               });
            }
          } else if (health.riskLevel === "Watch") {
            if (!deal.lastWatchNotice || (Date.now() - new Date(deal.lastWatchNotice).getTime() > 14 * 24 * 60 * 60 * 1000)) {
               await addDoc(collection(db, "agentNotifications"), {
                 type: "customer_watch",
                 dealId: deal.id,
                 dealName: deal.name,
                 actionNeeded: "Send Check-in",
                 status: "pending_approval",
                 timestamp: serverTimestamp(),
                 ownerId: user.uid,
                 details: `Customer ${deal.name} health dropped to Watch. Drafted personalized check-in email.`
               });
               await updateDoc(doc(db, "contacts", deal.id), {
                 lastWatchNotice: serverTimestamp()
               });
            }
          }
        }
      } catch (error) {
        console.error("Proactive Engine Error:", error);
      }
    };

    runEvaluation();
    
    const interval = setInterval(runEvaluation, 4 * 60 * 60 * 1000); // 4 hours
    return () => clearInterval(interval);
  }, [user]);

}
