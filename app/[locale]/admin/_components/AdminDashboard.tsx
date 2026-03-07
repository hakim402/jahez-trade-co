// app/[locale]/admin/_components/AdminDashboard.tsx

import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { AdminHeader } from "./AdminHeader";
import { AdminKpiCards } from "./Overview/AdminKpiCards";
import { PendingWorkloadCard } from "./Overview/PendingWorkloadCard";
import { RecentRequestsTable } from "./Overview/RecentRequestsTable";
import { UpcomingBookingsCard } from "./Overview/UpcomingBookingsCard";
import { RevenueChart } from "./Overview/RevenueChart";
import { RecentActivityFeed } from "./Overview/RecentActivityFeed";
import { StatusBreakdownPanel } from "./Overview/StatusBreakdownPanel";
import { QuickActions } from "./Overview/QuickActions";
import { ActivityChart } from "./Overview/ActivityChart";

import {
  getDashboardStats,
  getPendingWorkload,
  getRecentActivity,
  getRevenueBreakdown,
} from "../actions/actions";

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON FALLBACKS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="border border-border/50">
          <CardContent className="p-3.5 space-y-2.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-6 w-20 mt-2" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-1">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SideSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border border-border/50">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivityChartSkeleton() {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC DATA SECTIONS — each fetches its own data (server components)
// ─────────────────────────────────────────────────────────────────────────────

async function KpiSection() {
  const result = await getDashboardStats();
  if (!result.success) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        ⚠ Failed to load stats: {result.error}
      </div>
    );
  }
  return <AdminKpiCards stats={result.data} />;
}

async function WorkloadSection() {
  const result = await getPendingWorkload();
  if (!result.success) return null;

  const total =
    result.data.requestsPendingReview +
    result.data.quotesAwaitingApproval +
    result.data.bookingsPendingConfirmation +
    result.data.bookingsProposed;

  if (total === 0) return null;
  return <PendingWorkloadCard workload={result.data} />;
}

async function ActivityChartSection() {
  const [statsResult, revenueResult] = await Promise.all([
    getDashboardStats(),
    getRevenueBreakdown(30),
  ]);

  if (!statsResult.success || !revenueResult.success) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        ⚠ Failed to load analytics data
      </div>
    );
  }

  return (
    <ActivityChart revenueData={revenueResult.data} stats={statsResult.data} />
  );
}

async function MainContentSection() {
  const [statsResult, activityResult, revenueResult] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(12),
    getRevenueBreakdown(30),
  ]);

  if (!statsResult.success) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        ⚠ Failed to load dashboard data: {statsResult.error}
      </div>
    );
  }

  const { data: stats } = statsResult;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Main column (2/3) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <RecentRequestsTable
            requests={stats.requests.recent}
            total={stats.requests.total}
          />
          <UpcomingBookingsCard bookings={stats.bookings.upcoming} />
        </div>

        {revenueResult.success && (
          <RevenueChart
            breakdown={revenueResult.data}
            totalRevenue={stats.payments.totalRevenue}
            revenueToday={stats.payments.revenueToday}
            revenueThisWeek={stats.payments.revenueThisWeek}
          />
        )}

        {activityResult.success && (
          <RecentActivityFeed activity={activityResult.data} />
        )}
      </div>

      {/* Side panel (1/3) */}
      <div>
        <StatusBreakdownPanel stats={stats} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — async server component
// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const now = new Date();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <AdminHeader />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-5 max-w-350">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-[#7b57fc] to-indigo-500 dark:from-[#7b57fc] dark:to-indigo-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#7b57fc]" />
              Platform overview · {format(now, "EEEE, MMMM d yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge
              variant="secondary"
              className="gap-1.5 font-normal text-xs py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-1.5 text-xs font-medium transition-colors shadow-sm"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection />
        </Suspense>

        {/* Pending workload banner (hidden when zero) */}
        <Suspense fallback={null}>
          <WorkloadSection />
        </Suspense>

        {/* Full‑width Activity Chart */}
        <Suspense fallback={<ActivityChartSkeleton />}>
          <ActivityChartSection />
        </Suspense>

         {/* Quick Actions (static, no suspense needed) */}
        <QuickActions />

        {/* Main content grid */}
        <Suspense
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <RowSkeleton rows={5} />
                  <RowSkeleton rows={4} />
                </div>
                <RowSkeleton rows={3} />
                <RowSkeleton rows={7} />
              </div>
              <SideSkeleton />
            </div>
          }
        >
          <MainContentSection />
        </Suspense>
      </div>
    </div>
  );
}
