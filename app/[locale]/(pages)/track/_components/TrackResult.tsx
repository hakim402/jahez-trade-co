// app/[locale]/(pages)/track/_components/TrackResult.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Ship, Plane, Truck, Zap, Package, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_ORDER, statusProgress } from "@/lib/shipping/status-map";
import type { PublicShipmentView } from "../actions";

const FREIGHT_ICONS: Record<string, any> = { SEA: Ship, AIR: Plane, LAND: Truck, EXPRESS: Zap };

export function TrackResult({ shipment, locale }: { shipment: PublicShipmentView; locale: string }) {
  const isAr = locale === "ar";
  const FreightIcon = FREIGHT_ICONS[shipment.freightType] ?? Package;
  const statusMeta = SHIPMENT_STATUS_LABELS[shipment.status as keyof typeof SHIPMENT_STATUS_LABELS] ?? { en: shipment.status, ar: shipment.status, color: "#8b8b9a" };
  const progress = statusProgress(shipment.status as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl space-y-6 px-4 py-16"
    >
      {/* ── Header card ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="bg-[#7b57fc] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">{isAr ? "رمز التتبع" : "Tracking Code"}</p>
              <p className="font-mono text-xl font-bold">{shipment.trackingCode}</p>
            </div>
            <span
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold"
              style={{ color: "#fff" }}
            >
              {isAr ? statusMeta.ar : statusMeta.en}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* progress bar */}
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: statusMeta.color }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{isAr ? "تم الحجز" : "Booked"}</span>
              <span>{isAr ? "تم التسليم" : "Delivered"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7b57fc]" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "المسار" : "Route"}</p>
                <p className="text-sm font-medium">{shipment.originCountry} → {shipment.destinationCountry}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FreightIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7b57fc]" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "طريقة الشحن" : "Shipping Method"}</p>
                <p className="text-sm font-medium">{shipment.freightType}{shipment.carrierName ? ` · ${shipment.carrierName}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-[#7b57fc]" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "المنتج" : "Product"}</p>
                <p className="text-sm font-medium">{shipment.productDescription}</p>
              </div>
            </div>
          </div>

          {shipment.estimatedDelivery && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {isAr ? "التسليم المتوقع: " : "Estimated delivery: "}
              <b>{format(new Date(shipment.estimatedDelivery), "MMMM d, yyyy")}</b>
            </p>
          )}

          <div className="flex justify-center border-t border-border pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/shipments/barcode/${encodeURIComponent(shipment.trackingCode)}`}
              alt={shipment.trackingCode}
              className="h-16"
            />
          </div>
        </div>
      </div>

      {/* ── Timeline ────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">{isAr ? "سجل الشحنة" : "Shipment History"}</h2>
        {shipment.events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد تحديثات بعد." : "No updates yet."}
          </p>
        ) : (
          <ol className={cn("space-y-4 border-dashed pl-4", isAr ? "border-r-2 pr-4 pl-0" : "border-l-2")}>
            {shipment.events.map((e, i) => {
              const meta = SHIPMENT_STATUS_LABELS[e.status as keyof typeof SHIPMENT_STATUS_LABELS] ?? { en: e.status, ar: e.status, color: "#8b8b9a" };
              return (
                <li key={i} className="relative">
                  <span
                    className={cn("absolute top-1 h-2.5 w-2.5 rounded-full", isAr ? "-right-5.25" : "-left-5.25")}
                    style={{ backgroundColor: meta.color }}
                  />
                  <p className="text-xs font-semibold" style={{ color: meta.color }}>
                    {isAr ? meta.ar : meta.en}
                  </p>
                  <p className="text-sm font-medium">{isAr && e.titleAr ? e.titleAr : e.title}</p>
                  {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                  {(isAr ? e.descriptionAr : e.description) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{isAr ? e.descriptionAr : e.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(new Date(e.occurredAt), "MMM d, yyyy · h:mm a")}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {shipment.images.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{isAr ? "صور المنتج" : "Product Photos"}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {shipment.images.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <Image src={img.url} alt={img.altText ?? shipment.trackingCode} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Link
          href={`/${locale}/track`}
          className="flex items-center gap-1.5 text-sm font-medium text-[#7b57fc] hover:underline"
        >
          <Search className="h-3.5 w-3.5" />
          {isAr ? "تتبع شحنة أخرى" : "Track another shipment"}
        </Link>
      </div>
    </motion.div>
  );
}
