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
  MoreVertical,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  Globe,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createInvoice,
  resendInvoiceEmail,
  sendInvoiceWhatsApp,
  regenerateInvoicePdf,
} from "../../invoice-actions";
import type { InvoiceRow } from "../../_components/types";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

/** Downloads a PDF via fetch — ensures proper filename even when served from an API route. */
function downloadPdf(pdfUrl: string, filename: string) {
  fetch(pdfUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {
      // Fallback: open in new tab
      window.open(pdfUrl, "_blank")
    })
}

/** Opens a PDF in a new tab for preview/print. */
function printPdf(pdfUrl: string) {
  window.open(pdfUrl, "_blank")
}

const STATUS_STYLES: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  SENT: { label: "Sent", className: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  DRAFT: { label: "Draft", className: "bg-gray-50 text-gray-600 border-gray-200", icon: Clock },
  PAID: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-200", icon: Clock },
  CANCELLED: { label: "Cancelled", className: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: "bg-gray-50 text-gray-600 border-gray-200", icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
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
  const [items, setItems] = useState<LineItem[]>(
    suggestedItems.length ? suggestedItems : [{ description: "", quantity: 1, unitPrice: 0 }]
  );
  const [taxAmount, setTaxAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [isSaving, startSave] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = subtotal + taxAmount - discount;

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function handleCreate() {
    const cleanItems = items.filter((it) => it.description.trim());
    if (cleanItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
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
        lang,
      });
      if (res.success) {
        toast.success(
          res.data.emailSent
            ? `Invoice ${res.data.invoiceNumber} created and emailed to the client`
            : `Invoice ${res.data.invoiceNumber} created${sendEmailNow ? " — email could not be sent (check client has an email on file)" : ""}`
        );
        setOpen(false);
        setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
        setTaxAmount(0);
        setDiscount(0);
        setDueDate("");
        setNotes("");
        setLang("en");
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
    if (res.success) toast.success("Invoice emailed to client");
    else toast.error(res.error);
  }

  async function handleSendWhatsApp(id: string) {
    setSendingId(id);
    const res = await sendInvoiceWhatsApp(id);
    setSendingId(null);
    if (res.success) toast.success("Invoice sent via WhatsApp");
    else toast.error(res.error);
  }

  async function handleRegeneratePdf(id: string) {
    setRegeneratingId(id);
    const res = await regenerateInvoicePdf(id);
    setRegeneratingId(null);
    if (res.success) {
      toast.success("Invoice PDF regenerated");
      onChange();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="rounded-2xl border-border/50 p-5">
      {/* ── Header ────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b57fc]/10">
            <FileText className="h-4 w-4 text-[#7b57fc]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Invoices</h3>
            <p className="text-xs text-muted-foreground">
              {invoices.length === 0 ? "No invoices yet" : `${invoices.length} invoice${invoices.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-[#7b57fc] hover:bg-[#6845e8]">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Invoice
        </Button>
      </div>

      {/* ── Invoice list ──────────────────────────────── */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-10">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No invoices generated yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Create your first invoice for this shipment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isBusy = sendingId === inv.id || regeneratingId === inv.id;
            return (
              <div
                key={inv.id}
                className="group rounded-xl border border-border/80 bg-card transition-all hover:border-border hover:shadow-sm"
              >
                {/* Top row: invoice info */}
                <div className="flex items-center justify-between p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#7b57fc]/10 to-[#7b57fc]/5">
                      <FileText className="h-5 w-5 text-[#7b57fc]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{inv.invoiceNumber}</span>
                        <StatusPill status={inv.status} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(inv.createdAt), "MMM d, yyyy")}</span>
                        {inv.emailSentAt && (
                          <>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {format(new Date(inv.emailSentAt), "MMM d, h:mm a")}
                            </span>
                          </>
                        )}
                        {inv.whatsappSentAt && (
                          <>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {format(new Date(inv.whatsappSentAt), "MMM d, h:mm a")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#7b57fc]">
                      {inv.totalAmount.toFixed(2)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{inv.currency}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom row: actions */}
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {inv.pdfUrl ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => downloadPdf(inv.pdfUrl as string, inv.invoiceNumber)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => printPdf(inv.pdfUrl as string)}
                        >
                          <Printer className="h-3.5 w-3.5" /> Print
                        </Button>
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                        </a>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        disabled={regeneratingId === inv.id}
                        onClick={() => handleRegeneratePdf(inv.id)}
                      >
                        {regeneratingId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Regenerate PDF
                      </Button>
                    )}
                  </div>

                  {/* More actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={isBusy}>
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleResendEmail(inv.id)} disabled={sendingId === inv.id}>
                        <Mail className="mr-2 h-4 w-4" />
                        {inv.emailSentAt ? "Resend via Email" : "Send via Email"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendWhatsApp(inv.id)} disabled={sendingId === inv.id}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send via WhatsApp
                      </DropdownMenuItem>
                      {inv.pdfUrl && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRegeneratePdf(inv.id)} disabled={regeneratingId === inv.id}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate PDF
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Invoice Dialog ─────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b57fc]/10">
                <Plus className="h-4 w-4 text-[#7b57fc]" />
              </div>
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Line Items</Label>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])}
              >
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

            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#7b57fc]/5 to-[#7b57fc]/10 px-4 py-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-xl font-bold text-[#7b57fc]">
                {total.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs font-medium">Invoice Language</Label>
                  <p className="text-xs text-muted-foreground">PDF will be generated in selected language</p>
                </div>
              </div>
              <div className="flex overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    lang === "en" ? "bg-[#7b57fc] text-white" : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang("ar")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    lang === "ar" ? "bg-[#7b57fc] text-white" : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
              <div>
                <Label className="text-xs font-medium">Email invoice to client</Label>
                <p className="text-xs text-muted-foreground">Automatically send after creation</p>
              </div>
              <Switch checked={sendEmailNow} onCheckedChange={setSendEmailNow} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
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
