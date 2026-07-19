// lib/email.ts
//
// Multi-provider email service.
// Credentials are read from IntegrationSetting (DB, admin-editable)
// with a process.env fallback — see lib/shipping/settings.ts.
//
// Supported providers (controlled by EMAIL.PROVIDER setting):
//   "gmail" — Gmail with app password
//   "smtp"  — Generic SMTP (Hostinger, SendGrid, etc.)
//   "none"  — Disabled, all sends return { success: false } gracefully

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import { getSetting, isEmailEnabled } from "@/lib/shipping/settings";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    attachments?: Attachment[];
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// ─────────────────────────────────────────────
// Transport factory — cached in module scope
// ─────────────────────────────────────────────

let _transport: Transporter | null = null;
let _transportProvider: string | null = null;

async function createTransport(): Promise<Transporter | null> {
    const provider = (await getSetting("EMAIL", "PROVIDER")) || "none";
    if (provider === "none") return null;

    // Reuse cached transport if the provider hasn't changed
    if (_transport && _transportProvider === provider) return _transport;

    if (provider === "gmail") {
        const [user, pass] = await Promise.all([
            getSetting("EMAIL", "USER"),
            getSetting("EMAIL", "PASS"),
        ]);
        if (!user || !pass) return null;
        _transport = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    } else if (provider === "smtp") {
        const [host, port, user, pass] = await Promise.all([
            getSetting("EMAIL", "HOST"),
            getSetting("EMAIL", "PORT"),
            getSetting("EMAIL", "USER"),
            getSetting("EMAIL", "PASS"),
        ]);
        if (!host || !user || !pass) return null;
        _transport = nodemailer.createTransport({
            host,
            port: port ? parseInt(port, 10) : 587,
            secure: port === "465",
            auth: { user, pass },
        });
    } else {
        return null;
    }

    _transportProvider = provider;
    return _transport;
}

// ─────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
        const enabled = await isEmailEnabled();
        if (!enabled) return { success: false, error: "Email is not enabled" };

        const transport = await createTransport();
        if (!transport) return { success: false, error: "Email transport not configured" };

        const [fromName, fromAddress] = await Promise.all([
            getSetting("EMAIL", "FROM_NAME"),
            getSetting("EMAIL", "FROM_ADDRESS"),
        ]);
        const from = fromName && fromAddress
            ? `"${fromName}" <${fromAddress}>`
            : fromAddress || process.env.GMAIL_USER || "noreply@jahez.online";

        const info = await transport.sendMail({
            from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            attachments: params.attachments,
        });

        return { success: true, messageId: info.messageId };
    } catch (err: any) {
        console.error("[Email] Send failed:", err?.message ?? err);
        return { success: false, error: err?.message ?? "Unknown error" };
    }
}

// ─────────────────────────────────────────────
// Admin helpers
// ─────────────────────────────────────────────

async function getAdminEmails(): Promise<string[]> {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isDeleted: false },
        select: { email: true },
    });
    return admins.map((a) => a.email).filter(Boolean) as string[];
}

export async function sendEmailToAdmins(subject: string, html: string): Promise<void> {
    const emails = await getAdminEmails();
    if (emails.length === 0) return;

    // Send to all admins using BCC to avoid revealing addresses
    await sendEmail({ to: emails[0], subject, html });
    // If more than one admin, send individually so each gets a copy
    for (let i = 1; i < emails.length; i++) {
        await sendEmail({ to: emails[i], subject, html });
    }
}

export async function sendEmailToClient(
    email: string,
    subject: string,
    html: string,
): Promise<EmailResult> {
    if (!email) return { success: false, error: "No email address provided" };
    return sendEmail({ to: email, subject, html });
}

// ─────────────────────────────────────────────
// Bilingual HTML Email Templates
// ─────────────────────────────────────────────

