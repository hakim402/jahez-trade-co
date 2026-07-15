// lib/shipping/settings.ts
//
// Generic key/value store for third-party integration credentials
// (tracking API tokens, etc.) that admins can edit from the admin panel.
// Falls back to process.env if no DB row exists yet, so the system keeps
// working purely from .env until an admin overrides it in the UI.

import { prisma } from "@/lib/prisma";

export type ProviderKey = "17TRACK" | "SHIP24" | "AFTERSHIP" | "WHATSAPP";

// Maps a DB (provider, key) pair to a fallback env var name.
const ENV_FALLBACKS: Record<string, string> = {
  "17TRACK.API_KEY": "TRACK17_API_KEY",
  "17TRACK.WEBHOOK_SECRET": "TRACK17_WEBHOOK_SECRET",
  "17TRACK.ENABLED": "TRACK17_ENABLED",
};

/**
 * Read a single integration setting, preferring the DB value (set by an
 * admin) and falling back to the matching .env variable.
 */
export async function getSetting(
  provider: ProviderKey,
  key: string,
): Promise<string | null> {
  const row = await prisma.integrationSetting.findUnique({
    where: { provider_key: { provider, key } },
    select: { value: true },
  });
  if (row?.value) return row.value;

  const envKey = ENV_FALLBACKS[`${provider}.${key}`];
  if (envKey && process.env[envKey]) return process.env[envKey] as string;

  return null;
}

/** Read every stored setting for a provider as a flat map. */
export async function getProviderSettings(
  provider: ProviderKey,
): Promise<Record<string, string>> {
  const rows = await prisma.integrationSetting.findMany({
    where: { provider },
    select: { key: true, value: true },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  // Fill in any missing keys from .env fallbacks
  for (const combo of Object.keys(ENV_FALLBACKS)) {
    const [p, k] = combo.split(".");
    if (p === provider && !(k in map) && process.env[ENV_FALLBACKS[combo]]) {
      map[k] = process.env[ENV_FALLBACKS[combo]] as string;
    }
  }
  return map;
}

/** Upsert a setting from the admin panel. */
export async function setSetting(
  provider: ProviderKey,
  key: string,
  value: string,
  updatedById: string,
  isSecret = true,
) {
  return prisma.integrationSetting.upsert({
    where: { provider_key: { provider, key } },
    update: { value, updatedById, isSecret },
    create: { provider, key, value, updatedById, isSecret },
  });
}

export async function deleteSetting(provider: ProviderKey, key: string) {
  return prisma.integrationSetting.deleteMany({ where: { provider, key } });
}

/** Mask a secret for display in the admin UI (e.g. "sk_live_••••••••3f2a"). */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

export async function isTrack17Enabled(): Promise<boolean> {
  const [apiKey, enabledFlag] = await Promise.all([
    getSetting("17TRACK", "API_KEY"),
    getSetting("17TRACK", "ENABLED"),
  ]);
  if (!apiKey) return false;
  if (enabledFlag === "false") return false;
  return true;
}
