// lib/whatsapp.ts
// WhatsApp messaging service via Twilio.
// Credentials are read from IntegrationSetting (DB, admin-editable)
// with a process.env fallback — see lib/shipping/settings.ts.

import { prisma } from "@/lib/prisma";
import { getSetting, isTwilioEnabled } from "@/lib/shipping/settings";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SendWhatsAppParams {
    to: string;           // E.164 format: +966xxxxxxxxx
    message: string;
    templateKey?: string;
    userId?: string;
    requestId?: string;
    quoteId?: string;
    bookingId?: string;
}

interface WhatsAppResult {
    success: boolean;
    sid?: string;
    error?: string;
}

// ─────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<WhatsAppResult> {
    const { to, message, templateKey, userId, requestId, quoteId, bookingId } = params;

    const [accountSid, authToken, from] = await Promise.all([
        getSetting("TWILIO", "ACCOUNT_SID"),
        getSetting("TWILIO", "AUTH_TOKEN"),
        getSetting("TWILIO", "WHATSAPP_FROM"),
    ]);

    if (!accountSid || !authToken || !from) {
        const msg = "Twilio is not configured. Add credentials in Admin → Integrations.";
        console.warn("[WhatsApp]", msg);
        return { success: false, error: msg };
    }

    // Normalise phone: strip spaces, ensure + prefix, add whatsapp: prefix
    const normalised = to.replace(/\s+/g, "").replace(/^00/, "+");
    const toWhatsApp = normalised.startsWith("whatsapp:")
        ? normalised
        : `whatsapp:${normalised}`;

    let logId: string | null = null;

    // Create log entry first
    try {
        const log = await prisma.whatsAppLog.create({
            data: {
                to: normalised,
                message,
                templateKey,
                status: "pending",
                userId,
                requestId,
                quoteId,
                bookingId,
            },
        });
        logId = log.id;
    } catch (_) {
        // Non-fatal: continue even if logging fails
    }

    // Send via Twilio REST API (no SDK needed)
    try {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

        const body = new URLSearchParams({
            From: from,
            To: toWhatsApp,
            Body: message,
        });

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || "Twilio error");
        }

        // Update log to sent
        if (logId) {
            await prisma.whatsAppLog.update({
                where: { id: logId },
                data: { status: "sent", externalId: data.sid, sentAt: new Date() },
            });
        }

        return { success: true, sid: data.sid };
    } catch (err: any) {
        const errorMsg = err?.message || "Unknown error";

        if (logId) {
            await prisma.whatsAppLog.update({
                where: { id: logId },
                data: { status: "failed", error: errorMsg },
            });
        }

        console.error("[WhatsApp] Send failed:", errorMsg);
        return { success: false, error: errorMsg };
    }
}

