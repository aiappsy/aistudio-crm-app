import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DemoDataGenerator({ ownerId }: { ownerId: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateDemoData = async () => {
    if (!ownerId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Add 5 mock contacts
      const contactsRef = collection(db, "contacts");
      const fakeContacts = [
        { name: "Acme Corp", industry: "Tech", email: "contact@acme.example", status: "Lead", type: "customer", customerHealth: { score: 90, riskLevel: "Healthy" }, ownerId },
        { name: "Global Freight", industry: "Logistics", email: "info@globalfreight.example", status: "Active", type: "customer", customerHealth: { score: 40, riskLevel: "At Risk" }, ownerId },
        { name: "TechNova", industry: "Software", email: "hello@technova.example", status: "Inactive", type: "customer", customerHealth: { score: 65, riskLevel: "Watch" }, ownerId },
        { name: "Nordic Ice", industry: "Food", email: "sales@nordicice.example", status: "Lead", type: "customer", customerHealth: { score: 85, riskLevel: "Healthy" }, ownerId },
        { name: "Stellar Solutions", industry: "Consulting", email: "info@stellarsolutions.example", status: "Active", type: "customer", customerHealth: { score: 95, riskLevel: "Healthy" }, ownerId },
        { name: "SupplyCo Parts", industry: "Manufacturing", email: "orders@supplyco.example", status: "Active", type: "supplier", customerHealth: { score: 80, riskLevel: "Healthy" }, ownerId },
        { name: "OfficeMart Wholesale", industry: "Retail", email: "b2b@officemart.example", status: "Active", type: "supplier", customerHealth: { score: 92, riskLevel: "Healthy" }, ownerId },
      ];

      const contactPromises = fakeContacts.map(c => addDoc(contactsRef, { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
      const contactDocs = await Promise.all(contactPromises);

      // 2. Add some invoices
      const invoicesRef = collection(db, "invoices");
      const fakeInvoices = [
        { invoiceNumber: "INV-1001", customerId: contactDocs[0].id, customerName: "Acme Corp", amount: 1500, totalAmount: 1500, status: "Pending", ownerId },
        { invoiceNumber: "INV-1002", customerId: contactDocs[1].id, customerName: "Global Freight", amount: 3200, totalAmount: 3200, status: "Paid", ownerId },
      ];

      await Promise.all(fakeInvoices.map(inv => addDoc(invoicesRef, { ...inv, date: new Date().toISOString(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })));

      // 3. Add a payment just to make dashboard charts show something
      const paymentsRef = collection(db, "payments");
      await addDoc(paymentsRef, {
        invoiceId: "INV-1002",
        customerId: contactDocs[1].id,
        amount: 3200,
        status: "Completed",
        date: new Date().toISOString(),
        ownerId,
        createdAt: serverTimestamp(),
      });

    } catch (e: any) {
      console.error("Error generating demo data", e);
      setErrorMsg(`Failed to generate demo data: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Welcome to Aiappsy CRM!
        </CardTitle>
        <CardDescription>
          It looks like you don't have any contacts yet. Generate some demo data to see what the dashboard, CRM, and insights look like when populated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 border border-destructive/20">
            {errorMsg}
          </div>
        )}
        <Button onClick={generateDemoData} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate Demo Data
        </Button>
      </CardContent>
    </Card>
  );
}
