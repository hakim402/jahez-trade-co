"use server"

// app/[locale]/admin/(routes)/shipments/invoice-actions.ts
//
// Invoice generation + delivery:
//  - admin fills in line items → PDF generated → emailed automatically
//  - admin can also manually trigger a WhatsApp send with the same summary

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { generateInvoiceNumber } from "@/lib/shipping/codes"
import { generateInvoicePdf } from "@/lib/shipping/invoice-pdf"
import { sendInvoiceEmail } from "@/lib/shipping/invoice-email"
import { sendWhatsApp, whatsAppTemplates } from "@/lib/whatsapp"
import { notifyInvoiceReady } from "@/lib/shipping/notify"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const INVOICE_DIR = path.join(process.cwd(), "public", "uploads", "invoices")

async function logAdminAction(opts: { action: string; entity: string; entityId?: string; changes?: Prisma.InputJsonValue }) {
  try {
    const adminId = await requireAdmin()
    await prisma.auditLog.create({ data: { adminId, ...opts, changes: opts.changes ?? Prisma.JsonNull } })
  } catch {
    /* non-fatal */
  }
}

function num(v: any): number | null {
  if (v === null || v === undefined) return null
  return Number(v)
}
function iso(v: any): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : v
}

function serializeInvoice(inv: any) {
  return {
    ...inv,
    subtotal: num(inv.subtotal),
    taxAmount: num(inv.taxAmount),
    discount: num(inv.discount),
    totalAmount: num(inv.totalAmount),
    dueDate: iso(inv.dueDate),
    paidAt: iso(inv.paidAt),
    emailSentAt: iso(inv.emailSentAt),
    whatsappSentAt: iso(inv.whatsappSentAt),
    createdAt: iso(inv.createdAt),
    updatedAt: iso(inv.updatedAt),
    items: (inv.items ?? []).map((it: any) => ({ ...it, unitPrice: num(it.unitPrice), lineTotal: num(it.lineTotal) })),
  }
}

const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
})

const createInvoiceSchema = z.object({
  shipmentId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  guestClientId: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1),
  taxAmount: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  currency: z.string().default("USD"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  sendEmailNow: z.boolean().default(true),
  lang: z.enum(["en", "ar"]).default("en"),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

async function resolveRecipient(params: { clientId?: string | null; guestClientId?: string | null; shipmentId?: string | null }) {
  let clientId = params.clientId ?? null
  let guestClientId = params.guestClientId ?? null

  // If neither is given but a shipment is, pull it from the shipment.
  if (!clientId && !guestClientId && params.shipmentId) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
      select: { clientId: true, guestClientId: true, trackingCode: true },
    })
    clientId = shipment?.clientId ?? null
    guestClientId = shipment?.guestClientId ?? null
  }

  if (clientId) {
    const user = await prisma.user.findUnique({ where: { id: clientId }, select: { id: true, fullName: true, email: true, phone: true } })
    return { kind: "user" as const, id: user?.id ?? null, name: user?.fullName ?? "Client", email: user?.email ?? null, phone: user?.phone ?? null }
  }
  if (guestClientId) {
    const guest = await prisma.guestClient.findUnique({
      where: { id: guestClientId },
      select: { id: true, fullName: true, email: true, phone: true, whatsappPhone: true },
    })
    return {
      kind: "guest" as const,
      id: guest?.id ?? null,
      name: guest?.fullName ?? "Client",
      email: guest?.email ?? null,
      phone: guest?.whatsappPhone ?? guest?.phone ?? null,
    }
  }
  return { kind: "none" as const, id: null, name: "Client", email: null, phone: null }
}

