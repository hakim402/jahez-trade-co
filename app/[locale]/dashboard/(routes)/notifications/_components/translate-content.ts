// app/[locale]/dashboard/(routes)/notifications/_components/translate-content.ts

const REQUEST_STATUS_AR: Record<string, string> = {
    SUBMITTED: "مُرسَل",
    IN_REVIEW: "قيد المراجعة",
    QUOTED: "تم تسعيره",
    APPROVED: "مقبول",
    REJECTED: "مرفوض",
    IN_PRODUCTION: "قيد الإنتاج",
    SHIPPED: "تم الشحن",
    COMPLETED: "مكتمل",
}

const TITLE_PATTERNS_AR: { pattern: RegExp; replace: (m: RegExpMatchArray) => string }[] = [
    { pattern: /^Request status updated to ([A-Z_]+)$/, replace: (m) => `تم تحديث حالة الطلب إلى: ${REQUEST_STATUS_AR[m[1]] ?? m[1]}` },
    { pattern: /^New Product Request$/, replace: () => "طلب منتج جديد" },
    { pattern: /^Quote Accepted$/, replace: () => "تم قبول عرض السعر" },
    { pattern: /^Quote Rejected$/, replace: () => "تم رفض عرض السعر" },
    { pattern: /^New Consulting Request$/, replace: () => "طلب استشارة جديد" },
    { pattern: /^Service Request: (.+)$/, replace: (m) => `طلب خدمة: ${m[1]}` },
    { pattern: /^New Video Booking Request$/, replace: () => "طلب حجز مكالمة جديد" },
    { pattern: /^Video Call Scheduled$/, replace: () => "تمت جدولة مكالمة الفيديو" },
    { pattern: /^Video Call Rescheduled$/, replace: () => "تمت إعادة جدولة مكالمة الفيديو" },
    { pattern: /^Booking Confirmed$/, replace: () => "تم تأكيد الحجز" },
    { pattern: /^Booking Cancelled$/, replace: () => "تم إلغاء الحجز" },
    { pattern: /^Video Call Completed$/, replace: () => "اكتملت مكالمة الفيديو" },
    { pattern: /^Missed Video Call$/, replace: () => "مكالمة الفيديو الفائتة" },
]

const MESSAGE_PATTERNS_AR: { pattern: RegExp; replace: (m: RegExpMatchArray) => string }[] = [
    { pattern: /^Your product request has been moved to ([A-Z_]+)\.$/, replace: (m) => `تم تحديث طلب منتجك إلى: ${REQUEST_STATUS_AR[m[1]] ?? m[1]}.` },
    { pattern: /^Your video call has been scheduled for (.+)\. Please confirm\.$/, replace: (m) => `تمت جدولة مكالمتك المرئية في ${m[1]}. يرجى التأكيد.` },
    { pattern: /^Your video call has been rescheduled to (.+)\. Please confirm the new time\.$/, replace: (m) => `تمت إعادة جدولة مكالمتك المرئية إلى ${m[1]}. يرجى تأكيد الوقت الجديد.` },
    { pattern: /^A client has confirmed their video call booking\.$/, replace: () => "أكّد العميل حجز مكالمته المرئية." },
    { pattern: /^A client has cancelled their video call booking\.$/, replace: () => "ألغى العميل حجز مكالمته المرئية." },
    { pattern: /^Your video call session has been completed\.$/, replace: () => "اكتملت جلسة مكالمتك المرئية." },
    { pattern: /^You missed your scheduled video call\. Please contact us to reschedule\.$/, replace: () => "لقد فاتتك مكالمة الفيديو المجدولة. يرجى التواصل معنا لإعادة الجدولة." },
    { pattern: /^(.+) submitted a consulting request: (.+)$/, replace: (m) => `قدّم ${m[1]} طلب استشارة: ${m[2]}` },
    { pattern: /^(.+) requested the "(.+)" consulting service\.$/, replace: (m) => `طلب ${m[1]} خدمة الاستشارة: "${m[2]}".` },
    { pattern: /^(.+) accepted a quote of (.+) ([A-Z]+)\.$/, replace: (m) => `قبل ${m[1]} عرض السعر بقيمة ${m[2]} ${m[3]}.` },
    { pattern: /^(.+) rejected a quote for request #(.+)\.$/, replace: (m) => `رفض ${m[1]} عرض السعر للطلب #${m[2]}.` },
    { pattern: /^(.+) submitted a new request: (.+)$/, replace: (m) => `قدّم ${m[1]} طلبًا جديدًا: ${m[2]}` },
    { pattern: /^Your video call has been cancelled\.(.*)$/, replace: (m) => `تم إلغاء مكالمتك المرئية.${m[1] ? " " + m[1] : ""}` },
]

export function translateContent(
    title: string,
    message: string,
    isAr: boolean,
): { title: string; message: string } {
    if (!isAr) return { title, message }

    let out = { title, message }

    for (const { pattern, replace } of TITLE_PATTERNS_AR) {
        const m = title.match(pattern)
        if (m) { out = { ...out, title: replace(m) }; break }
    }
    for (const { pattern, replace } of MESSAGE_PATTERNS_AR) {
        const m = message.match(pattern)
        if (m) { out = { ...out, message: replace(m) }; break }
    }

    return out
}