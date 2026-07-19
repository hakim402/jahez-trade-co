"use server"

// app/[locale]/admin/(routes)/integrations/actions.ts
//
// Lets an admin add/edit the 17TRACK, Twilio (WhatsApp) and Email provider
// credentials from the admin panel instead of editing .env directly.

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getProviderSettings, setSetting, maskSecret, type ProviderKey } from "@/lib/shipping/settings"
import { getQuota } from "@/lib/shipping/17track"
import { sendEmail } from "@/lib/email"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

async function logAdminAction(opts: { action: string; entity: string; entityId?: string }) {
  try {
    const adminId = await requireAdmin()
    await prisma.auditLog.create({ data: { adminId, ...opts } })
  } catch {
    /* non-fatal */
  }
}

// ─────────────────────────────────────────────
// 17TRACK
// ─────────────────────────────────────────────

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

const track17Schema = z.object({
  apiKey: z.string().min(4).optional(),
  webhookSecret: z.string().optional(),
  enabled: z.boolean(),
})

export async function saveTrack17Settings(input: z.infer<typeof track17Schema>): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = track17Schema.safeParse(input)
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

// ─────────────────────────────────────────────
// TWILIO / WhatsApp
// ─────────────────────────────────────────────

export async function getTwilioSettings(): Promise<
  ActionResult<{
    accountSidMasked: string; hasAccountSid: boolean;
    authTokenMasked: string; hasAuthToken: boolean;
    whatsappFrom: string; hasWhatsappFrom: boolean;
    enabled: boolean;
  }>
> {
  try {
    await requireAdmin()
    const settings = await getProviderSettings("TWILIO")
    return {
      success: true,
      data: {
        accountSidMasked: maskSecret(settings.ACCOUNT_SID),
        hasAccountSid: Boolean(settings.ACCOUNT_SID),
        authTokenMasked: maskSecret(settings.AUTH_TOKEN),
        hasAuthToken: Boolean(settings.AUTH_TOKEN),
        whatsappFrom: settings.WHATSAPP_FROM || "",
        hasWhatsappFrom: Boolean(settings.WHATSAPP_FROM),
        enabled: settings.ENABLED !== "false",
      },
    }
  } catch (err) {
    console.error("[getTwilioSettings]", err)
    return { success: false, error: "Failed to load Twilio settings" }
  }
}

const twilioSchema = z.object({
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  whatsappFrom: z.string().optional(),
  enabled: z.boolean(),
})

export async function saveTwilioSettings(input: z.infer<typeof twilioSchema>): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = twilioSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }

    if (parsed.data.accountSid) {
      await setSetting("TWILIO", "ACCOUNT_SID", parsed.data.accountSid.trim(), adminId, true)
    }
    if (parsed.data.authToken) {
      await setSetting("TWILIO", "AUTH_TOKEN", parsed.data.authToken.trim(), adminId, true)
    }
    if (parsed.data.whatsappFrom) {
      await setSetting("TWILIO", "WHATSAPP_FROM", parsed.data.whatsappFrom.trim(), adminId, false)
    }
    await setSetting("TWILIO", "ENABLED", parsed.data.enabled ? "true" : "false", adminId, false)

    await logAdminAction({ action: "UPDATE_INTEGRATION_SETTINGS", entity: "IntegrationSetting", entityId: "TWILIO" })
    revalidatePath("/admin/integrations")
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[saveTwilioSettings]", err)
    return { success: false, error: "Failed to save Twilio settings" }
  }
}

// ─────────────────────────────────────────────
// EMAIL PROVIDER
// ─────────────────────────────────────────────

export type EmailProviderType = "gmail" | "smtp" | "none"

export async function getEmailSettings(): Promise<
  ActionResult<{
    provider: string; host: string; port: string; user: string;
    passMasked: string; hasPass: boolean;
    fromName: string; fromAddress: string; enabled: boolean;
  }>
> {
  try {
    await requireAdmin()
    const settings = await getProviderSettings("EMAIL")
    return {
      success: true,
      data: {
        provider: settings.PROVIDER || "none",
        host: settings.HOST || "",
        port: settings.PORT || "",
        user: settings.USER || "",
        passMasked: maskSecret(settings.PASS),
        hasPass: Boolean(settings.PASS),
        fromName: settings.FROM_NAME || "",
        fromAddress: settings.FROM_ADDRESS || "",
        enabled: settings.ENABLED !== "false",
      },
    }
  } catch (err) {
    console.error("[getEmailSettings]", err)
    return { success: false, error: "Failed to load email settings" }
  }
}

const emailSchema = z.object({
  provider: z.enum(["gmail", "smtp", "none"]),
  host: z.string().optional(),
  port: z.string().optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
  fromName: z.string().optional(),
  fromAddress: z.string().optional(),
  enabled: z.boolean(),
})

export async function saveEmailSettings(input: z.infer<typeof emailSchema>): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const parsed = emailSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }

    await setSetting("EMAIL", "PROVIDER", parsed.data.provider, adminId, false)
    if (parsed.data.host) await setSetting("EMAIL", "HOST", parsed.data.host.trim(), adminId, false)
    if (parsed.data.port) await setSetting("EMAIL", "PORT", parsed.data.port.trim(), adminId, false)
    if (parsed.data.user) await setSetting("EMAIL", "USER", parsed.data.user.trim(), adminId, false)
    if (parsed.data.pass) await setSetting("EMAIL", "PASS", parsed.data.pass.trim(), adminId, true)
    if (parsed.data.fromName) await setSetting("EMAIL", "FROM_NAME", parsed.data.fromName.trim(), adminId, false)
    if (parsed.data.fromAddress) await setSetting("EMAIL", "FROM_ADDRESS", parsed.data.fromAddress.trim(), adminId, false)
    await setSetting("EMAIL", "ENABLED", parsed.data.enabled ? "true" : "false", adminId, false)

    await logAdminAction({ action: "UPDATE_INTEGRATION_SETTINGS", entity: "IntegrationSetting", entityId: "EMAIL" })
    revalidatePath("/admin/integrations")
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[saveEmailSettings]", err)
    return { success: false, error: "Failed to save email settings" }
  }
}

export async function testEmailConnection(): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()

    const settings = await getProviderSettings("EMAIL")
    const provider = settings.PROVIDER || process.env.EMAIL_PROVIDER || "none"
    const fromAddress = settings.FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS || "info@jahez.online"

    if (provider === "none") {
      return { success: false, error: "No email provider configured" }
    }

    await sendEmail({
      to: fromAddress,
      subject: "Jahez Trade Co. — Email Test",
      html: `<div style="font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#7b57fc">✅ Email Connection Successful</h2>
        <p>Your email provider is configured correctly. Notifications will be sent from <strong>${fromAddress}</strong>.</p>
        <p style="color:#64748b;font-size:12px">Provider: ${provider}</p>
      </div>`,
    })

    return { success: true, data: { ok: true } }
  } catch (err: any) {
    console.error("[testEmailConnection]", err)
    return { success: false, error: err?.message ?? "Failed to send test email" }
  }
}
