// app/[locale]/admin/(routes)/product-requests/page.tsx

import { Suspense } from "react";
import { getAllProductRequests, getRequestStats } from "./actions";
import { RequestFilters } from "./_components/RequestFilters";
import { RequestsTableSkeleton } from "./_components/RequestsTableSkeleton";
import { RequestsPageClient } from "./_components/RequestsPageClient";
import { AdminHeader } from "../../_components/AdminHeader";
import { RequestStatus } from "@prisma/client";
import {
  Package,
  Clock,
  FileText,
  AlertCircle,
  PackageSearch,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    priority?: string;
    clientEmail?: string;
    search?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
  }>;
}

export default async function ProductRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || "20")));
  const status = sp.status as RequestStatus | undefined;
  const priority = sp.priority ? parseInt(sp.priority) : undefined;

  const filters = {
    page,
    pageSize,
    status,
    priority: isNaN(priority as number) ? undefined : priority,
    clientEmail: sp.clientEmail,
    search: sp.search,
    createdAtFrom: sp.createdAtFrom ? new Date(sp.createdAtFrom) : undefined,
    createdAtTo: sp.createdAtTo ? new Date(sp.createdAtTo) : undefined,
  };

  const [result, statsResult] = await Promise.all([
    getAllProductRequests(filters),
    getRequestStats(),
  ]);

  if (!result.success) throw new Error(result.error);

  const { requests, pagination } = result.data as any;
  const stats = statsResult.success ? statsResult.data : null;

  const KPI_CARDS = stats
    ? [
        {
          label: "Active",
          value: stats.totalActive,
          icon: Package,
          gradient: "from-violet-500 to-[#7b57fc]",
          shadow: "shadow-violet-500/20",
        },
        {
          label: "Today",
          value: stats.submittedToday,
          icon: Clock,
          gradient: "from-amber-400 to-orange-500",
          shadow: "shadow-amber-500/20",
        },
        {
          label: "This Week",
          value: stats.submittedWeek,
          icon: FileText,
          gradient: "from-emerald-400 to-teal-500",
          shadow: "shadow-emerald-500/20",
        },
        {
          label: "Pending Quotes",
          value: stats.pendingQuotes,
          icon: AlertCircle,
          gradient: "from-pink-500 to-rose-500",
          shadow: "shadow-pink-500/20",
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b57fc]/10">
              <PackageSearch className="h-5 w-5 text-[#7b57fc]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-color">
                Product Requests
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage client requests, generate AI quotes, and track
                fulfilment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 self-start sm:self-auto">
            <Package size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {pagination.totalCount.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────── */}
        {KPI_CARDS.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {KPI_CARDS.map(({ label, value, icon: Icon, gradient, shadow }) => (
              <div
                key={label}
                className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5 hover:border-border transition-all duration-300"
              >
                {/* hover glow blob */}
                <div
                  className={`absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-linear-to-br ${gradient}`}
                />
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${gradient} shadow-md ${shadow}`}
                >
                  <Icon size={17} className="text-white" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
                    {value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="shrink-0">
          <RequestFilters initialFilters={filters} />
        </div>

        {/* ── Table — fills remaining height ──────────────────────── */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<RequestsTableSkeleton />}>
            <RequestsPageClient
              initialRequests={requests}
              initialPagination={pagination}
              filters={filters}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
