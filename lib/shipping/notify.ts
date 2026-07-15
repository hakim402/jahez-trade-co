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
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: "Shipment Update",
      message: `Your shipment ${params.trackingCode} is now: ${statusLabel(
        params.status,
        "en",
      )}.`,
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
      title: "Invoice Ready",
      message: `Invoice ${params.invoiceNumber} (${params.totalAmount}) has been issued.`,
      type: "INVOICE_READY",
      invoiceId: params.invoiceId,
      metadata: { invoiceNumber: params.invoiceNumber },
    },
  });
}
