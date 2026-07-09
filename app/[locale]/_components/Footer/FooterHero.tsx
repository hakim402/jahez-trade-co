"use client";

// app/[locale]/_components/FooterHero.tsx

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView, animate, useAnimationFrame } from "motion/react";
import { useLocale } from "next-intl";
import {
  Package,
  Video,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  FileText,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(to: number, duration = 1.4, suffix = "") {
  // Initialize with the real final value (not "0") so the server-rendered
  // HTML always contains the correct number — Googlebot doesn't reliably
  // trigger scroll-based IntersectionObserver animations, so it was seeing
  // literal "0" for every stat. The count-up animation still plays for
  // users once the section scrolls into view; only the initial/SSR state
  // changes.
  const [display, setDisplay] = useState(
    () => Math.round(to).toLocaleString() + suffix,
  );
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate(v) {
        setDisplay(Math.round(v).toLocaleString() + suffix);
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, suffix]);

  return { ref, display };
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({
  icon: Icon,
  label,
  color,
  className,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-white dark:bg-card rounded-full pl-2 pr-3.5 py-1.5",
        "shadow-lg shadow-black/8 border border-border/50",
        className,
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          color,
        )}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating request card mockup
// ─────────────────────────────────────────────────────────────────────────────
function RequestMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute top-4 right-0 w-56 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3.5 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
          <Package className="w-3.5 h-3.5 text-[#7b57fc]" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">
            {isAr ? "طلب جديد" : "New Request"}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {isAr ? "قبل دقيقتين" : "2 mins ago"}
          </p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          {isAr ? "مقتبس" : "Quoted"}
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground mb-2 truncate flex items-center gap-1">
        <CN className="w-3.5 h-3.5 inline-block" />
        {isAr
          ? "سماعات أذن لاسلكية - الكمية 500"
          : "Wireless Earbuds — Qty 500"}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {isAr ? "تقدير" : "Estimate"}
        </span>
        <span className="text-sm font-bold text-[#7b57fc]">$2,450</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating booking card mockup
// ─────────────────────────────────────────────────────────────────────────────
function BookingMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute bottom-16 left-0 w-52 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3.5 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">
            {isAr ? "زيارة المصنع" : "Factory Visit"}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {isAr ? "مؤكد ✓" : "Confirmed ✓"}
          </p>
        </div>
      </div>
      <div className="bg-muted/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />{" "}
          {isAr ? "السبت · 10:00 ص" : "Sat · 10:00 AM"}
        </span>
        <span className="text-[9px] text-muted-foreground flex text-center justify-center gap-2">
          <Video className="text-color size-3.5" /> Zoom
        </span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating quote card
// ─────────────────────────────────────────────────────────────────────────────
function QuoteMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -0.5 }}
      animate={{ opacity: 1, y: 0, rotate: -0.5 }}
      transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute bottom-4 right-4 w-48 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <FileText className="w-3 h-3 text-[#7b57fc]" />
        <span className="text-[10px] font-bold text-foreground">
          {isAr ? "عرض السعر جاهز" : "Quote Ready"}
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <p className="text-[9px] text-muted-foreground mb-1.5 truncate">
        {isAr ? "شريط LED ذكي × 200" : "Smart LED Strip × 200"}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant={"ghost"}
          className="flex-1 text-[9px] font-bold py-1 rounded-lg bg-[#7b57fc] text-white"
        >
          {isAr ? "قبول" : "Accept"}
        </Button>
        <Button
          variant={"ghost"}
          className="flex-1 text-[9px] font-bold py-1 rounded-lg bg-muted text-muted-foreground"
        >
          {isAr ? "رفض" : "Decline"}
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data packet — animated dot traveling along an SVG path
// ─────────────────────────────────────────────────────────────────────────────
function DataPacket({
  pathId,
  delay,
  duration,
  color,
  reverse,
}: {
  pathId: string;
  delay: number;
  duration: number;
  color: string;
  reverse?: boolean;
}) {
  return (
    <circle r="3" fill={color} filter="url(#glow)">
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        keyPoints={reverse ? "1;0" : "0;1"}
        keyTimes="0;1"
        calcMode="linear"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced OrbitGraphic — SVG arcs, glows, data packets, multi-ring depth
// ─────────────────────────────────────────────────────────────────────────────
function OrbitGraphic({ isAr }: { isAr: boolean }) {
  const SIZE = 340;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  // Country definitions with precise orbit placement
  const countries = useMemo(
    () => [
      {
        FlagComponent: CN,
        label: isAr ? "الصين" : "China",
        angle: -45, // top-right
        orbitR: 118,
        color: "#ef4444",
        packetColor: "#fca5a5",
      },
      {
        FlagComponent: US,
        label: isAr ? "الولايات المتحدة" : "USA",
        angle: 45, // bottom-right
        orbitR: 118,
        color: "#3b82f6",
        packetColor: "#93c5fd",
      },
      {
        FlagComponent: SA,
        label: isAr ? "السعودية" : "Saudi Arabia",
        angle: 180, // left
        orbitR: 118,
        color: "#10b981",
        packetColor: "#6ee7b7",
      },
      {
        FlagComponent: AE,
        label: isAr ? "الإمارات" : "UAE",
        angle: 130, // bottom-left
        orbitR: 118,
        color: "#f59e0b",
        packetColor: "#fde68a",
      },
      {
        FlagComponent: YE,
        label: isAr ? "اليمن" : "Yemen",
        angle: 230, // further bottom-left
        orbitR: 118,
        color: "#8b5cf6",
        packetColor: "#c4b5fd",
      },
    ],
    [isAr],
  );

  // Node positions
  const nodes = countries.map(({ angle, orbitR, ...rest }) => {
    const rad = (angle * Math.PI) / 180;
    return {
      ...rest,
      angle,
      orbitR,
      nx: CX + Math.cos(rad) * orbitR,
      ny: CY + Math.sin(rad) * orbitR,
    };
  });

  // Build a curved SVG arc path from center to each node
  // Uses a quadratic bezier with a control point offset perpendicular to midpoint
  function arcPath(nx: number, ny: number, idx: number) {
    const mx = (CX + nx) / 2;
    const my = (CY + ny) / 2;
    // Perpendicular offset based on index for variety
    const offsets = [22, -20, 18, -18, 24];
    const off = offsets[idx % offsets.length];
    const dx = ny - CY;
    const dy = CX - nx;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cpx = mx + (dx / len) * off;
    const cpy = my + (dy / len) * off;
    return `M ${CX} ${CY} Q ${cpx} ${cpy} ${nx} ${ny}`;
  }

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      {/* ── SVG Layer ── */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter for data packets */}
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow for rings */}
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial glow behind center */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7b57fc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7b57fc" stopOpacity="0" />
          </radialGradient>

          {/* Per-node arc gradients */}
          {nodes.map(({ color }, i) => (
            <linearGradient
              key={`arcGrad-${i}`}
              id={`arcGrad-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={CX}
              y1={CY}
              x2={nodes[i].nx}
              y2={nodes[i].ny}
            >
              <stop offset="0%" stopColor="#7b57fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="0.85" />
            </linearGradient>
          ))}

          {/* Arc path defs for animateMotion */}
          {nodes.map((n, i) => (
            <path
              key={`arcDef-${i}`}
              id={`arcPath-${i}`}
              d={arcPath(n.nx, n.ny, i)}
              fill="none"
            />
          ))}
        </defs>

        {/* ── Ambient center glow radial ── */}
        <circle cx={CX} cy={CY} r={70} fill="url(#centerGlow)" />

        {/* ── Outer dashed orbital ring ── */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={118}
          fill="none"
          stroke="url(#arcGrad-0)"
          strokeOpacity="0.18"
          strokeWidth="1"
          strokeDasharray="4 6"
          style={{ rotate: 0 }}
          animate={{ rotate: 360 } as never}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
          // @ts-ignore — SVG rotate via style
        />

        {/* ── Second ring (inner, counter-rotate) ── */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={72}
          fill="none"
          stroke="#7b57fc"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="3 9"
          // @ts-ignore
          animate={{ rotate: -360 } as never}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* ── Innermost glowing ring ── */}
        <circle
          cx={CX}
          cy={CY}
          r={42}
          fill="none"
          stroke="#7b57fc"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          filter="url(#ringGlow)"
        />

        {/* ── Pulse rings ── */}
        {[0, 0.6, 1.2].map((delay, i) => (
          <motion.circle
            key={`pulse-${i}`}
            cx={CX}
            cy={CY}
            r={44}
            fill="none"
            stroke="#7b57fc"
            strokeWidth="1.5"
            initial={{ r: 44, opacity: 0.5 } as never}
            animate={{ r: 115, opacity: 0 } as never}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeOut",
              delay,
            }}
          />
        ))}

        {/* ── Arc paths (visible, gradient strokes) ── */}
        {nodes.map((n, i) => (
          <g key={`arc-${i}`}>
            {/* Shadow / depth layer */}
            <path
              d={arcPath(n.nx, n.ny, i)}
              fill="none"
              stroke={n.color}
              strokeWidth="3"
              strokeOpacity="0.06"
            />
            {/* Main arc */}
            <motion.path
              d={arcPath(n.nx, n.ny, i)}
              fill="none"
              stroke={`url(#arcGrad-${i})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: {
                  delay: 0.6 + i * 0.15,
                  duration: 0.9,
                  ease: "easeOut",
                },
                opacity: { delay: 0.6 + i * 0.15, duration: 0.4 },
              }}
            />
          </g>
        ))}

        {/* ── Animated data packets along each arc ── */}
        {nodes.map((n, i) => (
          <g key={`packets-${i}`}>
            <DataPacket
              pathId={`arcPath-${i}`}
              delay={1.5 + i * 0.4}
              duration={2.6 + i * 0.3}
              color={n.packetColor}
            />
            {/* Second packet going reverse */}
            <DataPacket
              pathId={`arcPath-${i}`}
              delay={2.8 + i * 0.35}
              duration={3.0 + i * 0.25}
              color={n.color}
              reverse
            />
          </g>
        ))}

        {/* ── Node halos (behind the DOM node divs) ── */}
        {nodes.map((n, i) => (
          <motion.circle
            key={`halo-${i}`}
            cx={n.nx}
            cy={n.ny}
            r={22}
            fill={n.color}
            fillOpacity={0}
            stroke={n.color}
            strokeWidth="1"
            strokeOpacity="0"
            initial={{ r: 22, strokeOpacity: 0 } as never}
            animate={{ r: [22, 32, 22], strokeOpacity: [0.5, 0, 0.5] } as never}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>

      {/* ── Country nodes ── */}
      {nodes.map(({ FlagComponent, label, nx, ny, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.7 + i * 0.12,
            duration: 0.5,
            type: "spring",
            bounce: 0.45,
          }}
          className="absolute flex flex-col items-center gap-1.5 group"
          style={{
            left: nx,
            top: ny,
            transform: "translate(-50%,-50%)",
            zIndex: 15,
          }}
        >
{/* Node card */}
<div
  className="relative w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer
    bg-white dark:bg-card border border-border/60
    shadow-lg shadow-black/10
    transition-all duration-300
    group-hover:scale-110 group-hover:shadow-xl overflow-hidden"
  style={{
    boxShadow: `0 0 0 0 ${color}40`,
  }}
>
  {/* Color accent ring on hover */}
  <div
    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    style={{
      boxShadow: `0 0 14px 2px ${color}55, inset 0 0 0 1px ${color}40`,
    }}
  />

  {/* Fixed-size flag container — guarantees no overflow regardless of the SVG's own intrinsic dimensions */}
  <div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm overflow-hidden"
    style={{ width: 24, height: 16 }}
  >
    <FlagComponent
      style={{ width: "100%", height: "100%", display: "block" }}
      className="object-cover"
    />
  </div>

  <span
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white dark:border-card"
    style={{ backgroundColor: color }}
  />
</div>

          {/* Label pill */}
          <div
            className="px-2 py-0.5 rounded-full text-[8.5px] font-semibold whitespace-nowrap
              bg-white/80 dark:bg-card/80 border border-border/40
              shadow-sm text-foreground/70 backdrop-blur-sm"
          >
            {label}
          </div>
        </motion.div>
      ))}

      {/* ── Floating ring decoration (purely cosmetic) ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={CX}
            cy={CY}
            r={152}
            fill="none"
            stroke="#7b57fc"
            strokeOpacity="0.07"
            strokeWidth="1"
            strokeDasharray="2 14"
          />
        </svg>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat counter card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  to,
  suffix,
  label,
  icon: Icon,
  delay,
}: {
  to: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  const { ref, display } = useCountUp(to, 1.6, suffix ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl bg-card border border-border/50 hover:border-[#7b57fc]/30 transition-colors"
    >
      <Icon className="w-4 h-4 text-[#7b57fc] mb-0.5" />
      <span
        ref={ref}
        className="text-2xl font-bold text-foreground tabular-nums"
      >
        {display}
      </span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Hero
// ─────────────────────────────────────────────────────────────────────────────
export function FooterHero() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-background pt-16 pb-20">
      <div
        className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col items-center gap-10 md:gap-14"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Main visual: orbit + floating cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="relative w-full max-w-2xl mx-auto"
          style={{ height: 380 }}
        >
          {/* Center orbit */}
          <div className="absolute inset-0 flex items-center justify-center">
            <OrbitGraphic isAr={isAr} />
          </div>

          {/* Floating cards */}
          <RequestMockup />
          <BookingMockup />
          <QuoteMockup />

          {/* Status pills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 hidden md:block"
          >
            <StatusBadge
              icon={CheckCircle}
              label={isAr ? "عرض سعر جاهز ✓" : "Quote approved ✓"}
              color="bg-emerald-500"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.55, duration: 0.4 }}
            className="absolute top-1/3 -right-4 hidden md:block"
          >
            <StatusBadge
              icon={Truck}
              label={isAr ? "تم الشحن · ٥ أيام" : "Shipped · 5 days"}
              color="bg-[#7b57fc]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.4 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 hidden sm:block"
          >
            <StatusBadge
              icon={Star}
              label={isAr ? "4.9 · 200+ عميل راضٍ" : "4.9 · 200+ happy clients"}
              color="bg-amber-500"
            />
          </motion.div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mx-auto"
        >
          <StatCard
            to={500}
            suffix="+"
            label={isAr ? "مورد موثوق" : "Verified suppliers"}
            icon={Package}
            delay={0}
          />
          <StatCard
            to={48}
            suffix="h"
            label={isAr ? "وقت الاستجابة" : "Avg. response time"}
            icon={Clock}
            delay={0.08}
          />
          <StatCard
            to={200}
            suffix="+"
            label={isAr ? "عميل راضٍ" : "Happy clients"}
            icon={Star}
            delay={0.16}
          />
          <StatCard
            to={5}
            suffix="+"
            label={isAr ? "دول نعمل فيها" : "Countries served"}
            icon={TrendingUp}
            delay={0.24}
          />
        </motion.div>
      </div>
    </section>
  );
}