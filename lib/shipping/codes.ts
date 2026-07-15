// lib/shipping/codes.ts
//
// Generates the public-facing tracking code (encoded in the barcode + used
// in the public tracking URL) and sequential invoice numbers.

import { prisma } from "@/lib/prisma";

const TRACKING_PREFIX = "JHZ";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Generates a unique, human-readable, barcode-friendly tracking code, e.g. "JHZ-7K3P9Q2A". */
export async function generateTrackingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${TRACKING_PREFIX}-${randomSegment(8)}`;
    const existing = await prisma.shipment.findUnique({
      where: { trackingCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  // Extremely unlikely fallback: timestamp-based
  return `${TRACKING_PREFIX}-${Date.now().toString(36).toUpperCase()}`;
}

/** Generates a sequential, year-scoped invoice number, e.g. "INV-2026-000123". */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const countThisYear = await prisma.invoice.count({
    where: {
      invoiceNumber: { startsWith: `INV-${year}-` },
    },
  });
  const seq = (countThisYear + 1).toString().padStart(6, "0");
  const candidate = `INV-${year}-${seq}`;

  // Guard against a rare race condition producing a duplicate.
  const existing = await prisma.invoice.findUnique({
    where: { invoiceNumber: candidate },
    select: { id: true },
  });
  if (!existing) return candidate;
  return `INV-${year}-${(countThisYear + 1 + Math.floor(Math.random() * 1000)).toString().padStart(6, "0")}`;
}
