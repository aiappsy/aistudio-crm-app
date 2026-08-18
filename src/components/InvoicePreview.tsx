import React from 'react';
import { calculateVat } from '@/lib/vatUtils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Printer, Mail, Download } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface InvoicePreviewProps {
  invoice: any;
  customer?: any;
  settings?: any;
  onClose: () => void;
  onSend: () => void;
  isSending?: boolean;
}

export function InvoicePreview({ invoice, customer, settings, onClose, onSend, isSending }: InvoicePreviewProps) {
  const { t } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  const businessName = settings?.companyName || "Your Company";
  const businessAddress = settings?.address || "123 Business St";
  const businessEmail = settings?.contactEmail || "contact@company.com";
  
  return (
    <div className="flex flex-col h-full bg-white text-black p-8 rounded-md print-container">
      {/* Non-printable action bar */}
      <div className="flex justify-between mb-8 print-hidden items-center border-b pb-4">
        <h2 className="text-2xl font-bold">Invoice Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer size={16} />
            Print / Save PDF
          </Button>
          <Button onClick={onSend} className="gap-2" disabled={isSending}>
            <Mail size={16} />
            {isSending ? "Sending..." : "Send to Customer"}
          </Button>
        </div>
      </div>

      {/* Printable Invoice Area */}
      <div className="flex flex-col flex-1 printable-area p-8 border rounded-md shadow-sm">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-gray-500 font-medium">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{businessName}</h2>
            <p className="text-gray-500 mt-1">{businessAddress}</p>
            <p className="text-gray-500">{businessEmail}</p>
          </div>
        </div>

        <div className="flex justify-between items-start mb-12 border-t pt-8">
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-2 text-left">Bill To</h3>
            <p className="text-lg font-medium">{customer?.name || invoice.customerName}</p>
            {customer?.email && <p className="text-gray-500">{customer.email}</p>}
            {customer?.address && <p className="text-gray-500 mt-1">{customer.address}</p>}
            {customer?.phone && <p className="text-gray-500">{customer.phone}</p>}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-1 text-right">Date Issued</h3>
              <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-1 text-right">Status</h3>
              <p className={`font-bold ${invoice.status === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {invoice.status}
              </p>
            </div>
          </div>
        </div>

        <table className="w-full mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 text-left font-bold text-gray-600 uppercase text-sm">Description</th>
              <th className="py-3 text-right font-bold text-gray-600 uppercase text-sm">Product Type</th>
              <th className="py-3 text-right font-bold text-gray-600 uppercase text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4">Services / Products rendered for {invoice.customerName}</td>
              <td className="py-4 text-right capitalize">{invoice.productType || 'Standard'}</td>
              <td className="py-4 text-right font-medium">{formatCurrency(invoice.amount, settings?.currency)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.amount, settings?.currency)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">VAT ({(invoice.vatRate || 0) * 100}%)</span>
              <span className="font-medium">{formatCurrency(invoice.vatAmount || 0, settings?.currency)}</span>
            </div>
            <div className="flex justify-between py-4">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.totalAmount || invoice.amount, settings?.currency)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-16 text-center text-sm text-gray-400 border-t print-footer">
          <p>Thank you for your business.</p>
        </div>
      </div>
      
      {/* Hide elements implicitly when printing via css - to be added to index.css */}
    </div>
  );
}
