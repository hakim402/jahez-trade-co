"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format, formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Video,
  PackageSearch,
  MessageSquareQuote,
  Sparkles,
  BriefcaseBusiness,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Sub-components ────────────────────────────────────────────────────────────
import { ClientHeader } from "./ClientHeader";
import { DashboardStatsCards } from "./DashboardOverview/DashboardStats";
import { SubscriptionCard } from "./DashboardOverview/SubscriptionCard";

// ── Actions & types ───────────────────────────────────────────────────────────
import {
  refreshDashboardKpi,
  getPendingActions,
  type PendingAction,
  type DashboardKpiSnapshot,
} from "../actions";
import type { ClientDashboardStats } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const KPI_POLL_MS = 60_000; // refresh KPI counts every 60s

// ─────────────────────────────────────────────────────────────────────────────
// PENDING ACTIONS BANNER
// ─────────────────────────────────────────────────────────────────────────────

function PendingActionsBanner({ actions }: { actions: PendingAction[] }) {
  const t = useTranslations("ClientDashboard.pendingActions");

  if (!actions.length) return null;

  const highUrgency = actions.filter((a) => a.urgency === "high");
  const rest = actions.filter((a) => a.urgency !== "high");

  return (
    <div className="space-y-2">
      {[...highUrgency, ...rest].slice(0, 3).map((action) => (
        <div
          key={`${action.type}-${action.quoteId ?? action.bookingId}`}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            action.urgency === "high"
              ? "border-amber-300/60 bg-amber-50/80 dark:border-amber-700/40 dark:bg-amber-950/30"
              : "border-border/50 bg-card/60",
          )}
        >
          <AlertTriangle
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              action.urgency === "high"
                ? "text-amber-500"
                : "text-muted-foreground",
            )}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium leading-snug",
                action.urgency === "high"
                  ? "text-amber-900 dark:text-amber-200"
                  : "text-foreground",
              )}
            >
              {action.title}
            </p>
            <p
              className={cn(
                "text-xs mt-0.5",
                action.urgency === "high"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {action.body}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant={action.urgency === "high" ? "default" : "outline"}
            className={cn(
              "h-7 shrink-0 text-xs px-3",
              action.urgency === "high" &&
                "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white",
            )}
          >
            <Link
              href={
                action.bookingId
                  ? "/dashboard/video-bookings"
                  : "/dashboard/requests"
              }
            >
              {action.type === "CONFIRM_BOOKING" ? t("confirm") : t("review")}
              <ChevronRight className="h-3 w-3 ms-0.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS STRIP
// ─────────────────────────────────────────────────────────────────────────────

function QuickActions() {
  const t = useTranslations("ClientDashboard.quickActions");

  const actions = [
    {
      label: t("newRequest"),
      href: "/dashboard/requests",
      icon: PackageSearch,
      color: "from-indigo-500 to-purple-500",
    },
    {
      label: t("bookCall"),
      href: "/dashboard/bookings/",
      icon: Video,
      color: "from-sky-500 to-cyan-500",
    },
    {
      label: t("myQuotes"),
      href: "/dashboard/requests",
      icon: MessageSquareQuote,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: t("consulting"),
      href: "/dashboard/requests",
      icon: BriefcaseBusiness,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center"
        >
          <div
            className={cn(
              "rounded-lg p-2 bg-linear-to-br text-white shadow-sm",
              a.color,
            )}
          >
            <a.icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-tight">
            {a.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER SINCE CHIP
// ─────────────────────────────────────────────────────────────────────────────

function MemberChip({ memberSince }: { memberSince: Date }) {
  const t = useTranslations("ClientDashboard");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border/50 rounded-full px-2.5 py-1 bg-muted/30">
      <Sparkles className="h-3 w-3 text-indigo-500" />
      {t("memberSince", { date: format(new Date(memberSince), "MMM yyyy") })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

interface ClientDashboardProps {
  stats: ClientDashboardStats;
}

export function ClientDashboard({ stats }: ClientDashboardProps) {
  const t = useTranslations("ClientDashboard");
  const [kpi, setKpi] = useState<DashboardKpiSnapshot | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Load pending actions on mount ────────────────────────────────────────
  useEffect(() => {
    getPendingActions().then((r) => {
      if (r.success) setPendingActions(r.data);
    });
  }, []);

  // ── KPI polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = () => {
      refreshDashboardKpi().then((r) => {
        if (r.success) {
          setKpi(r.data);
          setLastRefreshed(new Date());
        }
      });
    };

    poll();
    const interval = setInterval(poll, KPI_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Manual refresh ────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const [kpiResult, actionsResult] = await Promise.all([
      refreshDashboardKpi(),
      getPendingActions(),
    ]);
    if (kpiResult.success) {
      setKpi(kpiResult.data);
      setLastRefreshed(new Date());
    }
    if (actionsResult.success) setPendingActions(actionsResult.data);
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // ── Merge KPI snapshot into displayed stats ───────────────────────────────
  const liveStats: ClientDashboardStats = kpi
    ? {
        ...stats,
        requests: { ...stats.requests, active: kpi.activeRequests },
        bookings: { ...stats.bookings, upcoming: kpi.upcomingBookings },
        quotes: { ...stats.quotes, pending: kpi.pendingQuotes },
        notifications: { unreadCount: kpi.unreadNotifications },
      }
    : stats;

  const firstName = stats.user.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ClientHeader />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6 max-w-7xl">
        {/* ── Welcome row ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-400 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
              {t("welcome", { name: firstName })}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              <MemberChip memberSince={stats.user.memberSince} />
            </div>
          </div>

          {/* Refresh button + last updated */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("updated", {
                relative: formatDistanceToNow(lastRefreshed, {
                  addSuffix: true,
                }),
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
              />
              {t("refresh")}
            </Button>
          </div>
        </div>

        {/* ── Pending action banners ────────────────────────────────────────── */}
        {pendingActions.length > 0 && (
          <PendingActionsBanner actions={pendingActions} />
        )}

        {/* ── KPI strip ────────────────────────────────────────────────────── */}
        <DashboardStatsCards stats={liveStats} />

        {/* ── Subscription card ─────────────────────────────────────────────── */}
        <SubscriptionCard subscription={liveStats.subscription} />

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <QuickActions />
      </div>
    </div>
  );
}
