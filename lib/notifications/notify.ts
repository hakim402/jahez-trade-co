// lib/notifications/notify.ts
//
// Unified bidirectional notification hub.
//
// Direction 1: Guest/Client submits → admin gets email + WhatsApp + in-app Notification
// Direction 2: Admin acts → client gets email + WhatsApp + in-app Notification
//
// All sends are fire-and-forget (Promise.allSettled), never blocking.

import { prisma } from "@/lib/prisma";
import { sendWhatsAppToAdmins, sendWhatsAppToClient } from "@/lib/whatsapp";
import {
    sendEmailToAdmins,
    sendEmailToClient,
    adminNewRequestEmail,
    clientQuoteReadyEmail,
    clientBookingUpdateEmail,
    clientConsultingUpdateEmail,
    clientRequestStatusUpdateEmail,
} from "@/lib/email";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SubmissionType = "consulting" | "product" | "booking";

export interface AdminNotificationData {
    guestName: string;
    guestEmail: string;
    details: string;
    adminUrl: string;
    // Optional extra for WhatsApp templates
    serviceTitle?: string;
    productDesc?: string;
    quantity?: number;
    shippingCountry?: string;
    bookingType?: string;
    notes?: string;
    preferredDate?: string;
}

// ─────────────────────────────────────────────
// Direction 1: Guest → Admin
// ─────────────────────────────────────────────

const SUBMISSION_CONFIG: Record<SubmissionType, {
    whatsappTemplate: string;
    notifType: string;
    notifTitle: (locale: string) => string;
    notifMessage: (guestName: string, locale: string) => string;
}> = {
    consulting: {
        whatsappTemplate: "adminNewConsultingRequest",
        notifType: "CONSULTING_REQUEST",
        notifTitle: (l) => l === "ar" ? "طلب استشارة جديد" : "New Consulting Request",
        notifMessage: (n, l) => l === "ar"
            ? `طلب استشارة جديد من ${n}`
            : `New consulting request from ${n}`,
    },
    product: {
        whatsappTemplate: "adminNewProductRequest",
        notifType: "PRODUCT_REQUEST",
        notifTitle: (l) => l === "ar" ? "طلب منتج جديد" : "New Product Request",
        notifMessage: (n, l) => l === "ar"
            ? `طلب منتج جديد من ${n}`
            : `New product request from ${n}`,
    },
    booking: {
        whatsappTemplate: "adminNewBookingRequest",
        notifType: "BOOKING_REQUEST",
        notifTitle: (l) => l === "ar" ? "حجز فيديو جديد" : "New Video Booking",
        notifMessage: (n, l) => l === "ar"
            ? `حجز مكالمة فيديو جديد من ${n}`
            : `New video call booking from ${n}`,
    },
};

export async function notifyAdminsOnNewSubmission(
    type: SubmissionType,
    data: AdminNotificationData,
    locale: "ar" | "en" = "ar",
): Promise<void> {
    const cfg = SUBMISSION_CONFIG[type];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // ── 1. Email to admins ──────────────────────────────────
    const emailPromise = (async () => {
        const { subject, html } = adminNewRequestEmail({
            type,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            details: data.details,
            adminUrl: `${appUrl}${data.adminUrl}`,
            locale,
        });
        await sendEmailToAdmins(subject, html).catch(() => {});
    })();

    // ── 2. WhatsApp to admins ───────────────────────────────
    const whatsappPromise = sendWhatsAppToAdmins(
        cfg.whatsappTemplate,
        {
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            serviceTitle: data.serviceTitle,
            productDesc: data.productDesc,
            quantity: data.quantity,
            shippingCountry: data.shippingCountry,
            bookingType: data.bookingType,
            notes: data.notes,
            preferredDate: data.preferredDate,
        },
        locale,
    ).catch(() => {});

    // ── 3. In-app Notification for all admins ────────────────
    const inAppPromise = (async () => {
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN", isDeleted: false },
            select: { id: true },
        });
        if (admins.length === 0) return;

        await prisma.notification.createMany({
            data: admins.map((a) => ({
                userId: a.id,
                title: cfg.notifTitle(locale),
                message: cfg.notifMessage(data.guestName, locale),
                type: cfg.notifType,
            })),
        });
    })().catch(() => {});

    await Promise.allSettled([emailPromise, whatsappPromise, inAppPromise]);
}

// ─────────────────────────────────────────────
// Direction 2: Admin → Client/Guest
// ─────────────────────────────────────────────

