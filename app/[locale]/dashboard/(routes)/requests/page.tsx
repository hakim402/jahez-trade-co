import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getMyRequests, getClientContext } from "./actions";
import { MyRequestsClient } from "./_components/MyRequestsClient";
import { ClientHeader } from "../../_components/ClientHeader";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";
import {
  PackageSearch,
  Clock,
  Send,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ClientRequestWithRelations,
  PaginationInfo,
} from "./_components/types";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function RequestsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/8 bg-card/40 h-44 animate-pulse"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  valueTint: string;
  sub?: string;
  pct?: number;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  gradient,
  glowColor,
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
        {/* Label + icon badge */}
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

        {/* Optional progress bar */}
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

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const t = await getTranslations("MyRequestsPage");
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || "20")));
  const status = sp.status as RequestStatus | undefined;
  const filters = { page, pageSize, status };

  const contextResult = await getClientContext();
  if (!contextResult.success) throw new Error(contextResult.error);
  const { user, plan } = contextResult.data;

  const result = await getMyRequests(filters);
  if (!result.success) throw new Error(result.error);

  const { requests, pagination } = result.data as {
    requests: ClientRequestWithRelations[];
    pagination: PaginationInfo;
  };

  // Stats
  const allRequests = await prisma.productRequest.findMany({
    where: { clientId: user.id, isDeleted: false },
    select: {
      status: true,
      quotes: {
        where: { status: "SENT", isDeleted: false },
        select: { id: true },
      },
    },
  });

  const total = allRequests.length;
  const active = allRequests.filter((r) =>
    ["SUBMITTED", "IN_REVIEW", "QUOTED"].includes(r.status),
  ).length;
  const completed = allRequests.filter((r) => r.status === "COMPLETED").length;
  const awaitingMe = allRequests.filter((r) => r.quotes.length > 0).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const usagePct =
    plan.limit !== Infinity && plan.limit > 0
      ? Math.round((plan.usedCount / plan.limit) * 100)
      : 0;

  const KPI_CARDS: KpiProps[] = [
    {
      label: t("totalRequests"),
      value: total,
      icon: PackageSearch,
      gradient: "from-violet-500 to-indigo-600",
      glowColor: "#7c3aed",
      valueTint: "text-foreground",
      sub: total === 0 ? "No requests yet" : `${active} currently active`,
      pct: plan.limit !== Infinity ? usagePct : undefined,
    },
    {
      label: t("inProgress"),
      value: active,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "#f59e0b",
      valueTint: active > 0 ? "text-amber-400" : "text-foreground",
      sub: active > 0 ? "Being reviewed or quoted" : "Nothing in progress",
    },
    {
      label: t("awaitingAction"),
      value: awaitingMe,
      icon: Send,
      gradient: "from-pink-500 to-rose-500",
      glowColor: "#ec4899",
      valueTint: awaitingMe > 0 ? "text-pink-400" : "text-foreground",
      sub: awaitingMe > 0 ? "Quotes ready for review" : "No action needed",
    },
    {
      label: t("completed"),
      value: completed,
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-teal-500",
      glowColor: "#10b981",
      valueTint: completed > 0 ? "text-teal-400" : "text-foreground",
      sub: total > 0 ? `${completionPct}% completion rate` : undefined,
      pct: completionPct,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="relative border-b border-border/8 overflow-hidden">
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            {/* Title block */}
            <div className="flex items-center gap-4">
              {/* Icon with glow ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-color/20 blur-md scale-110" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-color/30 to-color/10 border border-color/20 shadow-lg shadow-color/10">
                  <PackageSearch size={24} className="text-color" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold tracking-tight text-color">
                    {t("title")}
                  </h1>
                  {awaitingMe > 0 && (
                    <span className="inline-flex items-center gap-1 h-5 px-2 text-[10px] font-bold rounded-full bg-pink-400/15 text-pink-400 border border-pink-400/20 animate-pulse">
                      {awaitingMe} to review
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>

            {/* Right side meta */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Plan usage pill */}
              {plan.limit !== Infinity && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs">
                  <TrendingUp size={12} className="text-color shrink-0" />
                  <span className="font-bold text-foreground">
                    {plan.planName}
                  </span>
                  <span className="text-border/50">·</span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {plan.usedCount}
                    </span>
                    /{plan.limit} used
                  </span>
                  <div className="w-14 h-1 rounded-full bg-border/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-color transition-all"
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Active quick-stat */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs text-muted-foreground">
                <Clock size={12} className="shrink-0" />
                <span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {active}
                  </span>{" "}
                  in progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              Your Requests
            </p>
            <Sparkles size={11} />
          </div>
          <div className="flex-1 h-px bg-border/10" />
        </div>

        {/* Main client content */}
        <Suspense fallback={<RequestsGridSkeleton />}>
          <MyRequestsClient
            initialRequests={requests}
            initialPagination={pagination}
            filters={filters}
            plan={plan}
          />
        </Suspense>
      </div>
    </div>
  );
}
