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
import { Plus, Search, MoreHorizontal, Loader2, Pencil, Trash2, FileText, Printer } from "lucide-react";
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

interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  amount: number; // Subtotal
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  productType: ProductType;
  date: string;
  expiry: string;
  status: "Accepted" | "Pending" | "Expired";
}

interface Customer {
  id: string;
  name: string;
  type?: string;
}

export default function Quotes() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const { data: settings } = useFirestoreDoc<any>("settings", user?.uid);
  const { data: quotes, loading: quotesLoading, add, update, remove } = useFirestoreCollection<Quote>("quotes");
  const { data: customers, loading: customersLoading } = useFirestoreCollection<Customer>("contacts");
  const { add: addInvoice } = useFirestoreCollection<any>("invoices");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<Omit<Quote, "id" | "customerName" | "vatRate" | "vatAmount" | "totalAmount">>({
    quoteNumber: "",
    customerId: "",
    amount: 0,
    productType: "standard",
    date: new Date().toISOString().split('T')[0],
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "Pending",
  });

  const handleOpenAdd = () => {
    setEditingQuote(null);
    setFormData({
      quoteNumber: `QT-${Math.floor(Math.random() * 10000)}`,
      customerId: "",
      amount: 0,
      productType: "standard",
      date: new Date().toISOString().split('T')[0],
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Pending",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      amount: quote.amount,
      productType: quote.productType || "standard",
      date: quote.date.split('T')[0],
      expiry: quote.expiry.split('T')[0],
      status: quote.status,
    });
    setIsDialogOpen(true);
  };

  const convertToInvoice = async (quote: Quote) => {
    try {
      await addInvoice({
        invoiceNumber: `INV-${quote.quoteNumber.split('-')[1] || Math.floor(Math.random() * 10000)}`,
        customerId: quote.customerId,
        customerName: quote.customerName,
        amount: quote.amount,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        totalAmount: quote.totalAmount,
        productType: quote.productType,
        date: new Date().toISOString().split('T')[0],
        status: "Pending",
        sourceQuoteId: quote.id
      });
      
      await update(quote.id, { status: "Accepted" });
      alert("Quote successfully converted to Invoice!");
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Failed to convert quote to invoice.");
    }
  };

  const printQuote = (quote: Quote) => {
    window.print();
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

    if (editingQuote) {
      await update(editingQuote.id, dataToSave);
    } else {
      await add(dataToSave);
    }
    setIsDialogOpen(false);
  };

  const filteredQuotes = quotes.filter(q => 
    q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">{t("please_sign_in")}</h2>
        <p className="text-muted-foreground">{t("auth_required_quotes")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("quotes")}</h1>
          <p className="text-muted-foreground">{t("quotes_desc")}</p>
        </div>
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus size={18} />
          {t("new_quote")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9"
            value={searchQuery ?? ""}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        {quotesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quote_id")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("subtotal")}</TableHead>
                <TableHead>{t("total_vat")}</TableHead>
                <TableHead>{t("total_amount")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("expiry")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? t("no_quotes_match") : t("no_quotes_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>{formatCurrency(quote.amount, settings?.currency)}</TableCell>
                    <TableCell>{formatCurrency(quote.vatAmount || 0, settings?.currency)} ({(quote.vatRate || 0) * 100}%)</TableCell>
                    <TableCell className="font-bold">{formatCurrency(quote.totalAmount || quote.amount, settings?.currency)}</TableCell>
                    <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(quote.expiry).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          quote.status === "Accepted" ? "default" : 
                          quote.status === "Pending" ? "secondary" : "destructive"
                        }
                      >
                        {quote.status === "Accepted" ? t("accepted") : 
                         quote.status === "Pending" ? t("pending") : t("expired")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(quote)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => printQuote(quote)}>
                            <Printer className="mr-2 h-4 w-4" />
                            {t("print_pdf") || "Print/PDF"}
                          </DropdownMenuItem>
                          {quote.status !== "Accepted" && (
                            <DropdownMenuItem onClick={() => convertToInvoice(quote)} className="text-primary">
                              <FileText className="mr-2 h-4 w-4" />
                              {t("convert_to_invoice") || "Convert to Invoice"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(quote.id)}>
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
              <DialogTitle>{editingQuote ? t("edit_quote") : t("new_quote")}</DialogTitle>
              <DialogDescription>
                {t("quote_details")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="quoteNumber">{t("quote_number")}</Label>
                <Input
                  id="quoteNumber"
                  value={formData.quoteNumber ?? ""}
                  onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer">{t("customer")}</Label>
                <Select
                  value={formData.customerId ?? ""}
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
                  value={formData.amount ?? ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productType">{t("product_type")}</Label>
                <Select
                  value={formData.productType ?? ""}
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
                  value={formData.date ?? ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">{t("expiry_date")}</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={formData.expiry ?? ""}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  value={formData.status ?? ""}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">{t("pending")}</SelectItem>
                    <SelectItem value="Accepted">{t("accepted")}</SelectItem>
                    <SelectItem value="Expired">{t("expired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingQuote ? t("save_changes") : t("create_quote")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
