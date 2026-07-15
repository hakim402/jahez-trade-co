// lib/shipping/invoice-pdf.ts
//
// Renders a branded invoice PDF (Buffer) using pdfkit — pure JS, no native
// deps, safe to run in any Node server environment.

import PDFDocument from "pdfkit";
import { generateBarcodeDataUri } from "./barcode";

const BRAND_PURPLE = "#7b57fc";
const BRAND_DARK = "#1a1a2e";
const BRAND_GRAY = "#6b6b7b";
const BRAND_LIGHT_BG = "#f8f8fb";

export interface InvoicePdfItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: Date;
  dueDate?: Date | null;
  currency: string;

  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientCompany?: string | null;

  items: InvoicePdfItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;

  notes?: string | null;

  // Shipment context (optional — invoice can stand alone)
  trackingCode?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  freightType?: string | null;
  carrierName?: string | null;
  carrierTrackingNumber?: string | null;

  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
}

function money(n: number, currency: string) {
  return `${n.toFixed(2)} ${currency}`;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ── Header band ──────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 110).fill(BRAND_PURPLE);
  doc
    .fillColor("#ffffff")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(data.companyName ?? "JAHEZ Trade Co.", 40, 36);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#e7e0ff")
    .text(
      [data.companyEmail, data.companyPhone].filter(Boolean).join("  •  "),
      40,
      66,
    );

  doc
    .fontSize(26)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("INVOICE", 0, 36, { align: "right", width: pageWidth + 40 });
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#e7e0ff")
    .text(data.invoiceNumber, 0, 68, { align: "right", width: pageWidth + 40 });

  doc.fillColor(BRAND_DARK);
  doc.y = 130;

  // ── Bill-to + meta ───────────────────────────────────────
  const colTop = doc.y;
  doc.fontSize(9).fillColor(BRAND_GRAY).text("BILL TO", 40, colTop);
  doc
    .fontSize(12)
    .fillColor(BRAND_DARK)
    .font("Helvetica-Bold")
    .text(data.clientName, 40, colTop + 14);
  doc.font("Helvetica").fontSize(10).fillColor(BRAND_GRAY);
  let y = colTop + 32;
  if (data.clientCompany) {
    doc.text(data.clientCompany, 40, y);
    y += 14;
  }
  if (data.clientEmail) {
    doc.text(data.clientEmail, 40, y);
    y += 14;
  }
  if (data.clientPhone) {
    doc.text(data.clientPhone, 40, y);
    y += 14;
  }

  const metaX = 340;
  doc.fontSize(9).fillColor(BRAND_GRAY).text("ISSUED", metaX, colTop);
  doc
    .fontSize(10)
    .fillColor(BRAND_DARK)
    .text(data.issuedAt.toLocaleDateString(), metaX, colTop + 14);
  if (data.dueDate) {
    doc.fontSize(9).fillColor(BRAND_GRAY).text("DUE DATE", metaX, colTop + 34);
    doc
      .fontSize(10)
      .fillColor(BRAND_DARK)
      .text(data.dueDate.toLocaleDateString(), metaX, colTop + 48);
  }

  doc.moveDown(3);
  doc.y = Math.max(doc.y, y) + 16;

  // ── Shipment info box (optional) ────────────────────────
  if (data.trackingCode) {
    const boxTop = doc.y;
    doc.rect(40, boxTop, pageWidth, 74).fill(BRAND_LIGHT_BG);
    doc.fillColor(BRAND_GRAY).fontSize(9).text("SHIPMENT", 52, boxTop + 10);
    doc
      .fillColor(BRAND_DARK)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(data.trackingCode, 52, boxTop + 24);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BRAND_GRAY)
      .text(
        [
          data.originCountry && data.destinationCountry
            ? `${data.originCountry} → ${data.destinationCountry}`
            : null,
          data.freightType,
          data.carrierName,
          data.carrierTrackingNumber
            ? `Carrier #: ${data.carrierTrackingNumber}`
            : null,
        ]
          .filter(Boolean)
          .join("   •   "),
        52,
        boxTop + 42,
        { width: pageWidth - 160 },
      );

    try {
      const barcodeUri = await generateBarcodeDataUri(data.trackingCode);
      const base64 = barcodeUri.split(",")[1];
      const buf = Buffer.from(base64, "base64");
      doc.image(buf, 40 + pageWidth - 150, boxTop + 12, { width: 130 });
    } catch {
      // non-fatal — invoice still works without the barcode image
    }

    doc.y = boxTop + 74 + 20;
  }

  // ── Items table ──────────────────────────────────────────
  const tableTop = doc.y;
  const col = { desc: 40, qty: 330, price: 400, total: 480 };
  doc.rect(40, tableTop, pageWidth, 24).fill(BRAND_PURPLE);
  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("DESCRIPTION", col.desc + 10, tableTop + 7)
    .text("QTY", col.qty, tableTop + 7)
    .text("UNIT PRICE", col.price, tableTop + 7)
    .text("TOTAL", col.total, tableTop + 7, { width: 80, align: "right" });

  let rowY = tableTop + 24;
  doc.font("Helvetica").fontSize(10).fillColor(BRAND_DARK);
  data.items.forEach((item, idx) => {
    const rowHeight = 26;
    if (idx % 2 === 1) {
      doc.rect(40, rowY, pageWidth, rowHeight).fill(BRAND_LIGHT_BG);
      doc.fillColor(BRAND_DARK);
    }
    doc
      .text(item.description, col.desc + 10, rowY + 7, { width: 270 })
      .text(String(item.quantity), col.qty, rowY + 7)
      .text(money(item.unitPrice, data.currency), col.price, rowY + 7)
      .text(money(item.lineTotal, data.currency), col.total, rowY + 7, {
        width: 80,
        align: "right",
      });
    rowY += rowHeight;
  });

  doc
    .moveTo(40, rowY)
    .lineTo(40 + pageWidth, rowY)
    .strokeColor("#e5e5ee")
    .stroke();
  rowY += 12;

  // ── Totals ───────────────────────────────────────────────
  const totalsX = 350;
  const printTotalRow = (label: string, value: string, bold = false) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 12 : 10)
      .fillColor(bold ? BRAND_PURPLE : BRAND_GRAY)
      .text(label, totalsX, rowY, { width: 90 })
      .fillColor(bold ? BRAND_PURPLE : BRAND_DARK)
      .text(value, totalsX + 90, rowY, { width: 90, align: "right" });
    rowY += bold ? 22 : 18;
  };

  printTotalRow("Subtotal", money(data.subtotal, data.currency));
  if (data.taxAmount) printTotalRow("Tax", money(data.taxAmount, data.currency));
  if (data.discount) printTotalRow("Discount", `-${money(data.discount, data.currency)}`);
  rowY += 4;
  doc
    .moveTo(totalsX, rowY - 2)
    .lineTo(40 + pageWidth, rowY - 2)
    .strokeColor("#e5e5ee")
    .stroke();
  printTotalRow("TOTAL DUE", money(data.totalAmount, data.currency), true);

  // ── Notes / footer ───────────────────────────────────────
  if (data.notes) {
    doc.moveDown(2);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BRAND_GRAY)
      .text(data.notes, 40, doc.y, { width: pageWidth });
  }

  doc
    .fontSize(8)
    .fillColor(BRAND_GRAY)
    .text(
      "Thank you for your business — generated automatically by the JAHEZ platform.",
      40,
      doc.page.height - 50,
      { width: pageWidth, align: "center" },
    );

  doc.end();
  return done;
}
