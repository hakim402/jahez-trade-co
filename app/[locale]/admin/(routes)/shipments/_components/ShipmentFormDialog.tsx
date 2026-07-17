// app/[locale]/admin/(routes)/shipments/_components/ShipmentFormDialog.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Package, Ship, Plane, Truck, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ClientPicker, type SelectedClient } from "./ClientPicker";
import { createShipment, updateShipment } from "../actions";
import type { ShipmentInput } from "../actions";
import type { ShipmentRow, FreightTypeValue, TrackingSourceValue } from "./types";

const FREIGHT_OPTIONS: { value: FreightTypeValue; label: string; icon: typeof Ship }[] = [
  { value: "SEA", label: "Sea Freight", icon: Ship },
  { value: "AIR", label: "Air Freight", icon: Plane },
  { value: "LAND", label: "Land Freight", icon: Truck },
  { value: "EXPRESS", label: "Express Courier", icon: Zap },
];

const COMMON_ORIGINS = ["China", "Guangzhou, China", "Yiwu, China", "Shenzhen, China"];
const COMMON_DESTINATIONS = ["Yemen", "UAE", "Dubai, UAE", "USA"];

const emptyForm: ShipmentInput = {
  clientId: null,
  guestClientId: null,
  requestId: null,
  quoteId: null,
  productDescription: "",
  productLink: "",
  quantity: 1,
  originCountry: "China",
  destinationCountry: "",
  freightType: "SEA",
  carrierName: "",
  carrierTrackingNumber: "",
  trackingSource: "MANUAL",
  autoSyncEnabled: true,
  weightKg: null,
  volumeCbm: null,
  productCost: 0,
  shippingCost: 0,
  customsFees: 0,
  otherFees: 0,
  currency: "USD",
  estimatedDelivery: null,
};

function formFromShipment(shipment: ShipmentRow): ShipmentInput {
  return {
    clientId: shipment.clientId,
    guestClientId: shipment.guestClientId,
    requestId: null,
    quoteId: null,
    productDescription: shipment.productDescription,
    productLink: shipment.productLink,
    quantity: shipment.quantity ?? 1,
    originCountry: shipment.originCountry,
    destinationCountry: shipment.destinationCountry,
    freightType: shipment.freightType,
    carrierName: shipment.carrierName,
    carrierTrackingNumber: shipment.carrierTrackingNumber,
    trackingSource: shipment.trackingSource,
    autoSyncEnabled: shipment.autoSyncEnabled,
    weightKg: shipment.weightKg,
    volumeCbm: shipment.volumeCbm,
    productCost: shipment.productCost,
    shippingCost: shipment.shippingCost,
    customsFees: shipment.customsFees,
    otherFees: shipment.otherFees,
    currency: shipment.currency,
    estimatedDelivery: shipment.estimatedDelivery,
  };
}

function clientFromShipment(shipment: ShipmentRow): SelectedClient | null {
  if (shipment.client) {
    return {
      kind: "user",
      id: shipment.client.id,
      displayName: shipment.client.fullName || shipment.client.email,
      email: shipment.client.email,
      phone: shipment.client.phone,
    };
  }
  if (shipment.guestClient) {
    return {
      kind: "guest",
      id: shipment.guestClient.id,
      displayName: shipment.guestClient.fullName,
      email: shipment.guestClient.email,
      phone: shipment.guestClient.phone ?? null,
    };
  }
  return null;
}

