// lib/whatsapp.ts
// WhatsApp messaging service via Twilio
// Required .env vars:
//   TWILIO_ACCOUNT_SID=ACxxxxxx
//   TWILIO_AUTH_TOKEN=xxxxxxxx
//   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   ← your Twilio sandbox/approved number

import { prisma } from "@/lib/prisma";

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

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_WHATSAPP_FROM!; // whatsapp:+14155238886

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
};

// ─────────────────────────────────────────────
// Helper: get user phone from DB
// ─────────────────────────────────────────────
export async function getUserPhone(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
    });
    return user?.phone ?? null;
}