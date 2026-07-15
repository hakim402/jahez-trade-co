// app/[locale]/dashboard/(routes)/shipments/_components/MyShipmentsClient.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Package, Ship, Plane, Truck, Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MyShipmentRow } from "../actions";

const FREIGHT_ICONS: Record<string, any> = { SEA: Ship, AIR: Plane, LAND: Truck, EXPRESS: Zap };

const STATUS_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  BOOKED: { en: "Booked", ar: "تم الحجز", color: "#8b8b9a" },
  PICKED_UP: { en: "Picked Up", ar: "تم الاستلام", color: "#5b8def" },
  IN_TRANSIT: { en: "In Transit", ar: "قيد الشحن", color: "#7b57fc" },
  ARRIVED_ORIGIN_PORT: { en: "Arrived Origin Port", ar: "وصلت لميناء المنشأ", color: "#7b57fc" },
  CUSTOMS_ORIGIN: { en: "Customs (Origin)", ar: "التخليص الجمركي (المنشأ)", color: "#e2a03f" },
  DEPARTED: { en: "Departed", ar: "تم المغادرة", color: "#5b8def" },
  ARRIVED_DESTINATION: { en: "Arrived Destination", ar: "وصلت للوجهة", color: "#5b8def" },
  CUSTOMS_DESTINATION: { en: "Customs (Destination)", ar: "التخليص الجمركي (الوجهة)", color: "#e2a03f" },
  OUT_FOR_DELIVERY: { en: "Out for Delivery", ar: "خارج للتسليم", color: "#22b07d" },
  DELIVERED: { en: "Delivered", ar: "تم التسليم", color: "#1fa971" },
  DELAYED: { en: "Delayed", ar: "متأخر", color: "#e2a03f" },
  EXCEPTION: { en: "Exception", ar: "مشكلة", color: "#e15c5c" },
  CANCELED: { en: "Canceled", ar: "ملغى", color: "#8b8b9a" },
  RETURNED: { en: "Returned", ar: "تم الإرجاع", color: "#e15c5c" },
};

export function MyShipmentsClient({
  shipments,
  locale,
  isAr,
}: {
  shipments: MyShipmentRow[];
  locale: string;
  isAr: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isAr ? "شحناتي" : "My Shipments"}</h1>
        <p className="text-sm text-muted-foreground">
          {isAr ? "تابع حالة شحناتك من الصين مباشرة." : "Track the live status of your shipments from China."}
        </p>
      </div>

      {shipments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد شحنات مسجلة بعد." : "No shipments yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shipments.map((s) => {
            const meta = STATUS_LABELS[s.status] ?? { en: s.status, ar: s.status, color: "#8b8b9a" };
            const FreightIcon = FREIGHT_ICONS[s.freightType] ?? Package;
            return (
              <Link key={s.id} href={`/${locale}/track/${s.trackingCode}`}>
                <Card className="group h-full space-y-3 p-5 transition hover:border-[#7b57fc]/40 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-[#7b57fc]">{s.trackingCode}</span>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                    >
                      {isAr ? meta.ar : meta.en}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground">{s.productDescription}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FreightIcon className="h-3.5 w-3.5" />
                    {s.originCountry} → {s.destinationCountry}
                  </div>
                  {s.estimatedDelivery && (
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "التسليم المتوقع: " : "Est. delivery: "}
                      {format(new Date(s.estimatedDelivery), "MMM d, yyyy")}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs font-medium text-[#7b57fc] opacity-0 transition group-hover:opacity-100">
                    {isAr ? "عرض التفاصيل" : "View details"} <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
