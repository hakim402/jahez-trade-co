// app/[locale]/dashboard/(routes)/shipments/_components/MyShipmentsClient.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Package, Ship, Plane, Truck, Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SHIPMENT_STATUS_LABELS } from "@/lib/shipping/status-map";
import type { MyShipmentRow } from "../actions";

const FREIGHT_ICONS: Record<string, any> = { SEA: Ship, AIR: Plane, LAND: Truck, EXPRESS: Zap };

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
            const meta = SHIPMENT_STATUS_LABELS[s.status as keyof typeof SHIPMENT_STATUS_LABELS] ?? { en: s.status, ar: s.status, color: "#8b8b9a" };
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
