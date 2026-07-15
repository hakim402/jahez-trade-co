// lib/shipping/barcode.ts
//
// Renders a Code128 barcode (PNG buffer) for a shipment's tracking code.
// Used on: the public tracking page, the shipment label, and the invoice PDF.

import bwipjs from "bwip-js";

export async function generateBarcodePng(
  trackingCode: string,
): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: "code128", // barcode type
    text: trackingCode,
    scale: 3, // 3x scaling factor
    height: 14, // bar height, mm
    includetext: true, // human-readable text under the bars
    textxalign: "center",
    backgroundcolor: "FFFFFF",
  });
}

/** Returns a data: URI so it can be dropped directly into <img src=""> or a PDF. */
export async function generateBarcodeDataUri(
  trackingCode: string,
): Promise<string> {
  const buffer = await generateBarcodePng(trackingCode);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
