// app/[locale]/admin/(routes)/shipments/[id]/_components/ShipmentDetailClient.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Ship,
  Plane,
  Truck as TruckIcon,
  Zap,
  Pencil,
  User,
  Mail,
  Phone,
  Building2,
  Package,
  DollarSign,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "../../_components/StatusBadge";
import { ShipmentFormDialog } from "../../_components/ShipmentFormDialog";
import { getShipmentById } from "../../actions";
import { ShipmentTimeline } from "./ShipmentTimeline";
import { ShipmentInvoices } from "./ShipmentInvoices";
import { ShipmentImages } from "./ShipmentImages";
import type { ShipmentRow } from "../../_components/types";

const FREIGHT_ICONS: Record<string, any> = { SEA: Ship, AIR: Plane, LAND: TruckIcon, EXPRESS: Zap };

export function ShipmentDetailClient({ shipment: initial }: { shipment: ShipmentRow }) {
  const [shipment, setShipment] = useState<ShipmentRow>(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [, startRefresh] = useTransition();
  const router = useRouter();

  function refresh() {
    startRefresh(async () => {
      const res = await getShipmentById(shipment.id);
      if (res.success) {
        setShipment(res.data);
      } else {
        toast.error(res.error);
      }
      router.refresh();
    });
  }

  const totalCost = shipment.productCost + shipment.shippingCost + shipment.customsFees + shipment.otherFees;
  const FreightIcon = FREIGHT_ICONS[shipment.freightType] ?? Package;

  // Extract locale from the current URL (admin is always under /en or /ar)
  const pathLocale = typeof window !== "undefined"
    ? window.location.pathname.match(/^\/(en|ar)\//)?.[1] ?? "ar"
    : "ar";
  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${pathLocale}/track/${shipment.trackingCode}`
    : `/${pathLocale}/track/${shipment.trackingCode}`;

  function copyTrackingLink() {
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Tracking link copied");
  }

  const clientName = shipment.client?.fullName || shipment.client?.email || shipment.guestClient?.fullName || "—";
  const clientEmail = shipment.client?.email ?? shipment.guestClient?.email;
  const clientPhone = shipment.client?.phone ?? shipment.guestClient?.phone;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/shipments" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shipments
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-foreground">{shipment.trackingCode}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          {shipment.lastSyncError && (
            <p className="mt-1 text-xs text-red-600">Sync issue: {shipment.lastSyncError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyTrackingLink}><Copy className="mr-2 h-4 w-4" /> Copy Tracking Link</Button>
          <Button onClick={() => setEditOpen(true)} className="bg-[#7b57fc] hover:bg-[#6845e8]">
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column: overview ─────────────── */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl border-border/50 space-y-3 p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold"><User className="h-4 w-4" /> Client</h3>
            <p className="text-sm font-medium">{clientName}</p>
            <p className="text-xs text-muted-foreground">{shipment.guestClient ? "Guest client (no account)" : "Registered client"}</p>
            {clientEmail && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {clientEmail}</p>}
            {clientPhone && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {clientPhone}</p>}
            {shipment.guestClient && shipment.guestClient.company && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> {shipment.guestClient.company}</p>
            )}
          </Card>

          <Card className="rounded-2xl border-border/50 space-y-3 p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold"><FreightIcon className="h-4 w-4" /> Route &amp; Method</h3>
            <p className="text-sm">{shipment.originCountry} → {shipment.destinationCountry}</p>
            <p className="text-xs text-muted-foreground">{shipment.freightType} freight{shipment.carrierName ? ` · ${shipment.carrierName}` : ""}</p>
            {shipment.carrierTrackingNumber && (
              <p className="font-mono text-xs text-muted-foreground">Carrier #: {shipment.carrierTrackingNumber}</p>
            )}
            {shipment.estimatedDelivery && (
              <p className="text-xs text-muted-foreground">ETA: {format(new Date(shipment.estimatedDelivery), "MMM d, yyyy")}</p>
            )}
            {shipment.weightKg && <p className="text-xs text-muted-foreground">Weight: {shipment.weightKg} kg</p>}
            {shipment.volumeCbm && <p className="text-xs text-muted-foreground">Volume: {shipment.volumeCbm} CBM</p>}
          </Card>

          <Card className="rounded-2xl border-border/50 space-y-3 p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold"><Package className="h-4 w-4" /> Product</h3>
            <p className="text-sm">{shipment.productDescription}</p>
            {shipment.productLink && (
              <a href={shipment.productLink} target="_blank" rel="noreferrer" className="text-xs text-[#7b57fc] hover:underline">
                View product link
              </a>
            )}
            <p className="text-xs text-muted-foreground">Quantity: {shipment.quantity ?? 1}</p>
          </Card>

          <Card className="rounded-2xl border-border/50 space-y-2 p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold"><DollarSign className="h-4 w-4" /> Cost Breakdown</h3>
            <CostRow label="Product" value={shipment.productCost} currency={shipment.currency} />
            <CostRow label="Shipping" value={shipment.shippingCost} currency={shipment.currency} />
            <CostRow label="Customs" value={shipment.customsFees} currency={shipment.currency} />
            <CostRow label="Other" value={shipment.otherFees} currency={shipment.currency} />
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold text-[#7b57fc]">{totalCost.toFixed(2)} {shipment.currency}</span>
            </div>
          </Card>

          <ShipmentImages shipmentId={shipment.id} images={shipment.images} onChange={refresh} />
        </div>

        {/* ── Right column: timeline + invoices ─── */}
        <div className="space-y-6 lg:col-span-2">
          <ShipmentTimeline
            shipmentId={shipment.id}
            events={shipment.events ?? []}
            trackingSource={shipment.trackingSource}
            onChange={refresh}
          />
          <ShipmentInvoices
            shipmentId={shipment.id}
            clientId={shipment.clientId}
            guestClientId={shipment.guestClientId}
            invoices={shipment.invoices ?? []}
            currency={shipment.currency}
            suggestedItems={[
              { description: shipment.productDescription, quantity: shipment.quantity ?? 1, unitPrice: shipment.productCost },
              { description: `${shipment.freightType} Shipping (${shipment.originCountry} → ${shipment.destinationCountry})`, quantity: 1, unitPrice: shipment.shippingCost },
              ...(shipment.customsFees ? [{ description: "Customs Fees", quantity: 1, unitPrice: shipment.customsFees }] : []),
              ...(shipment.otherFees ? [{ description: "Other Fees", quantity: 1, unitPrice: shipment.otherFees }] : []),
            ]}
            onChange={refresh}
          />
        </div>
      </div>

      <ShipmentFormDialog open={editOpen} onOpenChange={setEditOpen} shipment={shipment} onSaved={refresh} />
    </div>
  );
}

function CostRow({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value.toFixed(2)} {currency}</span>
    </div>
  );
}
