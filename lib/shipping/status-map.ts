// lib/shipping/status-map.ts
//
// Bilingual, human-readable labels + colors for ShipmentStatus, shared by
// the admin panel, the client dashboard, and the public tracking page.

import type { ShipmentStatus } from "@prisma/client";

export const SHIPMENT_STATUS_LABELS: Record<
  ShipmentStatus,
  { en: string; ar: string; color: string }
> = {
  BOOKED: { en: "Booked", ar: "تم الحجز", color: "#8b8b9a" },
  PICKED_UP: { en: "Picked Up", ar: "تم الاستلام", color: "#5b8def" },
  IN_TRANSIT: { en: "In Transit", ar: "قيد الشحن", color: "#7b57fc" },
  ARRIVED_ORIGIN_PORT: {
    en: "Arrived at Origin Port",
    ar: "وصلت لميناء المنشأ",
    color: "#7b57fc",
  },
  CUSTOMS_ORIGIN: {
    en: "Customs Clearance (Origin)",
    ar: "التخليص الجمركي (المنشأ)",
    color: "#e2a03f",
  },
  DEPARTED: { en: "Departed", ar: "تم المغادرة", color: "#5b8def" },
  ARRIVED_DESTINATION: {
    en: "Arrived at Destination",
    ar: "وصلت للوجهة",
    color: "#5b8def",
  },
  CUSTOMS_DESTINATION: {
    en: "Customs Clearance (Destination)",
    ar: "التخليص الجمركي (الوجهة)",
    color: "#e2a03f",
  },
  OUT_FOR_DELIVERY: {
    en: "Out for Delivery",
    ar: "خارج للتسليم",
    color: "#22b07d",
  },
  DELIVERED: { en: "Delivered", ar: "تم التسليم", color: "#1fa971" },
  DELAYED: { en: "Delayed", ar: "متأخر", color: "#e2a03f" },
  EXCEPTION: { en: "Exception", ar: "مشكلة في الشحنة", color: "#e15c5c" },
  CANCELED: { en: "Canceled", ar: "ملغى", color: "#8b8b9a" },
  RETURNED: { en: "Returned", ar: "تم الإرجاع", color: "#e15c5c" },
};

export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  "BOOKED",
  "PICKED_UP",
  "ARRIVED_ORIGIN_PORT",
  "CUSTOMS_ORIGIN",
  "DEPARTED",
  "IN_TRANSIT",
  "ARRIVED_DESTINATION",
  "CUSTOMS_DESTINATION",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as ShipmentStatus[];

export function statusLabel(status: ShipmentStatus, locale: "en" | "ar" = "en") {
  return SHIPMENT_STATUS_LABELS[status]?.[locale] ?? status;
}

export function statusColor(status: ShipmentStatus) {
  return SHIPMENT_STATUS_LABELS[status]?.color ?? "#8b8b9a";
}

/** Rough overall progress (0-100) for a progress bar, based on status order. */
export function statusProgress(status: ShipmentStatus): number {
  if (status === "DELIVERED") return 100;
  if (status === "CANCELED" || status === "RETURNED") return 100;
  const idx = SHIPMENT_STATUS_ORDER.indexOf(status);
  if (idx === -1) return 50; // DELAYED / EXCEPTION — indeterminate, shown separately
  return Math.round(((idx + 1) / SHIPMENT_STATUS_ORDER.length) * 100);
}