function emailWrapper(content: string, isAr: boolean): string {
    const dir = isAr ? "rtl" : "ltr";
    return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7b57fc 0%,#2b1cff 100%);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">JAHEZ Trade Co.</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#fafafb;text-align:center;">
            <p style="margin:0;font-size:11px;color:#a0a0ab;">JAHEZ Trade Co. — jahez.online</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── ADMIN NOTIFICATION TEMPLATES ────────────────────────────────

export function adminNewRequestEmail(params: {
    type: "consulting" | "product" | "booking";
    guestName: string;
    guestEmail: string;
    details: string;
    adminUrl: string;
    locale: "ar" | "en";
}): { subject: string; html: string } {
    const isAr = params.locale === "ar";

    const subjects: Record<string, { ar: string; en: string }> = {
        consulting: { ar: "طلب استشارة جديد", en: "New Consulting Request" },
        product: { ar: "طلب منتج جديد", en: "New Product Request" },
        booking: { ar: "حجز مكالمة فيديو جديد", en: "New Video Call Booking" },
    };
    const s = subjects[params.type];

    const body = isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">📩 تم استلام طلب جديد من زائر.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">👤 الاسم</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.guestName}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">📧 البريد</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.guestEmail}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">📝 التفاصيل</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.details}</td></tr>
           </table>
           <a href="${params.adminUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">عرض الطلب في لوحة التحكم</a>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">📩 A new request was submitted by a visitor.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">👤 Name</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.guestName}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">📧 Email</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.guestEmail}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">📝 Details</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.details}</td></tr>
           </table>
           <a href="${params.adminUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">View in Admin Panel</a>`;

    return {
        subject: isAr ? s.ar : s.en,
        html: emailWrapper(body, isAr),
    };
}

// ── CLIENT NOTIFICATION TEMPLATES ───────────────────────────────

export function clientQuoteReadyEmail(params: {
    customerName: string;
    requestId: string;
    price: string;
    currency: string;
    validUntil?: string;
    dashboardUrl: string;
    locale: "ar" | "en";
}): { subject: string; html: string } {
    const isAr = params.locale === "ar";

    const body = isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">مرحباً ${params.customerName}،</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">💰 عرض سعر جديد جاهز لطلبك!</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">رقم الطلب</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${params.requestId}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">السعر</td><td style="padding:10px 16px;font-size:15px;color:#7b57fc;font-weight:700;">${params.price} ${params.currency}</td></tr>
             ${params.validUntil ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">صالح حتى</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.validUntil}</td></tr>` : ""}
           </table>
           <a href="${params.dashboardUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">مراجعة العرض</a>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">Hello ${params.customerName},</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">💰 A new quote is ready for your request!</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Request ID</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${params.requestId}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Price</td><td style="padding:10px 16px;font-size:15px;color:#7b57fc;font-weight:700;">${params.price} ${params.currency}</td></tr>
             ${params.validUntil ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Valid until</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.validUntil}</td></tr>` : ""}
           </table>
           <a href="${params.dashboardUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">Review Quote</a>`;

    return {
        subject: isAr ? `عرض سعر جديد — ${params.requestId}` : `New Quote Ready — ${params.requestId}`,
        html: emailWrapper(body, isAr),
    };
}

export function clientBookingUpdateEmail(params: {
    customerName: string;
    bookingType: string;
    status: "confirmed" | "rejected" | "rescheduled";
    scheduledAt?: string;
    meetingLink?: string;
    meetingPassword?: string;
    reason?: string;
    locale: "ar" | "en";
}): { subject: string; html: string } {
    const isAr = params.locale === "ar";
    const isGood = params.status === "confirmed";

    const icon = isGood ? "✅" : "❌";
    const titleAr = isGood ? "تم تأكيد الحجز" : params.status === "rejected" ? "لم يتم قبول الحجز" : "تمت إعادة جدولة الحجز";
    const titleEn = isGood ? "Booking Confirmed" : params.status === "rejected" ? "Booking Not Confirmed" : "Booking Rescheduled";

    const extraAr = [
        params.scheduledAt ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">الموعد</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.scheduledAt}</td></tr>` : "",
        params.meetingLink ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">الرابط</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.meetingLink}</td></tr>` : "",
        params.meetingPassword ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">كلمة المرور</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.meetingPassword}</td></tr>` : "",
        params.reason ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">السبب</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.reason}</td></tr>` : "",
    ].join("");

    const extraEn = [
        params.scheduledAt ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">When</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.scheduledAt}</td></tr>` : "",
        params.meetingLink ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Link</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.meetingLink}</td></tr>` : "",
        params.meetingPassword ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Password</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.meetingPassword}</td></tr>` : "",
        params.reason ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Reason</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.reason}</td></tr>` : "",
    ].join("");

    const body = isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">مرحباً ${params.customerName}،</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">${icon} ${titleAr}</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">النوع</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.bookingType}</td></tr>
             ${extraAr}
           </table>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">Hello ${params.customerName},</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">${icon} ${titleEn}</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Type</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.bookingType}</td></tr>
             ${extraEn}
           </table>`;

    return {
        subject: isAr ? `${icon} ${titleAr}` : `${icon} ${titleEn}`,
        html: emailWrapper(body, isAr),
    };
}

