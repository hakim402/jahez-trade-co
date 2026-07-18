"use server"

// app/[locale]/admin/(routes)/shipments/actions.ts
//
// Admin actions for the shipping & real-time tracking system:
//  - find/register clients (registered users OR guest clients without an account)
//  - create/update/delete shipments
//  - manual tracking milestones + 17TRACK API sync
//  - shipment image uploads

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma, ShipmentStatus, TrackingSource, FreightType } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { generateTrackingCode } from "@/lib/shipping/codes"
import {
  registerTrackingNumbers,
  stopTrackingNumbers,
  getTrackingInfo,
  mapTrack17Status,
} from "@/lib/shipping/17track"
import { notifyShipmentStatusChange } from "@/lib/shipping/notify"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const IMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "shipments")
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// ─────────────────────────────────────────────────────────────────────────────
// Local audit helper (mirrors the pattern used across other admin actions)
// ─────────────────────────────────────────────────────────────────────────────

async function logAdminAction(opts: {
  action: string
  entity: string
  entityId?: string
  changes?: Prisma.InputJsonValue
}) {
  try {
    const adminId = await requireAdmin()
    await prisma.auditLog.create({
      data: { adminId, ...opts, changes: opts.changes ?? Prisma.JsonNull },
    })
  } catch {
    /* non-fatal */
  }
}

