// lib/shipping/17track.ts
//
// Thin client for the 17TRACK Tracking API (https://api.17track.net).
// Docs: https://api.17track.net/en/doc
//
// Auth: every request carries the account API key in the "17token" header.
// The key is read from IntegrationSetting (DB, admin-editable) with a
// process.env.TRACK17_API_KEY fallback — see lib/shipping/settings.ts.

import crypto from "crypto";
import { getSetting } from "./settings";
import { ShipmentStatus } from "@prisma/client";

const BASE_URL = "https://api.17track.net/track/v2.2";

type Track17RegisterItem = { number: string; carrier?: number };

export interface Track17Event {
  time: string; // ISO-ish string from 17TRACK
  location?: string;
  description: string;
  stage?: string;
}

export interface Track17Result {
  number: string;
  carrier?: number;
  status: string; // 17TRACK main status string e.g. "InTransit", "Delivered"
  events: Track17Event[];
  raw: unknown;
}

async function getApiKey(): Promise<string> {
  const key = await getSetting("17TRACK", "API_KEY");
  if (!key) {
    throw new Error(
      "17TRACK API key is not configured. Add it in Admin → Integrations.",
    );
  }
  return key;
}

async function track17Fetch(path: string, body: unknown) {
  const key = await getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "17token": key,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || (typeof json?.code === "number" && json.code !== 0)) {
    throw new Error(
      `17TRACK API error (${res.status}): ${json?.msg ?? JSON.stringify(json)}`,
    );
  }
  return json;
}

/** Register one or more tracking numbers with 17TRACK so it starts polling carriers. */
export async function registerTrackingNumbers(items: Track17RegisterItem[]) {
  return track17Fetch("/register", items);
}

/** Stop tracking (e.g. shipment delivered/canceled, no longer needed). */
export async function stopTrackingNumbers(items: Track17RegisterItem[]) {
  return track17Fetch("/stoptrack", items);
}

/** Pull the latest tracking info for already-registered numbers (max 40 per call). */
export async function getTrackingInfo(
  items: Track17RegisterItem[],
): Promise<Track17Result[]> {
  const json = await track17Fetch("/gettrackinfo", items);
  const accepted: any[] = json?.data?.accepted ?? [];
  return accepted.map((entry) => {
    const latest = entry?.track_info?.latest_status ?? {};
    const events: Track17Event[] = (
      entry?.track_info?.tracking?.providers?.[0]?.events ?? []
    ).map((e: any) => ({
      time: e.time_iso ?? e.time_utc ?? e.time ?? new Date().toISOString(),
      location: e.location ?? undefined,
      description: e.description ?? e.stage ?? "Tracking update",
      stage: e.stage,
    }));
    return {
      number: entry.number,
      carrier: entry.carrier,
      status: latest.status ?? "Unknown",
      events,
      raw: entry,
    };
  });
}

/** Remaining free/paid quota on the account — handy for an admin panel indicator. */
export async function getQuota() {
  return track17Fetch("/getquota", []);
}

/**
 * Verify an incoming webhook push from 17TRACK.
 * Signature scheme: sha256("{type}/{data-json}/{api-key}") in hex, lowercase.
 */
export async function verifyWebhookSignature(
  type: string,
  dataRaw: string,
  signature: string,
): Promise<boolean> {
  const secret =
    (await getSetting("17TRACK", "WEBHOOK_SECRET")) ?? (await getApiKey());
  const computed = crypto
    .createHash("sha256")
    .update(`${type}/${dataRaw}/${secret}`)
    .digest("hex");
  return computed === signature;
}

/**
 * Map 17TRACK's main status strings to our internal ShipmentStatus enum.
 * 17TRACK's official main statuses: NotFound, InfoReceived, InTransit,
 * Expired, AvailableForPickup, OutForDelivery, DeliveryFailure, Delivered, Exception
 */
export function mapTrack17Status(status: string): ShipmentStatus {
  switch (status) {
    case "InfoReceived":
      return ShipmentStatus.BOOKED;
    case "InTransit":
      return ShipmentStatus.IN_TRANSIT;
    case "AvailableForPickup":
      return ShipmentStatus.OUT_FOR_DELIVERY;
    case "OutForDelivery":
      return ShipmentStatus.OUT_FOR_DELIVERY;
    case "DeliveryFailure":
      return ShipmentStatus.EXCEPTION;
    case "Delivered":
      return ShipmentStatus.DELIVERED;
    case "Exception":
      return ShipmentStatus.EXCEPTION;
    case "Expired":
      return ShipmentStatus.DELAYED;
    case "NotFound":
      return ShipmentStatus.BOOKED;
    default:
      return ShipmentStatus.IN_TRANSIT;
  }
}
