// app/[locale]/admin/(routes)/shipments/[id]/_components/ShipmentInvoices.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Loader2,
  Mail,
  MessageCircle,
  Download,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createInvoice, resendInvoiceEmail, sendInvoiceWhatsApp } from "../../invoice-actions";
import type { InvoiceRow } from "../../_components/types";

interface LineItem { description: string; quantity: number; unitPrice: number }

/** Prints a same-origin PDF via a hidden iframe — no new tab, goes straight to the print dialog. */
function printPdf(pdfUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = pdfUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: some browsers block same-origin PDF printing via iframe — open it instead.
      window.open(pdfUrl, "_blank");
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 60_000);
    }
  };
}

export function ShipmentInvoices({
  shipmentId,
  clientId,
  guestClientId,
  invoices,
  currency,
  suggestedItems,
  onChange,
}: {
  shipmentId: string;
  clientId: string | null;
  guestClientId: string | null;
  invoices: InvoiceRow[];
  currency: string;
  suggestedItems: LineItem[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>(suggestedItems.length ? suggestedItems : [{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [isSaving, startSave] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = subtotal + taxAmount - discount;

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function handleCreate() {
    const cleanItems = items.filter((it) => it.description.trim());
    if (cleanItems.length === 0) { toast.error("Add at least one line item"); return; }
    startSave(async () => {
      const res = await createInvoice({
        shipmentId,
        clientId,
        guestClientId,
        items: cleanItems,
        taxAmount,
        discount,
        currency,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
        sendEmailNow,
      });
      if (res.success) {
        toast.success(
          res.data.emailSent
            ? `Invoice ${res.data.invoiceNumber} created and emailed to the client`
            : `Invoice ${res.data.invoiceNumber} created${sendEmailNow ? " — email could not be sent (check client has an email on file)" : ""}`,
        );
        setOpen(false);
        setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
        setTaxAmount(0); setDiscount(0); setDueDate(""); setNotes("");
        onChange();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function handleResendEmail(id: string) {
    setSendingId(id);
    const res = await resendInvoiceEmail(id);
    setSendingId(null);
    if (res.success) toast.success("Invoice emailed");
    else toast.error(res.error);
  }

  async function handleSendWhatsApp(id: string) {
    setSendingId(id);
    const res = await sendInvoiceWhatsApp(id);
    setSendingId(null);
    if (res.success) toast.success("Invoice sent via WhatsApp");
    else toast.error(res.error);
  }

  return (
    <Card className="rounded-2xl border-border/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Invoices</h3>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-[#7b57fc] hover:bg-[#6845e8]">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No invoices generated yet.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#7b57fc]" />
                  <span className="text-sm font-semibold">{inv.invoiceNumber}</span>
                  <Badge variant="outline" className="text-xs">{inv.status}</Badge>
                </div>
                <span className="text-sm font-bold text-[#7b57fc]">{inv.totalAmount.toFixed(2)} {inv.currency}</span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                Created {format(new Date(inv.createdAt), "MMM d, yyyy")}
                {inv.emailSentAt && ` · Emailed ${format(new Date(inv.emailSentAt), "MMM d, h:mm a")}`}
                {inv.whatsappSentAt && ` · WhatsApp sent ${format(new Date(inv.whatsappSentAt), "MMM d, h:mm a")}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {inv.pdfUrl && (
                  <>
                    <a href={inv.pdfUrl} download={`${inv.invoiceNumber}.pdf`}>
                      <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF</Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={() => printPdf(inv.pdfUrl as string)}>
                      <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" disabled={sendingId === inv.id} onClick={() => handleResendEmail(inv.id)}>
                  {sendingId === inv.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
                  {inv.emailSentAt ? "Resend Email" : "Send Email"}
                </Button>
                <Button size="sm" variant="outline" disabled={sendingId === inv.id} onClick={() => handleSendWhatsApp(inv.id)}>
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Send via WhatsApp
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-6"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    step="0.01"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-9 w-9"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Line
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tax</Label>
                <Input type="number" step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Discount</Label>
                <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#7b57fc]/5 px-3 py-2">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold text-[#7b57fc]">{total.toFixed(2)} {currency}</span>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Email invoice to client automatically</Label>
              <Switch checked={sendEmailNow} onCheckedChange={setSendEmailNow} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="bg-[#7b57fc] hover:bg-[#6845e8]">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
