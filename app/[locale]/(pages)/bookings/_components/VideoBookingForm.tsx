"use client";

// app/[locale]/(pages)/bookings/_components/VideoBookingForm.tsx

import { useState, useTransition, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle, Lock, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitVideoBooking } from "../actions";
import { BookingType } from "@prisma/client";

interface Props {
  isAr: boolean;
  locale: "ar" | "en";
}

const BOOKING_TYPES = [
  { value: BookingType.MARKET, icon: "🏪", labelEn: "Market Tour", labelAr: "جولة سوق" },
  { value: BookingType.FACTORY, icon: "🏭", labelEn: "Factory Visit", labelAr: "زيارة مصنع" },
  { value: BookingType.CUSTOM, icon: "💼", labelEn: "Custom Consultation", labelAr: "استشارة مخصصة" },
];

export function VideoBookingForm({ isAr, locale }: Props) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    bookingType: BookingType;
    requestNotes: string;
    preferredDate: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    bookingType: BookingType.MARKET,
    requestNotes: "",
    preferredDate: "",
  });

  // Pre-fill name + email from Clerk when loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const name = user.fullName ?? "";
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      setForm((p) => ({
        ...p,
        fullName: p.fullName || name,
        email: p.email || email,
      }));
    }
  }, [isLoaded, isSignedIn, user]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const isGuest = isLoaded && !isSignedIn;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.requestNotes.trim()) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    if (isGuest && !form.phone.trim()) {
      toast.error(isAr ? "رقم الهاتف مطلوب للزوار" : "Phone number is required for guest submissions");
      return;
    }

    startTransition(async () => {
      const result = await submitVideoBooking({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        bookingType: form.bookingType,
        requestNotes: form.requestNotes,
        preferredDate: form.preferredDate || undefined,
        locale,
      });

      if (result.success) {
        setSent(true);
        toast.success(isAr ? "تم إرسال طلب الحجز بنجاح!" : "Booking request submitted successfully!");
      } else {
        toast.error(result.error);
      }
    });
  };

  // ── Success state ────────────────────────────────────────
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center justify-center gap-6 py-20 px-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent text-center overflow-hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.03] via-transparent to-violet-500/[0.03] pointer-events-none" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <motion.div
            className="absolute -inset-3 rounded-full bg-emerald-500/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>
        <div className="space-y-2 relative">
          <h3 className="text-2xl font-bold text-foreground">
            {isAr ? "تم إرسال طلبك!" : "Booking request sent!"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            {isAr
              ? "شكراً لك. سنتواصل معك قريباً لتأكيد موعد الجلسة."
              : "Thank you! We'll contact you soon to confirm the session time."}
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Input classes ────────────────────────────────────────
  const inputCls =
    "h-11 rounded-xl text-sm bg-background border-border/60 placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50 transition-all duration-200";
  const textareaCls =
    "rounded-xl text-sm bg-background border-border/60 placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50 resize-none transition-all duration-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-xl shadow-violet-500/[0.03]"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── Gradient Header ──────────────────────────────── */}
      <div className="relative px-6 py-6 bg-gradient-to-r from-[#7b57fc]/10 via-violet-500/8 to-transparent border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7b57fc] to-violet-600 flex items-center justify-center shadow-lg shadow-[#7b57fc]/25">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isAr ? "حجز جلسة فيديو" : "Book a Video Session"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "املأ التفاصيل أدناه وسنتواصل معك لتأكيد الموعد"
                : "Fill in the details and we'll contact you to confirm the time"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* ── Section: Contact Info ──────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
              {isAr ? "معلومات التواصل" : "Contact Info"}
            </span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70">
                {isAr ? "الاسم الكامل" : "Full name"} <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.fullName}
                onChange={set("fullName")}
                required
                className={inputCls}
                placeholder={isAr ? "اسمك الكامل" : "Your full name"}
              />
            </div>

            {/* Email — locked for signed-in users */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70">
                {isAr ? "البريد الإلكتروني" : "Email"} <span className="text-red-400">*</span>
                {isSignedIn && (
                  <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                    <Lock className="w-2.5 h-2.5" />
                    {isAr ? "حسابك" : "Verified"}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  disabled={isSignedIn}
                  className={`${inputCls} ${isSignedIn ? "bg-muted/40 text-muted-foreground/70 cursor-not-allowed border-emerald-500/20" : ""}`}
                  placeholder="you@example.com"
                />
                {isSignedIn && (
                  <div className="absolute end-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/70">
              {isAr ? "رقم الهاتف" : "Phone number"}
              {isGuest ? <span className="text-red-400"> *</span> : (
                <span className="text-muted-foreground/50 font-normal ml-1">
                  — {isAr ? "اختياري" : "optional"}
                </span>
              )}
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              className={inputCls}
              placeholder="+966 5xx xxx xxx"
            />
            {isGuest && (
              <p className="text-[10px] text-amber-500/80">
                {isAr ? "مطلوب للطلبات كزائر" : "Required for guest submissions"}
              </p>
            )}
          </div>
        </div>

        {/* ── Section: Session Details ────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
              {isAr ? "تفاصيل الجلسة" : "Session Details"}
            </span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          {/* Booking type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/70">
              {isAr ? "نوع الجلسة" : "Session type"} <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {BOOKING_TYPES.map(({ value, icon, labelEn, labelAr }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, bookingType: value as BookingType }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-200 text-xs font-semibold",
                    form.bookingType === value
                      ? "border-[#7b57fc]/40 bg-[#7b57fc]/5 text-violet-600 ring-2 ring-[#7b57fc]/20 shadow-md shadow-[#7b57fc]/10"
                      : "border-border/40 bg-background text-muted-foreground hover:border-border hover:bg-muted/20",
                  )}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="leading-tight">{isAr ? labelAr : labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/70">
              {isAr ? "التاريخ المفضل" : "Preferred date"}
              <span className="text-muted-foreground/50 font-normal ml-1">
                — {isAr ? "اختياري" : "optional"}
              </span>
            </Label>
            <Input
              type="date"
              value={form.preferredDate}
              onChange={set("preferredDate")}
              className={inputCls}
            />
          </div>

          {/* Request notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/70">
              {isAr ? "ملاحظات" : "Notes"} <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={form.requestNotes}
              onChange={set("requestNotes")}
              rows={4}
              required
              className={textareaCls}
              placeholder={isAr ? "ما الذي تريد مناقشته في الجلسة؟" : "What would you like to discuss in the session?"}
            />
            <p className="text-[10px] text-muted-foreground/50 text-right">
              {form.requestNotes.length} / 2000
            </p>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────── */}
        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            disabled={isPending}
            className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#7b57fc] to-violet-600 hover:from-[#6a48eb] hover:to-violet-700 text-white border-0 font-bold text-sm shadow-lg shadow-[#7b57fc]/25 hover:shadow-[#7b57fc]/40 transition-all duration-300 overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAr ? "جاري الإرسال…" : "Sending…"}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isAr ? "حجز الجلسة" : "Book session"}
                </>
              )}
            </span>
          </Button>

          <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed px-4">
            {isAr
              ? "بعد تأكيد طلبك، سنرسل لك رابط الجلسة وكلمة المرور عبر البريد الإلكتروني."
              : "After confirming, we'll send you the session link and password via email."}
          </p>
        </div>
      </form>
    </motion.div>
  );
}