export function clientConsultingUpdateEmail(params: {
    customerName: string;
    serviceTitle: string;
    status: string;
    adminNotes?: string;
    locale: "ar" | "en";
}): { subject: string; html: string } {
    const isAr = params.locale === "ar";

    const body = isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">مرحباً ${params.customerName}،</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">📋 تحديث على طلب الاستشارة الخاص بك.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">الخدمة</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.serviceTitle}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">الحالة</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.status}</td></tr>
             ${params.adminNotes ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">ملاحظات</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.adminNotes}</td></tr>` : ""}
           </table>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">Hello ${params.customerName},</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">📋 An update on your consulting request.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Service</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.serviceTitle}</td></tr>
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Status</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.status}</td></tr>
             ${params.adminNotes ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Notes</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.adminNotes}</td></tr>` : ""}
           </table>`;

    return {
        subject: isAr ? `تحديث على طلب الاستشارة` : `Consulting Request Update`,
        html: emailWrapper(body, isAr),
    };
}

// ── REQUEST STATUS UPDATE TEMPLATE ─────────────────────────────

export function clientRequestStatusUpdateEmail(params: {
    customerName: string;
    requestId: string;
    newStatus: string;
    requestDescription?: string;
    adminNote?: string;
    dashboardUrl: string;
    locale: "ar" | "en";
}): { subject: string; html: string } {
    const isAr = params.locale === "ar";

    const statusLabel = params.newStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const body = isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">مرحباً ${params.customerName}،</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">📋 تم تحديث حالة طلبك.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">رقم الطلب</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${params.requestId}</td></tr>
             ${params.requestDescription ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">المنتج</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.requestDescription}</td></tr>` : ""}
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">الحالة الجديدة</td><td style="padding:14px 16px;font-size:14px;color:#7b57fc;font-weight:700;">${statusLabel}</td></tr>
             ${params.adminNote ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">ملاحظة من الإدارة</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.adminNote}</td></tr>` : ""}
           </table>
           <a href="${params.dashboardUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">عرض الطلب في لوحة التحكم</a>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#1a1a2e;">Hello ${params.customerName},</p>
           <p style="margin:0 0 16px;font-size:14px;color:#4a4a58;">📋 Your request status has been updated.</p>
           <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Request ID</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${params.requestId}</td></tr>
             ${params.requestDescription ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Product</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.requestDescription}</td></tr>` : ""}
             <tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">New Status</td><td style="padding:14px 16px;font-size:14px;color:#7b57fc;font-weight:700;">${statusLabel}</td></tr>
             ${params.adminNote ? `<tr><td style="padding:10px 16px;font-size:12px;color:#888;font-weight:600;">Admin Note</td><td style="padding:10px 16px;font-size:13px;color:#1a1a2e;">${params.adminNote}</td></tr>` : ""}
           </table>
           <a href="${params.dashboardUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">View in Dashboard</a>`;

    return {
        subject: isAr ? `تحديث حالة الطلب ${params.requestId} — ${statusLabel}` : `Request ${params.requestId} Status — ${statusLabel}`,
        html: emailWrapper(body, isAr),
    };
}

