import { Suspense } from "react";
import { getUserBookingContext, getMyBookings } from "./actions";
import { MyBookingsClient } from "./_components/MyBookingsClient";
import { BookingsTableSkeleton } from "./_components/BookingsTableSkeleton";
import { ClientHeader } from "../../_components/ClientHeader";
import { cn } from "@/lib/utils";
import type {
  ClientBookingWithRelations,
  PaginationInfo,
} from "./_components/types";
import {
  Video,
  Clock,
  CheckCircle2,
  Trophy,
  TrendingUp,
  CalendarDays,
  Sparkles,
} from "lucide-react";

interface PageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
    status?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string; // e.g. "from-violet-500 to-indigo-600"
  glowColor: string; // inline CSS color for the radial glow
  accentBg: string; // solid Tailwind bg class for the accent stripe
  valueTint: string; // Tailwind text class for the number
  sub?: string;
  pct?: number; // optional 0–100 fill for the tiny progress bar
}

function KpiCard({
  label,
  value,
  icon: Icon,
  gradient,
  glowColor,
  accentBg,
  valueTint,
  sub,
  pct,
}: KpiProps) {
  return (
    <div className="relative rounded-2xl border border-border/10 bg-card/50 overflow-hidden group hover:border-border/25 hover:bg-card/70 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
      {/* Top accent stripe */}
      <div className={cn("h-0.5 w-full bg-linear-to-r", gradient)} />

      {/* Ambient corner glow */}
      <div
        className="absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: glowColor }}
      />

      {/* Watermark icon */}
      <Icon
        size={72}
        className="absolute -bottom-3 -right-3 opacity-[0.04] text-foreground pointer-events-none"
        strokeWidth={1.5}
      />

      <div className="relative px-4 pt-4 pb-4 flex flex-col gap-3">
        {/* Icon badge + label row */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
            {label}
          </p>
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br",
              gradient,
            )}
          >
            <Icon size={14} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Value */}
        <div>
          <p
            className={cn(
              "text-4xl font-bold tabular-nums leading-none tracking-tight",
              valueTint,
            )}
          >
            {value.toLocaleString()}
          </p>
          {sub && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0 bg-linear-to-br",
                  gradient,
                )}
              />
              {sub}
            </p>
          )}
        </div>

        {/* Optional mini progress bar */}
        {pct !== undefined && (
          <div className="h-1 w-full rounded-full bg-border/15 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-linear-to-r transition-all duration-700",
                gradient,
              )}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default async function MyVideoBookingsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.pageSize || "20")),
  );
  const status = searchParams.status as any;

  const [contextResult, bookingsResult] = await Promise.all([
    getUserBookingContext(),
    getMyBookings({ page, pageSize, status }),
  ]);

  if (!contextResult.success) throw new Error(contextResult.error);
  if (!bookingsResult.success) throw new Error(bookingsResult.error);

  const { planInfo, kpi } = contextResult.data;
  const { bookings, pagination } = bookingsResult.data as {
    bookings: ClientBookingWithRelations[];
    pagination: PaginationInfo;
  };

  const completionPct =
    kpi.total > 0 ? Math.round((kpi.completed / kpi.total) * 100) : 0;
  const usagePct =
    planInfo.limit !== Infinity && planInfo.limit > 0
      ? Math.round((planInfo.usedCount / planInfo.limit) * 100)
      : 0;

  const KPI_CARDS: KpiProps[] = [
    {
      label: "Total Bookings",
      value: kpi.total,
      icon: Video,
      gradient: "from-violet-500 to-indigo-600",
      glowColor: "#7c3aed",
      accentBg: "bg-violet-500",
      valueTint: "text-foreground",
      sub:
        kpi.total === 0
          ? "No bookings yet"
          : `${kpi.total - kpi.completed - (kpi.pending ?? 0)} in progress`,
      pct: planInfo.limit !== Infinity ? usagePct : undefined,
    },
    {
      label: "Pending",
      value: kpi.pending,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "#f59e0b",
      accentBg: "bg-amber-400",
      valueTint: kpi.pending > 0 ? "text-amber-400" : "text-foreground",
      sub: kpi.pending > 0 ? "Awaiting your confirmation" : "All caught up",
    },
    {
      label: "Confirmed",
      value: kpi.confirmed,
      icon: CheckCircle2,
      gradient: "from-green-400 to-emerald-500",
      glowColor: "#22c55e",
      accentBg: "bg-green-400",
      valueTint: kpi.confirmed > 0 ? "text-emerald-400" : "text-foreground",
      sub: kpi.confirmed > 0 ? "Upcoming calls scheduled" : "No upcoming calls",
    },
    {
      label: "Completed",
      value: kpi.completed,
      icon: Trophy,
      gradient: "from-emerald-400 to-teal-500",
      glowColor: "#10b981",
      accentBg: "bg-emerald-400",
      valueTint: kpi.completed > 0 ? "text-teal-400" : "text-foreground",
      sub:
        kpi.total > 0 ? `${completionPct}% completion rate` : "No sessions yet",
      pct: completionPct,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI_CARDS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Section divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/10" />
          <div className="flex items-center gap-2 text-muted-foreground/40">
            <Sparkles size={11} />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Your Bookings
            </p>
            <Sparkles size={11} />
          </div>
          <div className="flex-1 h-px bg-border/10" />
        </div>

        {/* Main client component */}
        <Suspense fallback={<BookingsTableSkeleton />}>
          <MyBookingsClient
            initialBookings={bookings}
            initialPagination={pagination}
            initialPlanInfo={planInfo}
            initialStatus={status ?? null}
            initialPage={page}
          />
        </Suspense>
      </div>
    </div>
  );
}
