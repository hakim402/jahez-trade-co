"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl"; // <-- added
import { format, formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Video,
  PackageSearch,
  MessageSquareQuote,
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Sub-components ────────────────────────────────────────────────────────────
import { ClientHeader } from "./ClientHeader";
import { DashboardStatsCards } from "./DashboardOverview/DashboardStats";
import { SubscriptionCard } from "./DashboardOverview/SubscriptionCard";
import { RecentRequests } from "./DashboardOverview/RecentRquests";
import { RecentBookings } from "./DashboardOverview/RecentBookings";
import { RecentQuotes } from "./DashboardOverview/RecentQuotes";

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
// Shown at the top when the client has bookings to confirm or quotes to review.
// ─────────────────────────────────────────────────────────────────────────────

function PendingActionsBanner({ actions }: { actions: PendingAction[] }) {
  const t = useTranslations("ClientDashboard.pendingActions"); // <-- added

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
              <ChevronRight className="h-3 w-3 ms-0.5" />{" "}
              {/* ms-* for margin-inline-start */}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BREAKDOWN CARD
// Used in the side panel to show byStatus record from stats
// ─────────────────────────────────────────────────────────────────────────────

function StatusBreakdownCard({
  title,
  icon: Icon,
  byStatus,
  iconColor,
}: {
  title: string;
  icon: React.ElementType;
  byStatus: Record<string, number>;
  iconColor: string;
}) {
  const entries = Object.entries(byStatus).filter(([, count]) => count > 0);

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">No data</p> // will be replaced by translation in parent
        ) : (
          <div className="space-y-1.5">
            {entries.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">
                  {status}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] h-5 px-1.5 min-w-7 justify-center"
                >
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS STRIP
// ─────────────────────────────────────────────────────────────────────────────

function QuickActions() {
  const t = useTranslations("ClientDashboard.quickActions"); // <-- added

  const actions = [
    {
      label: t("newRequest"),
      href: "/dashboard/requests",
      icon: PackageSearch,
      color: "from-indigo-500 to-purple-500",
    },
    {
      label: t("bookCall"),
      href: "/dashboard/video-bookings/",
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
      label: t("files"),
      href: "/dashboard/requests",
      icon: FileText,
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
  const t = useTranslations("ClientDashboard"); // <-- added
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
  const t = useTranslations("ClientDashboard"); // <-- added
  const [activeTab, setActiveTab] = useState("requests");
  const [kpi, setKpi] = useState<DashboardKpiSnapshot | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    toast.success("Dashboard refreshed"); // can also be translated if needed
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

        {/* ── Tabs + side panel ─────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="h-9 bg-muted/60 border border-border/40">
              <TabsTrigger
                value="requests"
                className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <PackageSearch className="h-3.5 w-3.5" />
                {t("tabs.requests")}
                {liveStats.requests.active > 0 && (
                  <span className="ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
                    {liveStats.requests.active}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="bookings"
                className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Video className="h-3.5 w-3.5" />
                {t("tabs.videoCalls")}
                {liveStats.bookings.upcoming > 0 && (
                  <span className="ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                    {liveStats.bookings.upcoming}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="quotes"
                className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MessageSquareQuote className="h-3.5 w-3.5" />
                {t("tabs.quotes")}
                {liveStats.quotes.pending > 0 && (
                  <span className="ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {liveStats.quotes.pending}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="files"
                className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                {t("tabs.files")}
              </TabsTrigger>
            </TabsList>

            {/* View-all shortcut for active tab */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground gap-1 hidden sm:flex"
            >
              <Link
                href={
                  activeTab === "bookings"
                    ? "/dashboard/video-bookings"
                    : activeTab === "files"
                      ? "/dashboard/files"
                      : "/dashboard/requests"
                }
              >
                {t("viewAll")}
                <ArrowUpRight className="h-3 w-3 ms-0.5" />{" "}
                {/* margin-inline-start */}
              </Link>
            </Button>
          </div>

          {/* ── Tab content + side panel ──────────────────────────────────── */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Main content area (2 cols) */}
            <div className="lg:col-span-2">
              <TabsContent
                value="requests"
                className="mt-0 focus-visible:ring-0"
              >
                <RecentRequests
                  requests={liveStats.requests.recent}
                  total={liveStats.requests.total}
                />
              </TabsContent>

              <TabsContent
                value="bookings"
                className="mt-0 focus-visible:ring-0"
              >
                <RecentBookings
                  bookings={liveStats.bookings.recent}
                  total={liveStats.bookings.total}
                />
              </TabsContent>

              <TabsContent value="quotes" className="mt-0 focus-visible:ring-0">
                <RecentQuotes
                  quotes={liveStats.quotes.recent}
                  total={liveStats.quotes.total}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-0 focus-visible:ring-0">
                <FilesPlaceholder />
              </TabsContent>
            </div>

            {/* ── Side panel (1 col) — always visible ───────────────────── */}
            <div className="space-y-4">
              <StatusBreakdownCard
                title={t("statusBreakdown.requestsByStatus")}
                icon={PackageSearch}
                iconColor="text-indigo-500"
                byStatus={liveStats.requests.byStatus}
              />
              <StatusBreakdownCard
                title={t("statusBreakdown.bookingsByStatus")}
                icon={Video}
                iconColor="text-sky-500"
                byStatus={liveStats.bookings.byStatus}
              />
              <StatusBreakdownCard
                title={t("statusBreakdown.quotesByStatus")}
                icon={MessageSquareQuote}
                iconColor="text-amber-500"
                byStatus={liveStats.quotes.byStatus}
              />

              {/* Stats summary card */}
              <Card className="border border-border/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    {t("summary.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  {[
                    {
                      label: t("summary.totalRequests"),
                      value: liveStats.requests.total,
                    },
                    {
                      label: t("summary.completedOrders"),
                      value: liveStats.requests.completed,
                    },
                    {
                      label: t("summary.totalBookings"),
                      value: liveStats.bookings.total,
                    },
                    {
                      label: t("summary.callsCompleted"),
                      value: liveStats.bookings.completed,
                    },
                    {
                      label: t("summary.totalQuotes"),
                      value: liveStats.quotes.total,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[11px] h-5 px-1.5 min-w-7 justify-center"
                      >
                        {value}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILES PLACEHOLDER
// Replace this with your actual Files component when ready.
// ─────────────────────────────────────────────────────────────────────────────

function FilesPlaceholder() {
  const t = useTranslations("ClientDashboard.filesPlaceholder");
  return (
    <Card className="border border-dashed border-border/60 bg-muted/20">
      <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
        <div className="rounded-xl bg-muted p-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">
            {t("comingSoon")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 text-xs mt-1"
        >
          <Link href="/dashboard/requests">{t("goToRequests")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