export async function createInvoice(input: CreateInvoiceInput): Promise<ActionResult<{ id: string; invoiceNumber: string; emailSent: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = createInvoiceSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    const d = parsed.data

    if (!d.shipmentId && !d.clientId && !d.guestClientId) {
      return { success: false, error: "Select a shipment or a client to bill" }
    }

    const recipient = await resolveRecipient(d)

    const itemsWithTotals = d.items.map((it) => ({ ...it, lineTotal: it.quantity * it.unitPrice }))
    const subtotal = itemsWithTotals.reduce((sum, it) => sum + it.lineTotal, 0)
    const totalAmount = subtotal + d.taxAmount - d.discount

    const invoiceNumber = await generateInvoiceNumber()

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        shipmentId: d.shipmentId || null,
        clientId: recipient.kind === "user" ? recipient.id : null,
        guestClientId: recipient.kind === "guest" ? recipient.id : null,
        requestId: d.requestId || null,
        quoteId: d.quoteId || null,
        subtotal,
        taxAmount: d.taxAmount,
        discount: d.discount,
        totalAmount,
        currency: d.currency,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        notes: d.notes?.trim() || null,
        lang: d.lang,
        status: "SENT",
        createdById: adminId,
        items: {
          create: itemsWithTotals.map((it, idx) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            sortOrder: idx,
          })),
        },
      },
      include: { items: true },
    })

    // Shipment context for the PDF (route/tracking/barcode), if linked.
    const shipment = d.shipmentId
      ? await prisma.shipment.findUnique({
          where: { id: d.shipmentId },
          select: {
            trackingCode: true,
            originCountry: true,
            destinationCountry: true,
            freightType: true,
            carrierName: true,
            carrierTrackingNumber: true,
            status: true,
            images: { orderBy: { sortOrder: "asc" }, select: { url: true, isPrimary: true } },
          },
        })
      : null

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jahez.online"
    const trackingUrl = shipment?.trackingCode ? `${appUrl}/en/track/${shipment.trackingCode}` : null
    const shipmentImages = shipment?.images?.map((img) => img.url) ?? []

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,
      issuedAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      currency: d.currency,
      clientName: recipient.name,
      clientEmail: recipient.email,
      clientPhone: recipient.phone,
      items: itemsWithTotals,
      subtotal,
      taxAmount: d.taxAmount,
      discount: d.discount,
      totalAmount,
      notes: d.notes,
      trackingCode: shipment?.trackingCode,
      originCountry: shipment?.originCountry,
      destinationCountry: shipment?.destinationCountry,
      freightType: shipment?.freightType,
      carrierName: shipment?.carrierName,
      carrierTrackingNumber: shipment?.carrierTrackingNumber,
      shipmentStatus: shipment?.status,
      shipmentImages,
      trackingUrl,
      companyName: "JAHEZ TRADE CO.",
      companyEmail: process.env.GMAIL_USER,
      lang: d.lang,
    })

    if (!existsSync(INVOICE_DIR)) await mkdir(INVOICE_DIR, { recursive: true })
    const pdfFilename = `${invoiceNumber}.pdf`
    await writeFile(path.join(INVOICE_DIR, pdfFilename), pdfBuffer)
    const pdfUrl = `/api/invoices/${pdfFilename}`
    await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl } })

    let emailSent = false
    if (d.sendEmailNow && recipient.email) {
      const trackingUrl = shipment?.trackingCode
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track/${shipment.trackingCode}`
        : null
      const result = await sendInvoiceEmail({
        to: recipient.email,
        clientName: recipient.name,
        invoiceNumber,
        totalAmount: `${totalAmount.toFixed(2)} ${d.currency}`,
        trackingCode: shipment?.trackingCode,
        trackingUrl,
        pdfBuffer,
      })
      if (result.success) {
        emailSent = true
        await prisma.invoice.update({ where: { id: invoice.id }, data: { emailSentAt: new Date() } })
      } else {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { emailError: result.error } })
      }
    }

    if (recipient.kind === "user" && recipient.id) {
      await notifyInvoiceReady({
        invoiceId: invoice.id,
        userId: recipient.id,
        invoiceNumber,
        totalAmount: `${totalAmount.toFixed(2)} ${d.currency}`,
      })
    }

    await logAdminAction({ action: "CREATE_INVOICE", entity: "Invoice", entityId: invoice.id, changes: { invoiceNumber, totalAmount } })
    revalidatePath("/admin/shipments")
    if (d.shipmentId) revalidatePath(`/admin/shipments/${d.shipmentId}`)
    return { success: true, data: { id: invoice.id, invoiceNumber, emailSent } }
  } catch (err) {
    console.error("[createInvoice]", err)
    return { success: false, error: "Failed to create invoice" }
  }
}

export async function resendInvoiceEmail(invoiceId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, guestClient: true, shipment: { select: { trackingCode: true } } },
    })
    if (!invoice) return { success: false, error: "Invoice not found" }

    const email = invoice.client?.email ?? invoice.guestClient?.email
    if (!email) return { success: false, error: "This client has no email on file" }
    if (!invoice.pdfUrl) return { success: false, error: "No PDF found for this invoice" }

    // Derive the disk path from the invoice number (works for both old and new URL formats)
    const pdfFilename = `${invoice.invoiceNumber}.pdf`
    const pdfPath = path.join(INVOICE_DIR, pdfFilename)
    if (!existsSync(pdfPath)) return { success: false, error: "Invoice PDF file is missing on disk" }
    const pdfBuffer = await import("fs/promises").then((fs) => fs.readFile(pdfPath))

    const trackingUrl = invoice.shipment?.trackingCode
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track/${invoice.shipment.trackingCode}`
      : null

    const result = await sendInvoiceEmail({
      to: email,
      clientName: invoice.client?.fullName ?? invoice.guestClient?.fullName ?? "Client",
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: `${Number(invoice.totalAmount).toFixed(2)} ${invoice.currency}`,
      trackingCode: invoice.shipment?.trackingCode,
      trackingUrl,
      pdfBuffer,
    })

    if (!result.success) {
      await prisma.invoice.update({ where: { id: invoiceId }, data: { emailError: result.error } })
      return { success: false, error: result.error }
    }

    await prisma.invoice.update({ where: { id: invoiceId }, data: { emailSentAt: new Date(), emailError: null } })
    await logAdminAction({ action: "RESEND_INVOICE_EMAIL", entity: "Invoice", entityId: invoiceId })
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[resendInvoiceEmail]", err)
    return { success: false, error: "Failed to resend invoice email" }
  }
}

