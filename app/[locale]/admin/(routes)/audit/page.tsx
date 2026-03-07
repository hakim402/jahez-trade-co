// app/[locale]/admin/(routes)/audit/page.tsx

import { Suspense } from "react";
import { AdminHeader } from "../../_components/AdminHeader";
import { AuditLogClient } from "./_components/AuditLogcCient";
import { AuditLogSkeleton } from "./_components/AuditLogSkeleton";
import { getAuditStats, getAuditLogs, getAuditFilterOptions } from "./actions";
import {
  ShieldAlert,
  Activity,
  Users,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    entity?: string;
    action?: string;
    adminId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export const metadata = { title: "Audit Log — Admin" };

export default async function AuditPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const filters = {
    page,
    pageSize: 25,
    search: searchParams.search,
    entity: searchParams.entity,
    action: searchParams.action,
    adminId: searchParams.adminId,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
  };

  const [statsResult, logsResult, filterOptions] = await Promise.all([
    getAuditStats(),
    getAuditLogs(filters),
    getAuditFilterOptions(),
  ]);

  const KPI_CARDS = [
    {
      label: "Total Logs",
      value: statsResult.totalLogs,
      icon: Activity,
      gradient: "from-violet-500 to-[#7b57fc]",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "Active Admins",
      value: statsResult.uniqueAdmins,
      icon: Users,
      gradient: "from-blue-400 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Last 7 Days",
      value: statsResult.logsLast7Days,
      icon: TrendingUp,
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Last 30 Days",
      value: statsResult.logsLast30Days,
      icon: Calendar,
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "Entity Types",
      value: statsResult.uniqueEntities.length,
      icon: ShieldAlert,
      gradient: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/20",
    },
    {
      label: "Action Types",
      value: statsResult.uniqueActions.length,
      icon: Clock,
      gradient: "from-indigo-400 to-violet-500",
      shadow: "shadow-indigo-500/20",
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b57fc]/10">
              <Activity className="h-5 w-5 text-[#7b57fc]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-color">
                Audit Log
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Full trail of every admin action across the platform.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 self-start sm:self-auto">
            <Activity size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {statsResult.totalLogs.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">events</span>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          {KPI_CARDS.map(({ label, value, icon: Icon, gradient, shadow }) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3 hover:border-border transition-all duration-300"
            >
              <div
                className={`absolute -top-4 -right-4 h-14 w-14 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-linear-to-br ${gradient}`}
              />
              <div
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${gradient} shadow-md ${shadow}`}
              >
                <Icon size={15} className="text-white" />
              </div>
              <div className="relative min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                  {label}
                </p>
                <p className="text-xl font-bold text-foreground tabular-nums leading-tight">
                  {value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main client component ────────────────────────────────────── */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<AuditLogSkeleton />}>
            <AuditLogClient
              initialLogs={logsResult.logs}
              initialTotal={logsResult.total}
              initialPage={logsResult.page}
              initialTotalPages={logsResult.totalPages}
              filterOptions={filterOptions}
              initialFilters={filters}
              actionsBreakdown={statsResult.actionsBreakdown}
              entitiesBreakdown={statsResult.entitiesBreakdown}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
