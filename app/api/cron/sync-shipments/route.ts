// app/api/cron/sync-shipments/route.ts
//
// Batch-syncs every active API-tracked shipment against 17TRACK. Webhooks
// handle real-time pushes, but carriers occasionally miss a push — this
// endpoint is a safety net you can hit on a schedule (e.g. Vercel Cron,
// GitHub Actions, or any external cron service) every 30-60 minutes:
//
//   GET https://<your-domain>/api/cron/sync-shipments?secret=<CRON_SECRET>
//
// Set CRON_SECRET in your .env to protect this endpoint from public calls.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTrackingInfo, mapTrack17Status } from "@/lib/shipping/17track"
import { notifyShipmentStatusChange } from "@/lib/shipping/notify"
import { Prisma, ShipmentStatus } from "@prisma/client"

const ACTIVE_STATUSES: ShipmentStatus[] = [
  "BOOKED", "PICKED_UP", "IN_TRANSIT", "ARRIVED_ORIGIN_PORT", "CUSTOMS_ORIGIN",
  "DEPARTED", "ARRIVED_DESTINATION", "CUSTOMS_DESTINATION", "OUT_FOR_DELIVERY", "DELAYED",
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const shipments = await prisma.shipment.findMany({
    where: {
      isDeleted: false,
      trackingSource: "API_17TRACK",
      autoSyncEnabled: true,
      carrierTrackingNumber: { not: null },
      status: { in: ACTIVE_STATUSES },
    },
    select: { id: true, carrierTrackingNumber: true, clientId: true, trackingCode: true },
    take: 200, // 17TRACK's gettrackinfo caps at 40/call; batch below
  })

  if (shipments.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, updated: 0 })
  }

  let updated = 0
  const BATCH_SIZE = 40

  for (let i = 0; i < shipments.length; i += BATCH_SIZE) {
    const batch = shipments.slice(i, i + BATCH_SIZE)
    try {
      const results = await getTrackingInfo(
        batch.map((s) => ({ number: s.carrierTrackingNumber as string })),
      )

      for (const result of results) {
        const shipment = batch.find((s) => s.carrierTrackingNumber === result.number)
        if (!shipment) continue

        const mappedStatus = mapTrack17Status(result.status)
        const knownEvents = await prisma.shipmentEvent.findMany({
          where: { shipmentId: shipment.id, source: "API" },
          select: { occurredAt: true },
        })
        const knownTimes = new Set(knownEvents.map((e) => e.occurredAt.getTime()))

        let newEvents = 0
        for (const evt of result.events) {
          const occurredAt = new Date(evt.time)
          if (Number.isNaN(occurredAt.getTime()) || knownTimes.has(occurredAt.getTime())) continue
          await prisma.shipmentEvent.create({
            data: {
              shipmentId: shipment.id,
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
          where: { id: shipment.id },
          data: {
            status: mappedStatus,
            lastSyncedAt: new Date(),
            lastSyncError: null,
            ...(mappedStatus === "DELIVERED" ? { actualDelivery: new Date() } : {}),
          },
        })

        if (newEvents > 0) {
          updated++
          await notifyShipmentStatusChange({
            shipmentId: shipment.id,
            userId: shipment.clientId,
            trackingCode: shipment.trackingCode,
            status: mappedStatus,
          })
        }
      }
    } catch (err: any) {
      console.error("[cron sync-shipments] batch failed", err)
      // Record the error on this batch's shipments so it's visible in the admin panel.
      await prisma.shipment.updateMany({
        where: { id: { in: batch.map((s) => s.id) } },
        data: { lastSyncError: err?.message ?? "Batch sync failed" },
      })
    }
  }

  return NextResponse.json({ ok: true, synced: shipments.length, updated })
}