function revalidateShipments(id?: string) {
  revalidatePath("/admin/shipments")
  if (id) revalidatePath(`/admin/shipments/${id}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Serializers
// ─────────────────────────────────────────────────────────────────────────────

function num(v: any): number | null {
  if (v === null || v === undefined) return null
  return Number(v)
}

function iso(v: any): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : v
}

export async function serializeShipment(s: any): Promise<any> {
  return {
    id: s.id,
    trackingCode: s.trackingCode,
    ...s,
    weightKg: num(s.weightKg),
    volumeCbm: num(s.volumeCbm),
    productCost: num(s.productCost) ?? 0,
    shippingCost: num(s.shippingCost) ?? 0,
    customsFees: num(s.customsFees) ?? 0,
    otherFees: num(s.otherFees) ?? 0,
    estimatedDelivery: iso(s.estimatedDelivery),
    actualDelivery: iso(s.actualDelivery),
    lastSyncedAt: iso(s.lastSyncedAt),
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.updatedAt),
    client: s.client ?? null,
    guestClient: s.guestClient
      ? { ...s.guestClient, createdAt: iso(s.guestClient.createdAt), updatedAt: iso(s.guestClient.updatedAt) }
      : null,
    images: (s.images ?? []).map((img: any) => ({ ...img, createdAt: iso(img.createdAt) })),
    events: (s.events ?? []).map((e: any) => ({ ...e, occurredAt: iso(e.occurredAt), createdAt: iso(e.createdAt) })),
    invoices: (s.invoices ?? []).map((inv: any) => ({
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
      items: (inv.items ?? []).map((it: any) => ({
        ...it,
        unitPrice: num(it.unitPrice),
        lineTotal: num(it.lineTotal),
      })),
    })),
  }
}

const SHIPMENT_LIST_INCLUDE = {
  client: { select: { id: true, fullName: true, email: true, phone: true } },
  guestClient: { select: { id: true, fullName: true, email: true, phone: true, whatsappPhone: true, company: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ShipmentInclude

const SHIPMENT_DETAIL_INCLUDE = {
  ...SHIPMENT_LIST_INCLUDE,
  events: { orderBy: { occurredAt: "desc" as const } },
  invoices: { orderBy: { createdAt: "desc" as const }, include: { items: true } },
  request: { select: { id: true, description: true } },
  quote: { select: { id: true, price: true, currency: true } },
} satisfies Prisma.ShipmentInclude

// ─────────────────────────────────────────────────────────────────────────────
// Client search / registration (registered users + guest clients)
// ─────────────────────────────────────────────────────────────────────────────

export async function searchClients(query: string): Promise<
  ActionResult<Array<{ id: string; fullName: string | null; email: string; phone: string | null; kind: "user" }>>
> {
  try {
    await requireAdmin()
    if (!query || query.trim().length < 2) return { success: true, data: [] }
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        role: "CLIENT",
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, fullName: true, email: true, phone: true },
      take: 10,
    })
    return { success: true, data: users.map((u) => ({ ...u, kind: "user" as const })) }
  } catch (err) {
    console.error("[searchClients]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to search clients" }
  }
}

export async function searchGuestClients(query: string): Promise<
  ActionResult<Array<{ id: string; fullName: string; email: string | null; phone: string | null; kind: "guest" }>>
> {
  try {
    await requireAdmin()
    if (!query || query.trim().length < 2) return { success: true, data: [] }
    const guests = await prisma.guestClient.findMany({
      where: {
        isDeleted: false,
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, fullName: true, email: true, phone: true },
      take: 10,
    })
    return { success: true, data: guests.map((g) => ({ ...g, kind: "guest" as const })) }
  } catch (err) {
    console.error("[searchGuestClients]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to search guest clients" }
  }
}

const guestClientSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsappPhone: z.string().max(40).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type GuestClientInput = z.infer<typeof guestClientSchema>

/** Admin registers a client who has no platform account. */
export async function createGuestClient(input: GuestClientInput): Promise<ActionResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = guestClientSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }

    const created = await prisma.guestClient.create({
      data: {
        fullName: parsed.data.fullName.trim(),
        email: parsed.data.email?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        whatsappPhone: parsed.data.whatsappPhone?.trim() || null,
        company: parsed.data.company?.trim() || null,
        country: parsed.data.country?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
        createdById: adminId,
      },
    })

    await logAdminAction({ action: "CREATE_GUEST_CLIENT", entity: "GuestClient", entityId: created.id, changes: parsed.data })
    revalidatePath("/admin/shipments")
    return { success: true, data: { id: created.id } }
  } catch (err) {
    console.error("[createGuestClient]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to register client" }
  }
}

export async function updateGuestClient(id: string, input: GuestClientInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const parsed = guestClientSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }

    await prisma.guestClient.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName.trim(),
        email: parsed.data.email?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        whatsappPhone: parsed.data.whatsappPhone?.trim() || null,
        company: parsed.data.company?.trim() || null,
        country: parsed.data.country?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
      },
    })
    await logAdminAction({ action: "UPDATE_GUEST_CLIENT", entity: "GuestClient", entityId: id, changes: parsed.data })
    revalidatePath("/admin/shipments")
    return { success: true, data: { id } }
  } catch (err) {
    console.error("[updateGuestClient]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update client" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipment CRUD
// ─────────────────────────────────────────────────────────────────────────────

const shipmentSchema = z.object({
  clientId: z.string().optional().nullable(),
  guestClientId: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),

  productDescription: z.string().min(2).max(4000),
  productLink: z.string().max(2000).optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),

  originCountry: z.string().min(2).max(100),
  destinationCountry: z.string().min(2).max(100),
  freightType: z.nativeEnum(FreightType).default("SEA"),
  carrierName: z.string().max(200).optional().nullable(),

  carrierTrackingNumber: z.string().max(200).optional().nullable(),
  trackingSource: z.nativeEnum(TrackingSource).default("MANUAL"),
  autoSyncEnabled: z.boolean().default(true),

  weightKg: z.number().nonnegative().optional().nullable(),
  volumeCbm: z.number().nonnegative().optional().nullable(),

  productCost: z.number().nonnegative().default(0),
  shippingCost: z.number().nonnegative().default(0),
  customsFees: z.number().nonnegative().default(0),
  otherFees: z.number().nonnegative().default(0),
  currency: z.string().default("USD"),

  estimatedDelivery: z.string().optional().nullable(),
})

export type ShipmentInput = z.infer<typeof shipmentSchema>

export async function createShipment(input: ShipmentInput): Promise<ActionResult<{ id: string; trackingCode: string }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = shipmentSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    const d = parsed.data

    if (!d.clientId && !d.guestClientId) {
      return { success: false, error: "A registered client or a guest client must be selected" }
    }

    const trackingCode = await generateTrackingCode()

    const shipment = await prisma.shipment.create({
      data: {
        trackingCode,
        clientId: d.clientId || null,
        guestClientId: d.guestClientId || null,
        requestId: d.requestId || null,
        quoteId: d.quoteId || null,
        productDescription: d.productDescription.trim(),
        productLink: d.productLink?.trim() || null,
        quantity: d.quantity ?? 1,
        originCountry: d.originCountry.trim(),
        destinationCountry: d.destinationCountry.trim(),
        freightType: d.freightType,
        carrierName: d.carrierName?.trim() || null,
        carrierTrackingNumber: d.carrierTrackingNumber?.trim() || null,
        trackingSource: d.trackingSource,
        autoSyncEnabled: d.autoSyncEnabled,
        weightKg: d.weightKg ?? null,
        volumeCbm: d.volumeCbm ?? null,
        productCost: d.productCost,
        shippingCost: d.shippingCost,
        customsFees: d.customsFees,
        otherFees: d.otherFees,
        currency: d.currency,
        estimatedDelivery: d.estimatedDelivery ? new Date(d.estimatedDelivery) : null,
        status: "BOOKED",
        createdById: adminId,
        events: {
          create: {
            status: "BOOKED",
            title: "Shipment booked",
            titleAr: "تم تسجيل الشحنة",
            source: "SYSTEM",
            occurredAt: new Date(),
          },
        },
      },
    })

    // If tracking via API and a carrier tracking number was provided, register it now.
    if (d.trackingSource === "API_17TRACK" && d.carrierTrackingNumber && d.autoSyncEnabled) {
      try {
        await registerTrackingNumbers([{ number: d.carrierTrackingNumber.trim() }])
      } catch (err: any) {
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: { lastSyncError: err?.message ?? "Failed to register with 17TRACK" },
        })
      }
    }

    await logAdminAction({ action: "CREATE_SHIPMENT", entity: "Shipment", entityId: shipment.id, changes: { trackingCode } })
    revalidateShipments()
    return { success: true, data: { id: shipment.id, trackingCode } }
  } catch (err) {
    console.error("[createShipment]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to create shipment" }
  }
}

export async function updateShipment(id: string, input: ShipmentInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const parsed = shipmentSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    const d = parsed.data

    const existing = await prisma.shipment.findUnique({ where: { id }, select: { carrierTrackingNumber: true, trackingSource: true } })
    if (!existing) return { success: false, error: "Shipment not found" }

    await prisma.shipment.update({
      where: { id },
      data: {
        clientId: d.clientId || null,
        guestClientId: d.guestClientId || null,
        requestId: d.requestId || null,
        quoteId: d.quoteId || null,
        productDescription: d.productDescription.trim(),
        productLink: d.productLink?.trim() || null,
        quantity: d.quantity ?? 1,
        originCountry: d.originCountry.trim(),
        destinationCountry: d.destinationCountry.trim(),
        freightType: d.freightType,
        carrierName: d.carrierName?.trim() || null,
        carrierTrackingNumber: d.carrierTrackingNumber?.trim() || null,
        trackingSource: d.trackingSource,
        autoSyncEnabled: d.autoSyncEnabled,
        weightKg: d.weightKg ?? null,
        volumeCbm: d.volumeCbm ?? null,
        productCost: d.productCost,
        shippingCost: d.shippingCost,
        customsFees: d.customsFees,
        otherFees: d.otherFees,
        currency: d.currency,
        estimatedDelivery: d.estimatedDelivery ? new Date(d.estimatedDelivery) : null,
      },
    })

    // Re-register with 17TRACK if the carrier tracking number changed.
    const numberChanged = d.carrierTrackingNumber && d.carrierTrackingNumber !== existing.carrierTrackingNumber
    if (d.trackingSource === "API_17TRACK" && d.carrierTrackingNumber && d.autoSyncEnabled && numberChanged) {
      try {
        await registerTrackingNumbers([{ number: d.carrierTrackingNumber.trim() }])
      } catch (err: any) {
        await prisma.shipment.update({ where: { id }, data: { lastSyncError: err?.message ?? "Failed to register with 17TRACK" } })
      }
    }

    await logAdminAction({ action: "UPDATE_SHIPMENT", entity: "Shipment", entityId: id, changes: d as unknown as Prisma.InputJsonValue })
    revalidateShipments(id)
    return { success: true, data: { id } }
  } catch (err) {
    console.error("[updateShipment]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update shipment" }
  }
}

export async function softDeleteShipment(id: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const shipment = await prisma.shipment.findUnique({ where: { id }, select: { carrierTrackingNumber: true } })
    await prisma.shipment.update({ where: { id }, data: { isDeleted: true } })
    if (shipment?.carrierTrackingNumber) {
      try {
        await stopTrackingNumbers([{ number: shipment.carrierTrackingNumber }])
      } catch {
        /* non-fatal */
      }
    }
    await logAdminAction({ action: "DELETE_SHIPMENT", entity: "Shipment", entityId: id })
    revalidateShipments()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[softDeleteShipment]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete shipment" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

export interface ShipmentFilters {
  search?: string
  status?: ShipmentStatus | "ALL"
  page?: number
  pageSize?: number
}

export interface ShipmentPagination {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export async function getShipments(
  params: ShipmentFilters = {},
): Promise<ActionResult<{ shipments: any[]; pagination: ShipmentPagination }>> {
  try {
    await requireAdmin()
    const page = Math.max(1, params.page ?? 1)
    const pageSize = params.pageSize ?? 20

    const where: Prisma.ShipmentWhereInput = {
      isDeleted: false,
      ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { trackingCode: { contains: params.search, mode: "insensitive" } },
              { carrierTrackingNumber: { contains: params.search, mode: "insensitive" } },
              { productDescription: { contains: params.search, mode: "insensitive" } },
              { client: { fullName: { contains: params.search, mode: "insensitive" } } },
              { client: { email: { contains: params.search, mode: "insensitive" } } },
              { guestClient: { fullName: { contains: params.search, mode: "insensitive" } } },
              { guestClient: { email: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    }

    const [shipments, totalCount] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: SHIPMENT_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.shipment.count({ where }),
    ])

    return {
      success: true,
      data: {
        shipments: await Promise.all(shipments.map(serializeShipment)),
        pagination: { page, pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / pageSize)) },
      },
    }
  } catch (err) {
    console.error("[getShipments]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to load shipments" }
  }
}

export async function getShipmentById(id: string): Promise<ActionResult<any>> {
  try {
    await requireAdmin()
    const shipment = await prisma.shipment.findUnique({ where: { id }, include: SHIPMENT_DETAIL_INCLUDE })
    if (!shipment) return { success: false, error: "Shipment not found" }
    return { success: true, data: await serializeShipment(shipment) }
  } catch (err) {
    console.error("[getShipmentById]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to load shipment" }
  }
}

export async function getShipmentStats(): Promise<
  ActionResult<{ total: number; inTransit: number; delivered: number; delayed: number }>
> {
  try {
    await requireAdmin()
    const [total, inTransit, delivered, delayed] = await Promise.all([
      prisma.shipment.count({ where: { isDeleted: false } }),
      prisma.shipment.count({
        where: { isDeleted: false, status: { in: ["IN_TRANSIT", "PICKED_UP", "DEPARTED", "ARRIVED_ORIGIN_PORT", "CUSTOMS_ORIGIN", "ARRIVED_DESTINATION", "CUSTOMS_DESTINATION", "OUT_FOR_DELIVERY"] } },
      }),
      prisma.shipment.count({ where: { isDeleted: false, status: "DELIVERED" } }),
      prisma.shipment.count({ where: { isDeleted: false, status: { in: ["DELAYED", "EXCEPTION"] } } }),
    ])
    return { success: true, data: { total, inTransit, delivered, delayed } }
  } catch (err) {
    console.error("[getShipmentStats]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to load stats" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual tracking milestones
// ─────────────────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  title: z.string().min(2).max(300),
  titleAr: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  descriptionAr: z.string().max(2000).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  occurredAt: z.string().optional().nullable(), // ISO string; defaults to now
})

export type ShipmentEventInput = z.infer<typeof eventSchema>

export async function addManualShipmentEvent(
  shipmentId: string,
  input: ShipmentEventInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = eventSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    const d = parsed.data

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { clientId: true, trackingCode: true } })
    if (!shipment) return { success: false, error: "Shipment not found" }

    const occurredAt = d.occurredAt ? new Date(d.occurredAt) : new Date()

    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status: d.status,
        title: d.title.trim(),
        titleAr: d.titleAr?.trim() || null,
        description: d.description?.trim() || null,
        descriptionAr: d.descriptionAr?.trim() || null,
        location: d.location?.trim() || null,
        occurredAt,
        source: "MANUAL",
        createdById: adminId,
      },
    })

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: d.status,
        ...(d.status === "DELIVERED" ? { actualDelivery: occurredAt } : {}),
      },
    })

    await notifyShipmentStatusChange({
      shipmentId,
      userId: shipment.clientId,
      trackingCode: shipment.trackingCode,
      status: d.status,
    })

    await logAdminAction({ action: "ADD_SHIPMENT_EVENT", entity: "Shipment", entityId: shipmentId, changes: d as unknown as Prisma.InputJsonValue })
    revalidateShipments(shipmentId)
    return { success: true, data: { id: event.id } }
  } catch (err) {
    console.error("[addManualShipmentEvent]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to add tracking update" }
  }
}

export async function deleteShipmentEvent(shipmentId: string, eventId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    await prisma.shipmentEvent.delete({ where: { id: eventId } })
    await logAdminAction({ action: "DELETE_SHIPMENT_EVENT", entity: "Shipment", entityId: shipmentId })
    revalidateShipments(shipmentId)
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteShipmentEvent]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete event" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 17TRACK sync ("Sync now" button + can be called from a cron endpoint)
// ─────────────────────────────────────────────────────────────────────────────

export async function syncShipmentTracking(shipmentId: string): Promise<ActionResult<{ status: ShipmentStatus; newEvents: number }>> {
  try {
    await requireAdmin()
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } })
    if (!shipment) return { success: false, error: "Shipment not found" }
    if (shipment.trackingSource !== "API_17TRACK" || !shipment.carrierTrackingNumber) {
      return { success: false, error: "This shipment is not configured for API tracking" }
    }

    const results = await getTrackingInfo([{ number: shipment.carrierTrackingNumber }])
    const result = results[0]
    if (!result) {
      await prisma.shipment.update({ where: { id: shipmentId }, data: { lastSyncedAt: new Date(), lastSyncError: "No data returned yet from carrier" } })
      return { success: true, data: { status: shipment.status, newEvents: 0 } }
    }

    const mappedStatus = mapTrack17Status(result.status)
    const knownEvents = await prisma.shipmentEvent.findMany({ where: { shipmentId, source: "API" }, select: { occurredAt: true } })
    const knownTimes = new Set(knownEvents.map((e) => e.occurredAt.getTime()))

    let newEvents = 0
    for (const evt of result.events) {
      const occurredAt = new Date(evt.time)
      if (Number.isNaN(occurredAt.getTime()) || knownTimes.has(occurredAt.getTime())) continue
      await prisma.shipmentEvent.create({
        data: {
          shipmentId,
          status: mappedStatus,
          title: evt.description,
          location: evt.location ?? null,
          occurredAt,
          source: "API",
          rawPayload: evt as unknown as Prisma.InputJsonValue,
        },
      })
      newEvents++
    }

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: mappedStatus,
        lastSyncedAt: new Date(),
        lastSyncError: null,
        ...(mappedStatus === "DELIVERED" ? { actualDelivery: new Date() } : {}),
      },
    })

    if (newEvents > 0) {
      await notifyShipmentStatusChange({
        shipmentId,
        userId: shipment.clientId,
        trackingCode: shipment.trackingCode,
        status: mappedStatus,
      })
    }

    revalidateShipments(shipmentId)
    return { success: true, data: { status: mappedStatus, newEvents } }
  } catch (err: any) {
    console.error("[syncShipmentTracking]", err)
    await prisma.shipment.update({ where: { id: shipmentId }, data: { lastSyncError: err?.message ?? "Sync failed" } }).catch(() => {})
    return { success: false, error: err?.message ?? "Failed to sync tracking" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipment images
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadShipmentImage(
  shipmentId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requireAdmin()
    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { success: false, error: "Only JPEG, PNG, WebP or GIF allowed" }
    if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "Image must be under 10 MB" }

    if (!existsSync(IMAGE_UPLOAD_DIR)) await mkdir(IMAGE_UPLOAD_DIR, { recursive: true })

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${shipmentId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(path.join(IMAGE_UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))

    const url = `/uploads/shipments/${filename}`
    const count = await prisma.shipmentImage.count({ where: { shipmentId } })
    const image = await prisma.shipmentImage.create({
      data: { shipmentId, url, isPrimary: count === 0, sortOrder: count },
    })

    revalidateShipments(shipmentId)
    return { success: true, data: { id: image.id, url } }
  } catch (err) {
    console.error("[uploadShipmentImage]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to upload image" }
  }
}

export async function deleteShipmentImage(shipmentId: string, imageId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    await prisma.shipmentImage.delete({ where: { id: imageId } })
    revalidateShipments(shipmentId)
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteShipmentImage]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete image" }
  }
}
