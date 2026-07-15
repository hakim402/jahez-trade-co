// app/api/shipments/barcode/[code]/route.ts
//
// Serves a Code128 barcode PNG for a given tracking code, so the public
// tracking page (and printable labels) can just use <img src="/api/...">.
// Only renders codes that correspond to a real, non-deleted shipment.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateBarcodePng } from "@/lib/shipping/barcode"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const trackingCode = code.trim().toUpperCase()

  const exists = await prisma.shipment.findFirst({
    where: { trackingCode, isDeleted: false },
    select: { id: true },
  })
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const png = await generateBarcodePng(trackingCode)
    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[barcode route]", err)
    return NextResponse.json({ error: "Failed to generate barcode" }, { status: 500 })
  }
}
