"use client";

// app/[locale]/_components/IpadPreview.tsx

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Eye,
  MessageSquare,
  Flame,
  Zap,
  Package,
  Calendar,
  CheckCircle2,
  Snowflake,
  ShoppingBag,
  Search,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { getTrendingProducts } from "@/app/[locale]/(pages)/products/actions";
import { Button } from "@/components/ui/button";

const DESIGN_W = 900;
const DESIGN_H = 560;

type Product = Awaited<ReturnType<typeof getTrendingProducts>>[number];

/* ─────────────────────────────────────────────────────────────
   Trend Badge
───────────────────────────────────────────────────────────── */
function TrendBadge({
  score,
  isFeatured,
  label,
}: {
  score: number;
  isFeatured: boolean;
  label: string;
}) {
  const base =
    "inline-flex items-center gap-[3px] px-[6px] py-[2px] rounded-full font-bold border text-[9px]";
  if (isFeatured)
    return (
      <span className={`${base} bg-amber-100 text-amber-700 border-amber-200`}>
        <Star size={7} className="fill-amber-500 text-amber-500" />
        {label}
      </span>
    );
  if (score >= 80)
    return (
      <span className={`${base} bg-rose-100 text-rose-600 border-rose-200`}>
        <Flame size={7} />
        Hot
      </span>
    );
  if (score >= 40)
    return (
      <span
        className={`${base} bg-emerald-100 text-emerald-700 border-emerald-200`}
      >
        <TrendingUp size={7} />
        Trending
      </span>
    );
  return (
    <span className={`${base} bg-sky-100 text-sky-700 border-sky-200`}>
      <Zap size={7} />
      New
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Product Card
───────────────────────────────────────────────────────────── */
function ProductCard({
  product,
  isRTL,
  currency,
  featuredLabel,
  index,
}: {
  product: Product;
  isRTL: boolean;
  currency: string;
  featuredLabel: string;
  index: number;
}) {
  const name =
    (isRTL ? product.nameAr || product.name : product.name) || product.name;
  const image = product.images?.[0]?.url;
  const score = product.trendScore ?? 0;
  const FALLBACK_IMAGE =
    "https://i.pinimg.com/1200x/9a/a6/c7/9aa6c71c12a4e421d88f0331dcc152ef.jpg";

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col w-full h-full">
      {/* image */}
      <div
        className={`relative shrink-0 bg-linear-to-br overflow-hidden`}
        style={{ height: 80 }}
      >
        <img
          src={image || FALLBACK_IMAGE}
          alt={name}
          className="w-full h-full object-cover"
          style={{ objectFit: "contain" }}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = FALLBACK_IMAGE;
          }}
        />

        {/* badge */}
        <div className="absolute top-1.5 left-1.5">
          <TrendBadge
            score={score}
            isFeatured={product.isFeatured}
            label={featuredLabel}
          />
        </div>

        {score > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.75 bg-black/50 backdrop-blur-sm text-white rounded-full px-1.5 py-0.5">
            <TrendingUp size={7} />
            <span className="text-[8px] font-bold">{score}</span>
          </div>
        )}
      </div>

      {/* info */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-[11px] font-bold text-gray-900 leading-snug line-clamp-1">
          {name}
        </p>

        {product.estimatedPrice != null && (
          <p className="text-[12px] font-black text-gray-900 leading-none">
            {Number(product.estimatedPrice).toLocaleString()}
            <span className="text-[8px] text-gray-400 font-medium ml-0.5">
              {currency}
            </span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-1 border-t border-gray-50">
          {product.viewCount > 0 && (
            <span className="flex items-center gap-.75 text-[8px] text-gray-400">
              <Eye size={7} />
              {product.viewCount}
            </span>
          )}

          {product.inquiryCount > 0 && (
            <span className="flex items-center gap-0.75 text-[8px] text-gray-400">
              <MessageSquare size={7} />
              {product.inquiryCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Calendar Widget
───────────────────────────────────────────────────────────── */
function CalendarWidget({
  weekdays,
  monthNames,
  timeSlots,
  confirmBooking,
  bookingConfirmed,
  bookingDesc,
  consultHint,
  isRTL,
}: {
  weekdays: string[];
  monthNames: string[];
  timeSlots: string[];
  confirmBooking: string;
  bookingConfirmed: string;
  bookingDesc: string;
  consultHint: string;
  isRTL: boolean;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const now = new Date();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  const todayNum = now.getDate();

  const confirm = () => {
    if (!selectedDay || !selectedTime) return;
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setSelectedDay(null);
      setSelectedTime(null);
    }, 3500);
  };

  return (
    <div
      className="bg-white rounded-2xl flex flex-col gap-2.5 h-full shadow-sm"
      style={{ padding: 12 }}
    >
      {/* month nav */}
      <div className="flex items-center justify-between">
        <Button
          variant={"ghost"}
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={12} className="text-gray-400" />
        </Button>
        <span className="text-[11px] font-bold text-gray-800">
          {monthNames[month]} {year}
        </span>
        <Button
          variant={"ghost"}
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={12} className="text-gray-400" />
        </Button>
      </div>

      {/* weekdays — always render LTR order; RTL is handled by dir on the canvas root */}
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((d) => (
          <div key={d} className="text-[8px] text-gray-400 font-semibold">
            {d.slice(0, 2)}
          </div>
        ))}
      </div>

      {/* days */}
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`e${i}`} />
          ) : (
            <button
              key={day}
              disabled={isCurrentMonth && day < todayNum}
              onClick={() =>
                !(isCurrentMonth && day < todayNum) && setSelectedDay(day)
              }
              className={`mx-auto w-5.5 h-5.5 rounded-full text-[9px] font-semibold flex items-center justify-center transition-all
                ${
                  isCurrentMonth && day < todayNum
                    ? "text-gray-200 cursor-not-allowed"
                    : selectedDay === day
                      ? "bg-violet-600 text-white shadow shadow-violet-200"
                      : isCurrentMonth && day === todayNum
                        ? "ring-1 ring-violet-400 text-violet-600"
                        : "text-gray-700 hover:bg-violet-50"
                }`}
            >
              {day}
            </button>
          ),
        )}
      </div>

      {/* time slots */}
      <div className="flex flex-wrap gap-1">
        {timeSlots.map((time) => (
          <Button
            variant={"ghost"}
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`px-1.75 py-0.75 rounded-lg text-[9px] font-semibold border transition-all
              ${selectedTime === time ? "bg-violet-600 text-white border-violet-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300"}`}
          >
            {time}
          </Button>
        ))}
      </div>

      {/* confirm */}
      <AnimatePresence mode="wait">
        {confirmed ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1 bg-emerald-50 rounded-xl border border-emerald-200"
            style={{ padding: "10px 8px" }}
          >
            <CheckCircle2 size={16} className="text-emerald-500" />
            <p className="text-[10px] font-bold text-emerald-700">
              {bookingConfirmed}
            </p>
            <p className="text-[8px] text-emerald-500 text-center leading-relaxed">
              {bookingDesc}
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={confirm}
            className={`w-full rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all
              ${selectedDay && selectedTime ? "bg-violet-600 text-white hover:bg-violet-700 shadow shadow-violet-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            style={{ paddingTop: 8, paddingBottom: 8 }}
          >
            <Calendar size={10} />
            {confirmBooking}
          </motion.button>
        )}
      </AnimatePresence>

      {/* hint */}
      <div
        className="rounded-xl bg-violet-50 border border-violet-100 flex items-start gap-1.5 mt-auto"
        style={{ padding: "8px 8px" }}
      >
        <MessageSquare size={10} className="text-violet-400 shrink-0 mt-px" />
        <p className="text-[8px] text-violet-700 leading-relaxed">
          {consultHint}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   How It Works Strip
───────────────────────────────────────────────────────────── */
function HowItWorksStrip({
  steps,
  isRTL,
}: {
  steps: string[];
  isRTL: boolean;
}) {
  const icons = [
    <Search key="s" size={8} />,
    <Package key="p" size={8} />,
    <MessageSquare key="m" size={8} />,
    <Calendar key="c" size={8} />,
  ];
  const Chevron = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className="flex items-center gap-1 bg-violet-50 rounded-md"
            style={{ padding: "3px 6px" }}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">
              {i + 1}
            </span>
            <span className="text-violet-600 shrink-0">{icons[i]}</span>
            <span className="text-[8px] text-violet-800 font-semibold whitespace-nowrap">
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <Chevron size={8} className="text-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Floating decorations
───────────────────────────────────────────────────────────── */
function FloatingPill({
  text,
  color,
  top,
  left,
  right,
  bottom,
}: {
  text: string;
  color: "green" | "blue";
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  return (
    <div
      className={`absolute px-4 py-2 rounded-full text-white font-bold whitespace-nowrap select-none pointer-events-none z-20
        ${color === "green" ? "bg-emerald-500" : "bg-blue-500"}`}
      style={{
        fontSize: 13,
        top,
        left,
        right,
        bottom,
        boxShadow:
          color === "green"
            ? "0 8px 24px rgba(16,185,129,0.4)"
            : "0 8px 24px rgba(59,130,246,0.4)",
      }}
    >
      {text}
    </div>
  );
}

function PayBadge({
  label,
  top,
  left,
  right,
}: {
  label: string;
  top?: number;
  left?: number;
  right?: number;
}) {
  return (
    <div
      className="absolute flex items-center gap-2 bg-white rounded-full border border-gray-100 select-none pointer-events-none z-20"
      style={{
        fontSize: 12,
        top,
        left,
        right,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        padding: "6px 12px",
      }}
    >
      <span className="font-bold text-gray-800">{label}</span>
      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function IpadPreview() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isRTL = isAr;

  // ── translations ──
  const storeTitle = isAr ? "مصادر المنتجات" : "Products Sourcing";
  const featuredLabel = isAr ? "مميز" : "Featured";
  const step1 = isAr ? "تصفح" : "Browse";
  const step2 = isAr ? "اطلب" : "Request";
  const step3 = isAr ? "أسعار" : "Get Quotes";
  const step4 = isAr ? "استشارة" : "Book Call";
  const steps = [step1, step2, step3, step4];
  const weekdays = isAr
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = isAr
    ? [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ]
    : [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  const timeSlots = isAr
    ? ["١٠:٠٠ص", "١١:٣٠ص", "٠١:٠٠م", "٠٣:٠٠م", "٠٤:٣٠م"]
    : ["10:00am", "11:30am", "01:00pm", "03:00pm", "04:30pm"];
  const confirmBooking = isAr ? "تأكيد الحجز" : "Confirm Booking";
  const bookingConfirmed = isAr ? "تم الحجز!" : "Booking Confirmed!";
  const bookingDesc = isAr
    ? "سيتواصل معك خبير الاستيراد قريباً"
    : "Our sourcing expert will contact you shortly";
  const noProducts = isAr ? "لا توجد منتجات" : "No products yet";
  const currency = isAr ? "ر.س" : "SAR";
  const trendingLabel = isAr ? "المنتجات الرائجة" : "Trending Products";
  const sourcedFrom = isAr ? "مصادر · الصين وآسيا" : "Sourced · China & Asia";
  const appointmentSystem = isAr ? "حجز المواعيد" : "Appointment Booking";
  const onlineStore = isAr ? "مصادر المنتجات" : "Products Sourcing";
  const consultHint = isAr
    ? "احجز مكالمة فيديو مع خبراء الاستيراد لمناقشة طلباتك وعروض الأسعار."
    : "Book a video call with our sourcing experts to discuss your requests & quotes.";

  // ── data fetching ──
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTrendingProducts(6) // fetch 6 products to fill 2 rows of 3 columns
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Scale canvas to fit wrapper — same as object-fit: contain */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const sw = el.clientWidth / DESIGN_W;
      const sh = el.clientHeight / DESIGN_H;
      setScale(Math.min(sw, sh));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full" style={{ padding: 0 }}>
      {/* Responsive horizontal padding wrapper — gives badges room on mobile */}
      <div className="w-full px-[7%] sm:px-[8%] md:px-[7%] lg:px-[7%] xl:px-0">
        {/* aspect-ratio shell */}
        <div
          ref={wrapperRef}
          className="relative w-full"
          style={{ aspectRatio: `${DESIGN_W} / ${DESIGN_H}` }}
        >
          {/* Fixed-size canvas scaled to fill the wrapper */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: DESIGN_W,
              height: DESIGN_H,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}
          >
            {/*
              All floating badges live here — in canvas coordinates,
              NOT inside the dir="rtl" subtree, so they never flip.
            */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Left pill — vertically centred */}
              <FloatingPill
                text={appointmentSystem}
                color="green"
                top={DESIGN_H / 2 - 20}
                left={-8}
              />
              {/* Right pay badges */}
              <PayBadge label="Master Card ✓" top={100} right={-4} />
              <PayBadge label="VISA Card ✓" top={148} right={-4} />
              {/* Bottom-right pill */}
              <FloatingPill
                text={onlineStore}
                color="blue"
                bottom={80}
                right={-8}
              />
            </div>

            {/* iPad shell — centred in the canvas */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: 750,
                  height: 500,
                  borderRadius: 36,
                  background: "#0f172a",
                  padding: 9,
                  boxShadow:
                    "0 32px 72px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.07) inset, 0 2px 0 rgba(255,255,255,0.09) inset",
                  flexShrink: 0,
                }}
              >
                {/* Screen — dir is set here so all children flip correctly for RTL */}
                <div
                  dir={isRTL ? "rtl" : "ltr"}
                  className="flex flex-col overflow-hidden bg-[#f8f8fb]"
                  style={{ width: "100%", height: "100%", borderRadius: 28 }}
                >
                  {/* Navbar */}
                  <div
                    className="flex items-center justify-between bg-white border-b border-gray-100 shrink-0"
                    style={{ padding: "8px 16px", gap: 8 }}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
                        <ShoppingCart size={13} className="text-white" />
                      </div>
                      <span className="text-[12px] font-black text-gray-900 tracking-tight">
                        {storeTitle}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        marginLeft: 12,
                        marginRight: 12,
                      }}
                    >
                      <HowItWorksStrip steps={steps} isRTL={isRTL} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant={"ghost"}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-violet-100 transition-colors"
                      >
                        <Search size={12} className="text-gray-500" />
                      </Button>
                      <Button
                        variant={"ghost"}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-violet-100 transition-colors"
                      >
                        <ShoppingBag size={12} className="text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div
                    className="flex gap-3 flex-1 min-h-0"
                    style={{ padding: "12px 14px" }}
                  >
                    {/* Calendar */}
                    <div style={{ width: 192, flexShrink: 0 }}>
                      <CalendarWidget
                        weekdays={weekdays}
                        monthNames={monthNames}
                        timeSlots={timeSlots}
                        confirmBooking={confirmBooking}
                        bookingConfirmed={bookingConfirmed}
                        bookingDesc={bookingDesc}
                        consultHint={consultHint}
                        isRTL={isRTL}
                      />
                    </div>

                    {/* Products */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                      {/* section header */}
                      <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-violet-600" />
                          <span className="text-[12px] font-black text-gray-900">
                            {trendingLabel}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400">
                          {sourcedFrom}
                        </span>
                      </div>

                      {/* 3‑column product grid */}
                      <div
                        className="grid gap-2.5 flex-1 min-h-0"
                        style={{
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gridAutoRows: "minmax(0, 1fr)",
                        }}
                      >
                        {loading ? (
                          // 6 placeholders for 2 rows of 3 columns
                          Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className="rounded-xl bg-gray-200 animate-pulse"
                            />
                          ))
                        ) : products.length === 0 ? (
                          <div className="col-span-3 row-span-2 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Package size={28} className="text-gray-300" />
                            <p className="text-xs">{noProducts}</p>
                          </div>
                        ) : (
                          products.slice(0, 6).map((p, i) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.07 * i }}
                              className="min-h-0"
                            >
                              <ProductCard
                                product={p}
                                isRTL={isRTL}
                                currency={currency}
                                featuredLabel={featuredLabel}
                                index={i}
                              />
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}