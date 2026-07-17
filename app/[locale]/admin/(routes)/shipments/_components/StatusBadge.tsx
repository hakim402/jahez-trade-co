// app/[locale]/admin/(routes)/shipments/_components/StatusBadge.tsx
"use client";

import { cn } from "@/lib/utils";
import type { ShipmentStatusValue } from "./types";

export const STATUS_LABELS: Record<ShipmentStatusValue, string> = {
  BOOKED: "Booked",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  ARRIVED_ORIGIN_PORT: "Arrived Origin Port",
  CUSTOMS_ORIGIN: "Customs (Origin)",
  DEPARTED: "Departed",
  ARRIVED_DESTINATION: "Arrived Destination",
  CUSTOMS_DESTINATION: "Customs (Destination)",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  DELAYED: "Delayed",
  EXCEPTION: "Exception",
  CANCELED: "Canceled",
  RETURNED: "Returned",
};

export const STATUS_COLORS: Record<ShipmentStatusValue, string> = {
  BOOKED: "bg-slate-100 text-slate-700 border-slate-200",
  PICKED_UP: "bg-blue-50 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/20",
  ARRIVED_ORIGIN_PORT: "bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/20",
  CUSTOMS_ORIGIN: "bg-amber-50 text-amber-700 border-amber-200",
  DEPARTED: "bg-blue-50 text-blue-700 border-blue-200",
  ARRIVED_DESTINATION: "bg-blue-50 text-blue-700 border-blue-200",
  CUSTOMS_DESTINATION: "bg-amber-50 text-amber-700 border-amber-200",
  OUT_FOR_DELIVERY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DELAYED: "bg-amber-50 text-amber-700 border-amber-200",
  EXCEPTION: "bg-red-50 text-red-700 border-red-200",
  CANCELED: "bg-slate-100 text-slate-500 border-slate-200",
  RETURNED: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status, className }: { status: ShipmentStatusValue; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const ALL_STATUSES = Object.keys(STATUS_LABELS) as ShipmentStatusValue[];
