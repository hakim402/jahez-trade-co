// lib/shipping/notify.ts
//
// Creates in-system Notification rows for shipment/invoice events.
// Only fires for registered users — guest clients have no in-system inbox,
// they're reached via email/WhatsApp instead.

import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import { statusLabel } from "./status-map";

export async function notifyShipmentStatusChange(params: {
  shipmentId: string;
  userId: string | null;
  trackingCode: string;
  status: ShipmentStatus;
}) {
  if (!params.userId) return;
  const enLabel = statusLabel(params.status, "en");
  const arLabel = statusLabel(params.status, "ar");
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: "Shipment Update / تحديث الشحنة",
      message: `Your shipment ${params.trackingCode} is now: ${enLabel}.\nشحنتك ${params.trackingCode} حالتها الآن: ${arLabel}.`,
      type: "SHIPMENT_STATUS",
      shipmentId: params.shipmentId,
      metadata: { trackingCode: params.trackingCode, status: params.status },
    },
  });
}

export async function notifyInvoiceReady(params: {
  invoiceId: string;
  userId: string | null;
  invoiceNumber: string;
  totalAmount: string;
}) {
  if (!params.userId) return;
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: "Invoice Ready / الفاتورة جاهزة",
      message: `Invoice ${params.invoiceNumber} (${params.totalAmount}) has been issued.\nتم إصدار الفاتورة ${params.invoiceNumber} (${params.totalAmount}).`,
      type: "INVOICE_READY",
      invoiceId: params.invoiceId,
      metadata: { invoiceNumber: params.invoiceNumber },
    },
  });
}
