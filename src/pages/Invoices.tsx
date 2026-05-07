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
import { Plus, Search, FileDown, MoreHorizontal, Loader2, Pencil, Trash2, CreditCard } from "lucide-react";
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
import { calculateVat, ProductType, VatRegion } from "@/lib/vatUtils";
import { formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number; // Subtotal
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  productType: ProductType;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
}

interface Customer {
  id: string;
  name: string;
  type?: string;
}

export default function Invoices() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: invoices, loading: invoicesLoading, add, update, remove } = useFirestoreCollection<Invoice>("invoices");
  const { data: customers, loading: customersLoading } = useFirestoreCollection<Customer>("contacts");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<Omit<Invoice, "id" | "customerName" | "vatRate" | "vatAmount" | "totalAmount">>({
    invoiceNumber: "",
    customerId: "",
    amount: 0,
    productType: "standard",
    date: new Date().toISOString().split('T')[0],
    status: "Pending",
  });

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      customerId: "",
      amount: 0,
      productType: "standard",
      date: new Date().toISOString().split('T')[0],
      status: "Pending",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      amount: invoice.amount,
      productType: invoice.productType || "standard",
      date: invoice.date.split('T')[0],
      status: invoice.status,
    });
    setIsDialogOpen(true);
  };

  const handlePayment = async (invoice: Invoice) => {
    if (!settings?.stripeSecretKey) {
      alert("Please configure your Stripe Secret Key in Settings first.");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount || invoice.amount,
          customerName: invoice.customerName,
          stripeSecretKey: settings.stripeSecretKey,
          successUrl: `${window.location.origin}/app/payments?success=true&invoiceId=${invoice.id}`,
          cancelUrl: `${window.location.origin}/app/invoices?canceled=true`,
        }),
      });

      const session = await response.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        alert(session.error || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred while initiating payment.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    const region: VatRegion = settings?.vatRegion || "NO";
    const { rate, vatAmount, total } = calculateVat(formData.amount, region, formData.productType);

    const dataToSave = {
      ...formData,
      customerName: customer?.name || "Unknown Customer",
      vatRate: rate,
      vatAmount: vatAmount,
      totalAmount: total,
    };

    if (editingInvoice) {
      await update(editingInvoice.id, dataToSave);
    } else {
      await add(dataToSave);
    }
    setIsDialogOpen(false);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">{t("please_sign_in")}</h2>
        <p className="text-muted-foreground">{t("auth_required_invoices")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("invoices")}</h1>
          <p className="text-muted-foreground">{t("invoices_desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileDown size={18} />
            {t("export")}
          </Button>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus size={18} />
            {t("new_invoice")}
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
        {invoicesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice_id")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("subtotal")}</TableHead>
                <TableHead>{t("total_vat")}</TableHead>
                <TableHead>{t("total_amount")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? t("no_invoices_match") : t("no_invoices_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount, settings?.currency)}</TableCell>
                    <TableCell>{formatCurrency(invoice.vatAmount || 0, settings?.currency)} ({(invoice.vatRate || 0) * 100}%)</TableCell>
                    <TableCell className="font-bold">{formatCurrency(invoice.totalAmount || invoice.amount, settings?.currency)}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invoice.status === "Paid" ? "default" : 
                          invoice.status === "Pending" ? "secondary" : "destructive"
                        }
                      >
                        {invoice.status === "Paid" ? t("paid") : 
                         invoice.status === "Pending" ? t("pending") : t("overdue")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(invoice)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          {invoice.status !== "Paid" && (
                            <DropdownMenuItem onClick={() => handlePayment(invoice)} className="text-primary">
                              <CreditCard className="mr-2 h-4 w-4" />
                              {t("pay_with_stripe") || "Pay with Stripe"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(invoice.id)}>
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
              <DialogTitle>{editingInvoice ? t("edit_invoice") : t("new_invoice")}</DialogTitle>
              <DialogDescription>
                {t("invoice_details")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">{t("invoice_number")}</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer">{t("customer")}</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_customer") || "Select customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.filter(c => !c.type || c.type === 'customer').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">{t("subtotal")}</Label>
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
                <Label htmlFor="productType">{t("product_type")}</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value: any) => setFormData({ ...formData, productType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t("standard_goods")}</SelectItem>
                    <SelectItem value="food">{t("food_beverages")}</SelectItem>
                    <SelectItem value="culture">{t("culture_transport")}</SelectItem>
                    <SelectItem value="books">{t("books_newspapers")}</SelectItem>
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
                    <SelectItem value="Pending">{t("pending")}</SelectItem>
                    <SelectItem value="Paid">{t("paid")}</SelectItem>
                    <SelectItem value="Overdue">{t("overdue")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingInvoice ? t("save_changes") : t("create_invoice")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