export async function notifyClientOnAdminAction(params: {
    type: "quote_ready" | "booking_confirmed" | "booking_rejected" | "booking_rescheduled" | "consulting_update" | "request_status_update";
    recipientEmail: string;
    recipientPhone?: string | null;
    userId?: string | null;
    locale: "ar" | "en";
    // Quote-specific
    requestId?: string;
    price?: string;
    currency?: string;
    validUntil?: string;
    // Booking-specific
    customerName?: string;
    bookingType?: string;
    scheduledAt?: string;
    meetingLink?: string;
    meetingPassword?: string;
    reason?: string;
    // Consulting-specific
    serviceTitle?: string;
    status?: string;
    adminNotes?: string;
    // Request status update-specific
    requestDescription?: string;
    dashboardUrl?: string;
}): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const isAr = params.locale === "ar";
    const name = params.customerName || "Customer";

    // ── Email ────────────────────────────────────────────────
    const emailPromise = (async () => {
        let result: { subject: string; html: string } | null = null;

        if (params.type === "quote_ready" && params.requestId && params.price) {
            result = clientQuoteReadyEmail({
                customerName: name,
                requestId: params.requestId,
                price: params.price,
                currency: params.currency || "USD",
                validUntil: params.validUntil,
                dashboardUrl: `${appUrl}/dashboard/requests`,
                locale: params.locale,
            });
        } else if (params.type.startsWith("booking_") && params.bookingType) {
            const status = params.type === "booking_confirmed"
                ? "confirmed" as const
                : params.type === "booking_rejected"
                    ? "rejected" as const
                    : "rescheduled" as const;
            result = clientBookingUpdateEmail({
                customerName: name,
                bookingType: params.bookingType,
                status,
                scheduledAt: params.scheduledAt,
                meetingLink: params.meetingLink,
                meetingPassword: params.meetingPassword,
                reason: params.reason,
                locale: params.locale,
            });
        } else if (params.type === "consulting_update" && params.serviceTitle) {
            result = clientConsultingUpdateEmail({
                customerName: name,
                serviceTitle: params.serviceTitle,
                status: params.status || "Updated",
                adminNotes: params.adminNotes,
                locale: params.locale,
            });
        } else if (params.type === "request_status_update" && params.requestId && params.status) {
            result = clientRequestStatusUpdateEmail({
                customerName: name,
                requestId: params.requestId,
                newStatus: params.status,
                requestDescription: params.requestDescription,
                adminNote: params.adminNotes,
                dashboardUrl: params.dashboardUrl || `${appUrl}/dashboard/requests`,
                locale: params.locale,
            });
        }

        if (result && params.recipientEmail) {
            await sendEmailToClient(params.recipientEmail, result.subject, result.html).catch(() => {});
        }
    })();

    // ── WhatsApp ─────────────────────────────────────────────
    const whatsappPromise = (async () => {
        if (!params.recipientPhone) return;
        let templateKey: string;
        let templateParams: Record<string, any> = { customerName: name };

        switch (params.type) {
            case "quote_ready":
                templateKey = "quoteReadyToClient";
                templateParams = { ...templateParams, requestId: params.requestId, price: params.price, currency: params.currency, validUntil: params.validUntil };
                break;
            case "booking_confirmed":
                templateKey = "bookingConfirmedToClient";
                templateParams = { ...templateParams, bookingType: params.bookingType, scheduledAt: params.scheduledAt, meetingLink: params.meetingLink, meetingPassword: params.meetingPassword };
                break;
            case "booking_rejected":
            case "booking_rescheduled":
                templateKey = "bookingRejectedToClient";
                templateParams = { ...templateParams, bookingType: params.bookingType, reason: params.reason || (params.type === "booking_rescheduled" ? "Rescheduled by admin" : undefined) };
                break;
            case "consulting_update":
                templateKey = "consultingResponseToClient";
                templateParams = { ...templateParams, serviceTitle: params.serviceTitle, status: params.status, adminNotes: params.adminNotes };
                break;
            case "request_status_update":
                templateKey = "requestStatusUpdateToClient";
                templateParams = { ...templateParams, requestId: params.requestId, newStatus: params.status, adminNote: params.adminNotes, description: params.requestDescription };
                break;
            default:
                return;
        }

        await sendWhatsAppToClient(params.recipientPhone, templateKey, templateParams, params.locale).catch(() => {});
    })();

    // ── In-app Notification for client ───────────────────────
    const inAppPromise = (async () => {
        if (!params.userId) return;

        const titles: Record<string, { ar: string; en: string }> = {
            quote_ready: { ar: "عرض سعر جديد", en: "New Quote Ready" },
            booking_confirmed: { ar: "تم تأكيد الحجز", en: "Booking Confirmed" },
            booking_rejected: { ar: "لم يتم قبول الحجز", en: "Booking Not Confirmed" },
            booking_rescheduled: { ar: "تمت إعادة الجدولة", en: "Booking Rescheduled" },
            consulting_update: { ar: "تحديث على الاستشارة", en: "Consulting Update" },
            request_status_update: { ar: "تحديث حالة الطلب", en: "Request Status Update" },
        };
        const t = titles[params.type];
        const messages: Record<string, { ar: string; en: string }> = {
            quote_ready: { ar: `عرض سعر جديد جاهز للطلب ${params.requestId || ""}`, en: `New quote ready for request ${params.requestId || ""}` },
            booking_confirmed: { ar: `تم تأكيد حجز ${params.bookingType || ""}`, en: `Your ${params.bookingType || ""} booking has been confirmed` },
            booking_rejected: { ar: `لم يتم قبول حجز ${params.bookingType || ""}`, en: `Your ${params.bookingType || ""} booking was not confirmed` },
            booking_rescheduled: { ar: `تمت إعادة جدولة حجز ${params.bookingType || ""}`, en: `Your ${params.bookingType || ""} booking has been rescheduled` },
            consulting_update: { ar: `تحديث على طلب استشارة ${params.serviceTitle || ""}`, en: `Update on ${params.serviceTitle || ""} consulting request` },
            request_status_update: { ar: `طلبك ${params.requestId || ""} أصبح الآن ${params.status || ""}`, en: `Your request ${params.requestId || ""} is now ${params.status || ""}` },
        };
        const m = messages[params.type];

        await prisma.notification.create({
            data: {
                userId: params.userId,
                title: isAr ? t.ar : t.en,
                message: isAr ? m.ar : m.en,
                type: params.type.toUpperCase(),
            },
        }).catch(() => {});
    })();

    await Promise.allSettled([emailPromise, whatsappPromise, inAppPromise]);
}