// ─────────────────────────────────────────────
// Message Templates  (bilingual AR/EN)
// ─────────────────────────────────────────────
export const whatsAppTemplates = {
    // 1. After request submission
    requestSubmitted: (params: {
        customerName: string;
        requestId: string;
        productDesc: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, requestId, productDesc, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

✅ *تم استلام طلبك بنجاح!*

📋 رقم الطلب: \`${requestId}\`
📦 المنتج: ${productDesc}

سيقوم فريقنا بمراجعة طلبك وإرسال عرض السعر في أقرب وقت.

🛒 *متجرنا الإلكتروني*
نعمل في: 🇸🇦 السعودية | 🇾🇪 اليمن | 🇦🇪 الإمارات | 🇨🇳 الصين | 🇺🇸 أمريكا

شكراً لثقتك بنا 🙏`;
        }
        return `Hello ${customerName} 👋

✅ *Your request has been received!*

📋 Request ID: \`${requestId}\`
📦 Product: ${productDesc}

Our team will review your request and send a quote shortly.

We operate in: 🇸🇦 Saudi Arabia | 🇾🇪 Yemen | 🇦🇪 UAE | 🇨🇳 China | 🇺🇸 USA

Thank you for choosing us 🙏`;
    },

    // 2. First interaction / welcome
    firstInteraction: (params: { customerName: string; lang?: "ar" | "en" }) => {
        const { customerName, lang = "ar" } = params;
        if (lang === "ar") {
            return `أهلاً وسهلاً ${customerName}! 🎉

نرحب بك في منصتنا للاستيراد والتجارة.

🌟 *خدماتنا تشمل:*
• 📦 استيراد المنتجات من الصين وأمريكا
• 💼 الاستشارات التجارية
• 🚢 حسابات الشحن البحري والجوي
• 🤝 دعم العملاء على مدار الساعة

هل تحتاج مساعدة؟ تواصل معنا مباشرة عبر واتساب أو عبر المنصة.`;
        }
        return `Welcome ${customerName}! 🎉

We're glad to have you on our import & trade platform.

🌟 *Our services include:*
• 📦 Product sourcing from China & USA
• 💼 Business consulting
• 🚢 Air & sea freight calculations
• 🤝 24/7 customer support

Need help? Reach us via WhatsApp or through the platform.`;
    },

    // 3. Quote ready
    quoteReady: (params: {
        customerName: string;
        requestId: string;
        price: string;
        currency: string;
        validUntil?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, requestId, price, currency, validUntil, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

💰 *عرض سعر جاهز لك!*

📋 رقم الطلب: \`${requestId}\`
💵 السعر: *${price} ${currency}*
${validUntil ? `⏳ صالح حتى: ${validUntil}` : ""}

يرجى تسجيل الدخول إلى حسابك لمراجعة التفاصيل والموافقة على العرض.

🔗 رابط المنصة: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

شكراً 🙏`;
        }
        return `Hello ${customerName} 👋

💰 *Your quote is ready!*

📋 Request ID: \`${requestId}\`
💵 Price: *${price} ${currency}*
${validUntil ? `⏳ Valid until: ${validUntil}` : ""}

Please log in to your account to review and approve the quote.

🔗 Platform: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Thank you 🙏`;
    },

    // 5. Invoice ready (manual send from admin)
    invoiceReady: (params: {
        customerName: string;
        invoiceNumber: string;
        totalAmount: string;
        trackingCode?: string;
        trackingUrl?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, invoiceNumber, totalAmount, trackingCode, trackingUrl, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

🧾 *فاتورتك جاهزة!*

رقم الفاتورة: \`${invoiceNumber}\`
الإجمالي: *${totalAmount}*
${trackingCode ? `\n📦 رمز تتبع الشحنة: \`${trackingCode}\`` : ""}
${trackingUrl ? `🔗 تتبع شحنتك: ${trackingUrl}` : ""}

شكراً لثقتكم بنا 🙏`;
        }
        return `Hello ${customerName} 👋

🧾 *Your invoice is ready!*

Invoice #: \`${invoiceNumber}\`
Total: *${totalAmount}*
${trackingCode ? `\n📦 Tracking code: \`${trackingCode}\`` : ""}
${trackingUrl ? `🔗 Track your shipment: ${trackingUrl}` : ""}

Thank you for your business 🙏`;
    },

    // 6. Shipment status update
    shipmentStatusUpdate: (params: {
        customerName: string;
        trackingCode: string;
        statusLabel: string;
        trackingUrl?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, trackingCode, statusLabel, trackingUrl, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

📦 *تحديث على شحنتك*

رمز التتبع: \`${trackingCode}\`
الحالة: *${statusLabel}*
${trackingUrl ? `\n🔗 تتبع شحنتك: ${trackingUrl}` : ""}`;
        }
        return `Hello ${customerName} 👋

📦 *Shipment update*

Tracking code: \`${trackingCode}\`
Status: *${statusLabel}*
${trackingUrl ? `\n🔗 Track your shipment: ${trackingUrl}` : ""}`;
    },

    // 7. Support / general
    supportWelcome: (lang: "ar" | "en" = "ar") => {
        if (lang === "ar") {
            return `مرحباً! 👋 أنا مساعدك في خدمة العملاء.

كيف يمكنني مساعدتك اليوم؟
• 📦 استفسار عن طلب
• 💰 استفسار عن سعر
• 🚢 حساب تكلفة الشحن
• 💼 استشارة تجارية
• 🔄 أخرى

أرسل لنا رسالتك وسنرد في أقرب وقت ممكن ✅`;
        }
        return `Hello! 👋 I'm your customer support assistant.

How can I help you today?
• 📦 Order inquiry
• 💰 Price inquiry
• 🚢 Shipping cost calculation
• 💼 Business consultation
• 🔄 Other

Send us your message and we'll respond as soon as possible ✅`;
    },

    // ── 8. ADMIN NOTIFICATIONS ────────────────────────────────────
    adminNewConsultingRequest: (params: {
        guestName: string;
        guestEmail: string;
        serviceTitle: string;
        description: string;
        lang?: "ar" | "en";
    }) => {
        const { guestName, guestEmail, serviceTitle, description, lang = "ar" } = params;
        if (lang === "ar") {
            return `📩 *طلب استشارة جديد!*

👤 الاسم: ${guestName}
📧 البريد: ${guestEmail}
💼 الخدمة: ${serviceTitle}
📝 الوصف: ${description.slice(0, 150)}

🔗 راجع الطلب في لوحة التحكم.`;
        }
        return `📩 *New Consulting Request!*

👤 Name: ${guestName}
📧 Email: ${guestEmail}
💼 Service: ${serviceTitle}
📝 Description: ${description.slice(0, 150)}

🔗 Review the request in your admin dashboard.`;
    },

    adminNewProductRequest: (params: {
        guestName: string;
        guestEmail: string;
        productDesc: string;
        quantity: number;
        shippingCountry: string;
        lang?: "ar" | "en";
    }) => {
        const { guestName, guestEmail, productDesc, quantity, shippingCountry, lang = "ar" } = params;
        if (lang === "ar") {
            return `📦 *طلب منتج جديد!*

👤 الاسم: ${guestName}
📧 البريد: ${guestEmail}
📦 المنتج: ${productDesc}
🔢 الكمية: ${quantity}
🌍 بلد الشحن: ${shippingCountry}

🔗 راجع الطلب في لوحة التحكم.`;
        }
        return `📦 *New Product Request!*

👤 Name: ${guestName}
📧 Email: ${guestEmail}
📦 Product: ${productDesc}
🔢 Quantity: ${quantity}
🌍 Shipping to: ${shippingCountry}

🔗 Review the request in your admin dashboard.`;
    },

    adminNewBookingRequest: (params: {
        guestName: string;
        guestEmail: string;
        bookingType: string;
        notes: string;
        preferredDate?: string;
        lang?: "ar" | "en";
    }) => {
        const { guestName, guestEmail, bookingType, notes, preferredDate, lang = "ar" } = params;
        const dateLine = preferredDate ? `\n📅 الموعد المقترح: ${preferredDate}` : "";
        const dateLineEn = preferredDate ? `\n📅 Preferred date: ${preferredDate}` : "";
        if (lang === "ar") {
            return `🎥 *حجز مكالمة فيديو جديد!*

👤 الاسم: ${guestName}
📧 البريد: ${guestEmail}
🏷️ النوع: ${bookingType}
📝 الملاحظات: ${notes}${dateLine}

🔗 راجع الحجز في لوحة التحكم.`;
        }
        return `🎥 *New Video Call Booking!*

👤 Name: ${guestName}
📧 Email: ${guestEmail}
🏷️ Type: ${bookingType}
📝 Notes: ${notes}${dateLineEn}

🔗 Review the booking in your admin dashboard.`;
    },

    // ── 9. CLIENT NOTIFICATIONS (admin actions) ──────────────────
    quoteReadyToClient: (params: {
        customerName: string;
        requestId: string;
        price: string;
        currency: string;
        validUntil?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, requestId, price, currency, validUntil, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

💰 *عرض سعر جديد جاهز!*

📋 رقم الطلب: \`${requestId}\`
💵 السعر: *${price} ${currency}*
${validUntil ? `⏳ صالح حتى: ${validUntil}` : ""}

يرجى مراجعة العرض في حسابك:
🔗 ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests

شكراً لثقتك بنا 🙏`;
        }
        return `Hello ${customerName} 👋

💰 *New Quote Ready!*

📋 Request ID: \`${requestId}\`
💵 Price: *${price} ${currency}*
${validUntil ? `⏳ Valid until: ${validUntil}` : ""}

Please review your quote:
🔗 ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests

Thank you for choosing us 🙏`;
    },

    bookingConfirmedToClient: (params: {
        customerName: string;
        bookingType: string;
        scheduledAt?: string;
        meetingLink?: string;
        meetingPassword?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, bookingType, scheduledAt, meetingLink, meetingPassword, lang = "ar" } = params;
        const linkLine = meetingLink ? `\n🔗 رابط الاجتماع: ${meetingLink}` : "";
        const linkLineEn = meetingLink ? `\n🔗 Meeting link: ${meetingLink}` : "";
        const passLine = meetingPassword ? `\n🔑 كلمة المرور: ${meetingPassword}` : "";
        const passLineEn = meetingPassword ? `\n🔑 Password: ${meetingPassword}` : "";
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

✅ *تم تأكيد حجز مكالمة الفيديو!*

🏷️ النوع: ${bookingType}
${scheduledAt ? `📅 الموعد: ${scheduledAt}` : ""}${linkLine}${passLine}

نتطلع للقائك قريباً 🙏`;
        }
        return `Hello ${customerName} 👋

✅ *Video Call Confirmed!*

🏷️ Type: ${bookingType}
${scheduledAt ? `📅 When: ${scheduledAt}` : ""}${linkLineEn}${passLineEn}

Looking forward to speaking with you 🙏`;
    },

    bookingRejectedToClient: (params: {
        customerName: string;
        bookingType: string;
        reason?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, bookingType, reason, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

❌ *نعتذر، لم يتم قبول حجز المكالمة.*

🏷️ النوع: ${bookingType}
${reason ? `📝 السبب: ${reason}` : ""}

يمكنك حجز موعد آخر من خلال حسابك.
شكراً لتفهمك 🙏`;
        }
        return `Hello ${customerName} 👋

❌ *Booking Not Confirmed*

🏷️ Type: ${bookingType}
${reason ? `📝 Reason: ${reason}` : ""}

You can book another time from your account.
Thank you for understanding 🙏`;
    },

    consultingResponseToClient: (params: {
        customerName: string;
        serviceTitle: string;
        status: string;
        adminNotes?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, serviceTitle, status, adminNotes, lang = "ar" } = params;
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

📋 *تحديث على طلب الاستشارة*

💼 الخدمة: ${serviceTitle}
📊 الحالة: ${status}
${adminNotes ? `📝 ملاحظات: ${adminNotes}` : ""}

شكراً لتواصلك معنا 🙏`;
        }
        return `Hello ${customerName} 👋

📋 *Consulting Request Update*

💼 Service: ${serviceTitle}
📊 Status: ${status}
${adminNotes ? `📝 Notes: ${adminNotes}` : ""}

Thank you for reaching out 🙏`;
    },

    // 10. Request status update to client
    requestStatusUpdateToClient: (params: {
        customerName: string;
        requestId: string;
        newStatus: string;
        adminNote?: string;
        description?: string;
        lang?: "ar" | "en";
    }) => {
        const { customerName, requestId, newStatus, adminNote, description, lang = "ar" } = params;
        const statusLabel = newStatus.replace(/_/g, " ");
        if (lang === "ar") {
            return `مرحباً ${customerName} 👋

📋 *تحديث حالة الطلب*

🔢 رقم الطلب: \`${requestId}\`
${description ? `📦 المنتج: ${description}` : ""}
📊 الحالة: *${statusLabel}*
${adminNote ? `📝 ملاحظة: ${adminNote}` : ""}

🔗 تابع طلبك: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests

شكراً لثقتك بنا 🙏`;
        }
        return `Hello ${customerName} 👋

📋 *Request Status Update*

🔢 Request ID: \`${requestId}\`
${description ? `📦 Product: ${description}` : ""}
📊 Status: *${statusLabel}*
${adminNote ? `📝 Note: ${adminNote}` : ""}

🔗 View your request: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests

Thank you for choosing us 🙏`;
    },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Get user phone from DB. */
