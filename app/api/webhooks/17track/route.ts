// app/api/webhooks/17track/route.ts
//
// Receives real-time push notifications from 17TRACK whenever a tracked
// shipment's status changes, so shipments update instantly instead of
// waiting for a manual "Sync now" click.
//
// Configure this URL in 17TRACK's dashboard (or via their push API) as:
//   https://<your-domain>/api/webhooks/17track

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature, mapTrack17Status } from "@/lib/shipping/17track"
import { notifyShipmentStatusChange } from "@/lib/shipping/notify"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("sign") ?? ""

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = payload?.event as string | undefined // e.g. "TRACKING_UPDATED"
  const dataArray: any[] = Array.isArray(payload?.data) ? payload.data : [payload?.data].filter(Boolean)

  // Verify the signature 17TRACK sends in the "sign" header.
  try {
    const dataRaw = JSON.stringify(payload?.data ?? {})
    const valid = await verifyWebhookSignature(event ?? "", dataRaw, signature)
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  } catch (err) {
    console.error("[17track webhook] signature check failed", err)
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 })
  }

  for (const entry of dataArray) {
    const number: string | undefined = entry?.number
    if (!number) continue

    const shipment = await prisma.shipment.findFirst({
      where: { carrierTrackingNumber: number, trackingSource: "API_17TRACK", isDeleted: false },
    })
    if (!shipment) continue

    const latestStatus = entry?.track_info?.latest_status?.status ?? "Unknown"
    const mappedStatus = mapTrack17Status(latestStatus)

    const events: any[] = entry?.track_info?.tracking?.providers?.[0]?.events ?? []
    const knownEvents = await prisma.shipmentEvent.findMany({
      where: { shipmentId: shipment.id, source: "API" },
      select: { occurredAt: true },
    })
    const knownTimes = new Set(knownEvents.map((e) => e.occurredAt.getTime()))

    let newEvents = 0
    for (const evt of events) {
      const occurredAt = new Date(evt.time_iso ?? evt.time_utc ?? evt.time ?? Date.now())
      if (Number.isNaN(occurredAt.getTime()) || knownTimes.has(occurredAt.getTime())) continue
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: mappedStatus,
          title: evt.description ?? evt.stage ?? "Tracking update",
          location: evt.location ?? null,
          occurredAt,
          source: "API",
          rawPayload: evt as Prisma.InputJsonValue,
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
      await notifyShipmentStatusChange({
        shipmentId: shipment.id,
        userId: shipment.clientId,
        trackingCode: shipment.trackingCode,
        status: mappedStatus,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
