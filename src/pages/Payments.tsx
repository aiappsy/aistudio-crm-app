import { useState, FormEvent } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, CreditCard, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: string;
  date: string;
  status: "Completed" | "Processing" | "Failed";
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  totalAmount?: number;
  status: string;
}

export default function Payments() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", userProfile?.organizationId || user?.uid);
  const { data: payments, loading: paymentsLoading, add, remove } = useFirestoreCollection<Payment>("payments");
  const { data: invoices, loading: invoicesLoading, update: updateInvoice } = useFirestoreCollection<Invoice>("invoices");

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const invoiceId = searchParams.get("invoiceId");

    if (success === "true" && invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice && invoice.status !== "Paid") {
        // Record the payment
        add({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          amount: invoice.totalAmount || invoice.amount,
          method: "Credit Card (Stripe)",
          date: new Date().toISOString().split('T')[0],
          status: "Completed",
        });

        // Mark invoice as paid
        updateInvoice(invoice.id, { status: "Paid" });
        
        // Remove query params to prevent duplicate recording on refresh
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, invoices, add, updateInvoice, setSearchParams]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<Omit<Payment, "id" | "invoiceNumber" | "customerId" | "customerName">>({
    invoiceId: "",
    amount: 0,
    method: "Credit Card",
    date: new Date().toISOString().split('T')[0],
    status: "Completed",
  });

  const handleOpenAdd = () => {
    setFormData({
      invoiceId: "",
      amount: 0,
      method: "Credit Card",
      date: new Date().toISOString().split('T')[0],
      status: "Completed",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const invoice = invoices.find(inv => inv.id === formData.invoiceId);
    const dataToSave = {
      ...formData,
      invoiceNumber: invoice?.invoiceNumber || "Unknown",
      customerId: invoice?.customerId || "Unknown",
      customerName: invoice?.customerName || "Unknown Customer",
    };

    await add(dataToSave);
    setIsDialogOpen(false);
  };

  const filteredPayments = payments.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">{t("sign_in")}</h2>
        <p className="text-muted-foreground">You need to be authenticated to manage payments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("payments")}</h1>
          <p className="text-muted-foreground">{t("payments_desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download size={18} />
            {t("export_csv")}
          </Button>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus size={18} />
            {t("record_payment")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        {paymentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices")}</TableHead>
                <TableHead>{t("customers")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("payment_method")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? t("no_results") : t("create_first")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{formatCurrency(payment.amount, settings?.currency)}</TableCell>
                    <TableCell>
                      {payment.method === "Credit Card" ? t("credit_card") :
                       payment.method === "Bank Transfer" ? t("bank_transfer") :
                       payment.method === "PayPal" ? t("paypal") :
                       payment.method === "Cash" ? t("cash") : payment.method}
                    </TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.status === "Completed" ? "default" : "secondary"
                        }
                      >
                        {payment.status === "Completed" ? t("completed") : 
                         payment.status === "Processing" ? t("processing") : t("failed")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(payment.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{t("record_payment")}</DialogTitle>
              <DialogDescription>
                {t("payment_details")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice">{t("invoices")}</Label>
                <Select
                  value={formData.invoiceId}
                  onValueChange={(value) => {
                    const inv = invoices.find(i => i.id === value);
                    setFormData({ ...formData, invoiceId: value, amount: inv?.amount || 0 });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_invoice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">{t("amount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">{t("payment_method")}</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_method")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">{t("credit_card")}</SelectItem>
                    <SelectItem value="Bank Transfer">{t("bank_transfer")}</SelectItem>
                    <SelectItem value="PayPal">{t("paypal")}</SelectItem>
                    <SelectItem value="Cash">{t("cash")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">{t("date")}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">{t("completed")}</SelectItem>
                    <SelectItem value="Processing">{t("processing")}</SelectItem>
                    <SelectItem value="Failed">{t("failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("record_payment")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