export function ShipmentFormDialog({
  open,
  onOpenChange,
  shipment,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: ShipmentRow | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {/* Keying by shipment id (or "new") forces a fresh mount — and therefore fresh
            initial state — every time a different shipment is opened, instead of
            syncing props into state via an effect. */}
        <ShipmentFormContent
          key={open ? (shipment?.id ?? "new") : "closed"}
          shipment={shipment ?? null}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function ShipmentFormContent({
  shipment,
  onOpenChange,
  onSaved,
}: {
  shipment: ShipmentRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(shipment);
  const [form, setForm] = useState<ShipmentInput>(() => (shipment ? formFromShipment(shipment) : emptyForm));
  const [client, setClient] = useState<SelectedClient | null>(() => (shipment ? clientFromShipment(shipment) : null));
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ShipmentInput>(key: K, value: ShipmentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!client) {
      toast.error("Select or register a client for this shipment");
      return;
    }
    if (!form.productDescription.trim()) {
      toast.error("Add a product description");
      return;
    }
    if (!form.destinationCountry.trim()) {
      toast.error("Select a destination country");
      return;
    }

    const payload: ShipmentInput = {
      ...form,
      clientId: client.kind === "user" ? client.id : null,
      guestClientId: client.kind === "guest" ? client.id : null,
    };

    startTransition(async () => {
      const res = isEdit ? await updateShipment(shipment!.id, payload) : await createShipment(payload);
      if (res.success) {
        const trackingCode = "trackingCode" in res.data ? res.data.trackingCode : "";
        toast.success(isEdit ? "Shipment updated" : `Shipment created — tracking code ${trackingCode}`);
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  const estimatedTotal =
    (form.productCost || 0) + (form.shippingCost || 0) + (form.customsFees || 0) + (form.otherFees || 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Shipment" : "New Shipment"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-2">
        {/* ── Client ─────────────────────────────── */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">Client</Label>
          <ClientPicker value={client} onChange={setClient} />
        </section>

        {/* ── Product ────────────────────────────── */}
        <section className="space-y-3">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Package className="h-4 w-4" /> Product Details
          </Label>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description *</Label>
            <Textarea
              value={form.productDescription}
              onChange={(e) => set("productDescription", e.target.value)}
              rows={2}
              placeholder="e.g. 200x LED strip lights, waterproof, 5m rolls"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product Link</Label>
              <Input value={form.productLink ?? ""} onChange={(e) => set("productLink", e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity ?? 1}
                onChange={(e) => set("quantity", Number(e.target.value) || 1)}
              />
            </div>
          </div>
        </section>

        {/* ── Route & Method ─────────────────────── */}
        <section className="space-y-3">
          <Label className="text-sm font-semibold">Route &amp; Shipping Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Origin Country *</Label>
              <Input list="origin-list" value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} />
              <datalist id="origin-list">
                {COMMON_ORIGINS.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Destination Country *</Label>
              <Input list="dest-list" value={form.destinationCountry} onChange={(e) => set("destinationCountry", e.target.value)} placeholder="Yemen / UAE / USA…" />
              <datalist id="dest-list">
                {COMMON_DESTINATIONS.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FREIGHT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = form.freightType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("freightType", opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition",
                    active ? "border-[#7b57fc] bg-[#7b57fc]/10 text-[#7b57fc]" : "border-border text-muted-foreground hover:border-[#7b57fc]/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Carrier / Forwarder Name</Label>
            <Input value={form.carrierName ?? ""} onChange={(e) => set("carrierName", e.target.value)} placeholder="e.g. DHL, Aramex, local forwarder…" />
          </div>
        </section>

        {/* ── Tracking ───────────────────────────── */}
        <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <Label className="text-sm font-semibold">Tracking</Label>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tracking Method</Label>
            <Select value={form.trackingSource} onValueChange={(v) => set("trackingSource", v as TrackingSourceValue)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual updates only</SelectItem>
                <SelectItem value="API_17TRACK">Auto-sync via 17TRACK API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.trackingSource === "API_17TRACK" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Carrier Tracking Number</Label>
                <Input
                  value={form.carrierTrackingNumber ?? ""}
                  onChange={(e) => set("carrierTrackingNumber", e.target.value)}
                  placeholder="e.g. YT2345678901234CN"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Auto-sync enabled</Label>
                <Switch checked={form.autoSyncEnabled} onCheckedChange={(v) => set("autoSyncEnabled", v)} />
              </div>
            </>
          )}
        </section>

        {/* ── Weight / Volume ────────────────────── */}
        <section className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
            <Input type="number" step="0.01" value={form.weightKg ?? ""} onChange={(e) => set("weightKg", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Volume (CBM)</Label>
            <Input type="number" step="0.001" value={form.volumeCbm ?? ""} onChange={(e) => set("volumeCbm", e.target.value ? Number(e.target.value) : null)} />
          </div>
        </section>

        {/* ── Costs ──────────────────────────────── */}
        <section className="space-y-3">
          <Label className="text-sm font-semibold">Costs</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product Cost</Label>
              <Input type="number" step="0.01" value={form.productCost} onChange={(e) => set("productCost", Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Shipping Cost</Label>
              <Input type="number" step="0.01" value={form.shippingCost} onChange={(e) => set("shippingCost", Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Customs Fees</Label>
              <Input type="number" step="0.01" value={form.customsFees} onChange={(e) => set("customsFees", Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Other Fees</Label>
              <Input type="number" step="0.01" value={form.otherFees} onChange={(e) => set("otherFees", Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#7b57fc]/5 px-3 py-2">
            <span className="text-sm font-medium">Estimated Total</span>
            <span className="text-lg font-bold text-[#7b57fc]">
              {estimatedTotal.toFixed(2)} {form.currency}
            </span>
          </div>
        </section>

        <section className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estimated Delivery Date</Label>
          <Input
            type="date"
            value={form.estimatedDelivery ? form.estimatedDelivery.slice(0, 10) : ""}
            onChange={(e) => set("estimatedDelivery", e.target.value || null)}
          />
        </section>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isPending} className="bg-[#7b57fc] hover:bg-[#6845e8]">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Shipment"}
        </Button>
      </DialogFooter>
    </>
  );
}