export async function getUserPhone(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
    });
    return user?.phone ?? null;
}

/** Get all ADMIN users who have a phone number set. */
export async function getAdminPhoneNumbers(): Promise<Array<{ id: string; phone: string; email: string }>> {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isDeleted: false, phone: { not: null } },
        select: { id: true, phone: true, email: true },
    });
    return admins.filter((a) => a.phone) as Array<{ id: string; phone: string; email: string }>;
}

/** Send a WhatsApp message to all admins. Returns results per admin. */
export async function sendWhatsAppToAdmins(
    templateKey: string,
    params: Record<string, any>,
    locale: "ar" | "en" = "ar",
): Promise<void> {
    const enabled = await isTwilioEnabled();
    if (!enabled) return;

    const admins = await getAdminPhoneNumbers();
    const templateFn = (whatsAppTemplates as any)[templateKey];
    if (!templateFn) {
        console.warn(`[WhatsApp] Unknown template: ${templateKey}`);
        return;
    }

    await Promise.allSettled(
        admins.map((admin) =>
            sendWhatsApp({
                to: admin.phone!,
                message: templateFn({ ...params, lang: locale }),
                templateKey,
            }),
        ),
    );
}

/** Send a WhatsApp message to a single client/guest. */
export async function sendWhatsAppToClient(
    phone: string,
    templateKey: string,
    params: Record<string, any>,
    locale: "ar" | "en" = "ar",
): Promise<WhatsAppResult> {
    if (!phone) return { success: false, error: "No phone number provided" };

    const enabled = await isTwilioEnabled();
    if (!enabled) return { success: false, error: "Twilio is not enabled" };

    const templateFn = (whatsAppTemplates as any)[templateKey];
    if (!templateFn) {
        return { success: false, error: `Unknown template: ${templateKey}` };
    }

    return sendWhatsApp({
        to: phone,
        message: templateFn({ ...params, lang: locale }),
        templateKey,
    });
}