"use server"

// app/[locale]/(pages)/contact/actions.ts


import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContactFormInput = {
  fullName: string
  email: string
  phone?: string
  company?: string
  subject: string        // "sourcing" | "booking" | "consulting" | "shipping" | "other"
  message: string
  locale?: string
}

export type ContactResult =
  | { success: true }
  | { success: false; error: string }

// ─── Transport ────────────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  })
}

// ─── Email templates ──────────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<string, { en: string; ar: string }> = {
  sourcing: { en: "Product Sourcing", ar: "استيراد المنتجات" },
  booking: { en: "Video Booking", ar: "حجز جلسة فيديو" },
  consulting: { en: "Business Consulting", ar: "استشارة تجارية" },
  shipping: { en: "Shipping & Logistics", ar: "الشحن واللوجستيك" },
  other: { en: "General Inquiry", ar: "استفسار عام" },
}

function buildEmailHtml(input: ContactFormInput): string {
  const subjectLabel = SUBJECT_LABELS[input.subject]?.en ?? input.subject

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact — Mewan Platform</title>
</head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7b57fc 0%,#2b1cff 100%);padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                    <span style="font-size:22px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package-icon lucide-package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/></svg> </span>
                  </div>
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">New Contact Message</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Mewan Sourcing Platform</p>
                </td>
                <td align="right" valign="top">
                  <span style="background:rgba(255,255,255,0.15);color:white;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;white-space:nowrap;">
                    ${subjectLabel}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sender info -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;">
              ${[
      ["Full Name", input.fullName],
      ["Email", `<a href="mailto:${input.email}" style="color:#7b57fc;text-decoration:none;">${input.email}</a>`],
      ...(input.phone ? [["Phone", input.phone]] : []),
      ...(input.company ? [["Company", input.company]] : []),
      ["Subject", subjectLabel],
    ].map(([label, value], i) => `
              <tr style="border-bottom:1px solid #ebebef;">
                <td style="padding:11px 16px;font-size:12px;color:#888;font-weight:600;width:110px;white-space:nowrap;">${label}</td>
                <td style="padding:11px 16px;font-size:13px;color:#1a1a2e;font-weight:500;">${value}</td>
              </tr>`).join("")}
            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;">Message</p>
            <div style="background:#f8f8fb;border-radius:12px;padding:16px;font-size:14px;color:#1a1a2e;line-height:1.7;white-space:pre-wrap;">${input.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="padding:24px 32px;">
            <a href="mailto:${input.email}?subject=Re: ${encodeURIComponent(subjectLabel)} — Mewan"
               style="display:inline-block;background:#7b57fc;color:#ffffff;font-size:13px;font-weight:600;padding:12px 24px;border-radius:50px;text-decoration:none;">
              Reply to ${input.fullName} →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #ebebef;">
            <p style="margin:0;font-size:11px;color:#aaa;">This message was submitted via the contact form on <strong>Mewan Sourcing Platform</strong>. Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" })} (AST)</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildAutoReplyHtml(input: ContactFormInput): string {
  const isAr = input.locale === "ar"
  return `
<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="UTF-8" /><title>${isAr ? "تم استلام رسالتك" : "We received your message"}</title></head>
<body style="margin:0;padding:0;font-family:system-ui,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7b57fc 0%,#2b1cff 100%);padding:28px 32px;text-align:${isAr ? "right" : "left"};">
            <div style="font-size:32px;margin-bottom:8px;">✅</div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
              ${isAr ? `مرحباً ${input.fullName}،` : `Hello ${input.fullName},`}
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
              ${isAr ? "تم استلام رسالتك بنجاح" : "Your message has been received"}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;font-size:14px;color:#333;line-height:1.75;text-align:${isAr ? "right" : "left"};">
            <p style="margin:0 0 16px;">
              ${isAr
      ? "شكراً لتواصلك معنا. سيراجع فريقنا رسالتك ويرد عليك في أقرب وقت ممكن، عادةً خلال <strong style='color:#7b57fc;'>٢٤–٤٨ ساعة</strong>."
      : "Thank you for reaching out. Our team will review your message and respond as soon as possible, usually within <strong style='color:#7b57fc;'>24–48 hours</strong>."}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;padding:16px;">
              <tr><td style="font-size:12px;color:#888;padding-bottom:4px;">${isAr ? "موضوعك" : "Your subject"}</td></tr>
              <tr><td style="font-size:14px;font-weight:600;color:#1a1a2e;">${SUBJECT_LABELS[input.subject]?.[isAr ? "ar" : "en"] ?? input.subject}</td></tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#777;">
              ${isAr
      ? "في غضون ذلك، يمكنك تصفح منتجاتنا الرائجة أو إرسال طلب مباشر من لوحة التحكم."
      : "In the meantime, you can browse our trending products or submit a direct request from your dashboard."}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;text-align:${isAr ? "right" : "left"};">
            <p style="margin:0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} Mewan Sourcing Platform · mewansourcing@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Server action ────────────────────────────────────────────────────────────

export async function submitContactForm(input: ContactFormInput): Promise<ContactResult> {
  // Basic validation
  if (!input.fullName?.trim()) return { success: false, error: "Name is required" }
  if (!input.email?.trim()) return { success: false, error: "Email is required" }
  if (!input.message?.trim()) return { success: false, error: "Message is required" }
  if (input.message.length < 10) return { success: false, error: "Message is too short" }

  const TO = "mewansourcing@gmail.com"

  try {
    const transporter = createTransport()
    const subjectLabel = SUBJECT_LABELS[input.subject]?.en ?? "General Inquiry"

    // 1. Send notification email to the business
    await transporter.sendMail({
      from: `"Mewan Platform" <${process.env.GMAIL_USER}>`,
      to: TO,
      replyTo: input.email,
      subject: `[Contact] ${subjectLabel} — ${input.fullName}`,
      html: buildEmailHtml(input),
    })

    // 2. Send auto-reply to the sender
    await transporter.sendMail({
      from: `"Mewan Sourcing" <${process.env.GMAIL_USER}>`,
      to: input.email,
      subject: input.locale === "ar"
        ? "تم استلام رسالتك — Mewan"
        : "We received your message — Mewan",
      html: buildAutoReplyHtml(input),
    })

    // 3. Optionally log to ConsultingRequest if it's a consulting inquiry
    if (input.subject === "consulting") {
      await prisma.consultingRequest.create({
        data: {
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          phone: input.phone?.trim(),
          company: input.company?.trim(),
          topic: "other",
          description: input.message.trim(),
          status: "NEW",
        },
      }).catch(() => { }) // non-fatal
    }

    return { success: true }
  } catch (err: any) {
    console.error("[Contact] Email send failed:", err?.message)
    return {
      success: false,
      error: "Failed to send message. Please try again or email us directly.",
    }
  }
}