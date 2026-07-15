"use server"

// app/[locale]/(pages)/track/actions.ts
//
// Public shipment lookup by tracking code / barcode number — no login
// required. Only exposes fields that are safe to show to anyone who has
// the tracking code (no costs, no client contact info, no internal notes).

import { prisma } from "@/lib/prisma"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface PublicShipmentView {
  trackingCode: string
  status: string
  productDescription: string
  originCountry: string
  destinationCountry: string
  freightType: string
  carrierName: string | null
  estimatedDelivery: string | null
  actualDelivery: string | null
  clientDisplayName: string | null
  images: { url: string; altText: string | null }[]
  events: {
    status: string
    title: string
    titleAr: string | null
    description: string | null
    descriptionAr: string | null
    location: string | null
    occurredAt: string
  }[]
}

function maskName(name: string | null | undefined): string | null {
  if (!name) return null
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export async function getPublicShipmentByCode(rawCode: string): Promise<ActionResult<PublicShipmentView>> {
  try {
    const code = rawCode.trim().toUpperCase()
    if (!code) return { success: false, error: "Enter a tracking code" }

    const shipment = await prisma.shipment.findFirst({
      where: { trackingCode: code, isDeleted: false },
      include: {
        client: { select: { fullName: true } },
        guestClient: { select: { fullName: true } },
        images: { orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
        events: { orderBy: { occurredAt: "desc" } },
      },
    })

    if (!shipment) {
      return { success: false, error: "No shipment found for this tracking code. Please check the code and try again." }
    }

    return {
      success: true,
      data: {
        trackingCode: shipment.trackingCode,
        status: shipment.status,
        productDescription: shipment.productDescription,
        originCountry: shipment.originCountry,
        destinationCountry: shipment.destinationCountry,
        freightType: shipment.freightType,
        carrierName: shipment.carrierName,
        estimatedDelivery: shipment.estimatedDelivery?.toISOString() ?? null,
        actualDelivery: shipment.actualDelivery?.toISOString() ?? null,
        clientDisplayName: maskName(shipment.client?.fullName ?? shipment.guestClient?.fullName),
        images: shipment.images,
        events: shipment.events.map((e) => ({
          status: e.status,
          title: e.title,
          titleAr: e.titleAr,
          description: e.description,
          descriptionAr: e.descriptionAr,
          location: e.location,
          occurredAt: e.occurredAt.toISOString(),
        })),
      },
    }
  } catch (err) {
    console.error("[getPublicShipmentByCode]", err)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
