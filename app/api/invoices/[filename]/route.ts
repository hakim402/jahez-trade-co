// app/api/invoices/[filename]/route.ts
//
// Serves invoice PDFs reliably — works in both dev and production.
// The middleware bypasses /api/* paths, so this always works.

import { NextRequest, NextResponse } from "next/server"
import { readFile, access } from "fs/promises"
import path from "path"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Sanitize filename — only allow .pdf, block path traversal
  if (!filename.endsWith(".pdf") || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Invalid filename", { status: 400 })
  }

  const invoiceDir = path.join(process.cwd(), "public", "uploads", "invoices")
  const filePath = path.join(invoiceDir, filename)

  try {
    await access(filePath)
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return new NextResponse("Invoice PDF not found", { status: 404 })
  }
}
