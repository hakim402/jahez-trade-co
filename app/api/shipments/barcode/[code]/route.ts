// app/api/shipments/barcode/[code]/route.ts
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
    // Convert Buffer to Uint8Array to satisfy the TypeScript type
    const imageData = Buffer.isBuffer(png) ? new Uint8Array(png) : png
    return new NextResponse(imageData, {
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