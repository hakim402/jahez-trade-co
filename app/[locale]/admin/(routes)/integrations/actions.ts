"use server"

// app/[locale]/admin/(routes)/integrations/actions.ts
//
// Lets an admin add/edit the 17TRACK (and future provider) API credentials
// from the admin panel instead of editing .env directly.

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getProviderSettings, setSetting, maskSecret } from "@/lib/shipping/settings"
import { getQuota } from "@/lib/shipping/17track"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

async function logAdminAction(opts: { action: string; entity: string; entityId?: string }) {
  try {
    const adminId = await requireAdmin()
    await prisma.auditLog.create({ data: { adminId, ...opts } })
  } catch {
    /* non-fatal */
  }
}

export async function getTrack17Settings(): Promise<
  ActionResult<{ apiKeyMasked: string; hasApiKey: boolean; webhookSecretMasked: string; hasWebhookSecret: boolean; enabled: boolean }>
> {
  try {
    await requireAdmin()
    const settings = await getProviderSettings("17TRACK")
    return {
      success: true,
      data: {
        apiKeyMasked: maskSecret(settings.API_KEY),
        hasApiKey: Boolean(settings.API_KEY),
        webhookSecretMasked: maskSecret(settings.WEBHOOK_SECRET),
        hasWebhookSecret: Boolean(settings.WEBHOOK_SECRET),
        enabled: settings.ENABLED !== "false",
      },
    }
  } catch (err) {
    console.error("[getTrack17Settings]", err)
    return { success: false, error: "Failed to load integration settings" }
  }
}

const settingsSchema = z.object({
  apiKey: z.string().min(4).optional(),
  webhookSecret: z.string().optional(),
  enabled: z.boolean(),
})

export async function saveTrack17Settings(input: z.infer<typeof settingsSchema>): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }

    if (parsed.data.apiKey) {
      await setSetting("17TRACK", "API_KEY", parsed.data.apiKey.trim(), adminId, true)
    }
    if (parsed.data.webhookSecret) {
      await setSetting("17TRACK", "WEBHOOK_SECRET", parsed.data.webhookSecret.trim(), adminId, true)
    }
    await setSetting("17TRACK", "ENABLED", parsed.data.enabled ? "true" : "false", adminId, false)

    await logAdminAction({ action: "UPDATE_INTEGRATION_SETTINGS", entity: "IntegrationSetting", entityId: "17TRACK" })
    revalidatePath("/admin/integrations")
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[saveTrack17Settings]", err)
    return { success: false, error: "Failed to save settings" }
  }
}

export async function checkTrack17Quota(): Promise<ActionResult<{ total: number; used: number; remaining: number }>> {
  try {
    await requireAdmin()
    const json = await getQuota()
    const data = json?.data ?? {}
    return {
      success: true,
      data: {
        total: data.quota_total ?? 0,
        used: data.quota_used ?? 0,
        remaining: data.quota_remain ?? 0,
      },
    }
  } catch (err: any) {
    console.error("[checkTrack17Quota]", err)
    return { success: false, error: err?.message ?? "Failed to check quota. Verify your API key is correct." }
  }
}