export async function sendInvoiceWhatsApp(invoiceId: string, lang: "ar" | "en" = "ar"): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, guestClient: true, shipment: { select: { trackingCode: true } } },
    })
    if (!invoice) return { success: false, error: "Invoice not found" }

    const phone = invoice.client?.phone ?? invoice.guestClient?.whatsappPhone ?? invoice.guestClient?.phone
    if (!phone) return { success: false, error: "This client has no phone number on file" }

    const name = invoice.client?.fullName ?? invoice.guestClient?.fullName ?? "Client"
    const trackingUrl = invoice.shipment?.trackingCode
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track/${invoice.shipment.trackingCode}`
      : undefined

    const message = whatsAppTemplates.invoiceReady({
      customerName: name,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: `${Number(invoice.totalAmount).toFixed(2)} ${invoice.currency}`,
      trackingCode: invoice.shipment?.trackingCode ?? undefined,
      trackingUrl,
      lang,
    })

    const result = await sendWhatsApp({
      to: phone,
      message,
      templateKey: "invoiceReady",
      userId: invoice.clientId ?? undefined,
    })

    if (!result.success) return { success: false, error: result.error ?? "Failed to send WhatsApp message" }

    await prisma.invoice.update({ where: { id: invoiceId }, data: { whatsappSentAt: new Date() } })
    await logAdminAction({ action: "SEND_INVOICE_WHATSAPP", entity: "Invoice", entityId: invoiceId })
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[sendInvoiceWhatsApp]", err)
    return { success: false, error: "Failed to send WhatsApp message" }
  }
}

export async function getInvoiceById(id: string): Promise<ActionResult<any>> {
  try {
    await requireAdmin()
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, client: true, guestClient: true, shipment: { select: { trackingCode: true } } },
    })
    if (!invoice) return { success: false, error: "Invoice not found" }
    return { success: true, data: serializeInvoice(invoice) }
  } catch (err) {
    console.error("[getInvoiceById]", err)
    return { success: false, error: "Failed to load invoice" }
  }
}

/**
 * Re-generate the invoice PDF (useful when the original file is missing or you want a fresh copy).
 */
export async function regenerateInvoicePdf(invoiceId: string): Promise<ActionResult<{ pdfUrl: string }>> {
  try {
    await requireAdmin()
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        client: true,
        guestClient: true,
        shipment: {
          select: {
            trackingCode: true,
            originCountry: true,
            destinationCountry: true,
            freightType: true,
            carrierName: true,
            carrierTrackingNumber: true,
            status: true,
            images: { orderBy: { sortOrder: "asc" }, select: { url: true, isPrimary: true } },
          },
        },
      },
    })
    if (!invoice) return { success: false, error: "Invoice not found" }

    const recipientName = invoice.client?.fullName ?? invoice.guestClient?.fullName ?? "Client"
    const recipientEmail = invoice.client?.email ?? invoice.guestClient?.email ?? null
    const recipientPhone = invoice.client?.phone ?? invoice.guestClient?.whatsappPhone ?? invoice.guestClient?.phone ?? null

    const items = invoice.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    }))

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jaheztrade.com"
    const trackingUrl = invoice.shipment?.trackingCode ? `${appUrl}/en/track/${invoice.shipment.trackingCode}` : null
    const shipmentImages = invoice.shipment?.images?.map((img) => img.url) ?? []

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      clientName: recipientName,
      clientEmail: recipientEmail,
      clientPhone: recipientPhone,
      items,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      discount: Number(invoice.discount),
      totalAmount: Number(invoice.totalAmount),
      notes: invoice.notes,
      trackingCode: invoice.shipment?.trackingCode,
      originCountry: invoice.shipment?.originCountry,
      destinationCountry: invoice.shipment?.destinationCountry,
      freightType: invoice.shipment?.freightType,
      carrierName: invoice.shipment?.carrierName,
      carrierTrackingNumber: invoice.shipment?.carrierTrackingNumber,
      shipmentStatus: invoice.shipment?.status,
      shipmentImages,
      trackingUrl,
      companyName: "JAHEZ TRADE CO.",
      companyEmail: process.env.GMAIL_USER,
      lang: (invoice.lang === "ar" ? "ar" : "en") as "en" | "ar",
    })

    if (!existsSync(INVOICE_DIR)) await mkdir(INVOICE_DIR, { recursive: true })
    const pdfFilename = `${invoice.invoiceNumber}.pdf`
    await writeFile(path.join(INVOICE_DIR, pdfFilename), pdfBuffer)
    const pdfUrl = `/api/invoices/${pdfFilename}`
    await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl } })

    revalidatePath("/admin/shipments")
    return { success: true, data: { pdfUrl } }
  } catch (err) {
    console.error("[regenerateInvoicePdf]", err)
    return { success: false, error: "Failed to regenerate invoice PDF" }
  }
}
