// app/[locale]/admin/(routes)/video-bookings/page.tsx

import { Suspense } from "react";
import { getAllBookings, getAdminBookingContext } from "./actions";
import { AdminBookingsClient } from "./_components/AdminBookingsClient";
import { BookingsTableSkeleton } from "./_components/BookingsTableSkeleton";
import { AdminHeader } from "../../_components/AdminHeader";
import type { BookingWithRelations, PaginationInfo } from "./_components/types";
import {
  Video,
  Clock,
  CheckCircle2,
  Trophy,
  XCircle,
  CalendarDays,
} from "lucide-react";

interface PageProps {
  searchParams: {
    page?: string;
    status?: string;
    clientEmail?: string;
  };
}

export default async function VideoBookingsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const status = searchParams.status as any;
  const email = searchParams.clientEmail;

  const [contextResult, bookingsResult] = await Promise.all([
    getAdminBookingContext(),
    getAllBookings({ page, pageSize: 20, status, clientEmail: email }),
  ]);

  if (!contextResult.success) throw new Error(contextResult.error);
  if (!bookingsResult.success) throw new Error(bookingsResult.error);

  const { kpi, availableSlotCount } = contextResult.data;
  const { bookings, pagination } = bookingsResult.data as {
    bookings: BookingWithRelations[];
    pagination: PaginationInfo;
  };

  const KPI_CARDS = [
    {
      label: "Total",
      value: kpi.total,
      icon: Video,
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Requested",
      value: kpi.requested,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "Confirmed",
      value: kpi.confirmed,
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Completed",
      value: kpi.completed,
      icon: Trophy,
      gradient: "from-violet-500 to-[#7b57fc]",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "Cancelled",
      value: kpi.canceled,
      icon: XCircle,
      gradient: "from-red-500 to-rose-500",
      shadow: "shadow-red-500/20",
    },
    {
      label: "Free Slots",
      value: availableSlotCount,
      icon: CalendarDays,
      gradient: "from-pink-500 to-fuchsia-500",
      shadow: "shadow-pink-500/20",
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <Video className="h-8 w-8 text-color" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-color">
                Video Bookings
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage client video call requests, schedule meetings, and track
                availability.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 self-start sm:self-auto">
            <Video size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {kpi.total.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          {KPI_CARDS.map(({ label, value, icon: Icon, gradient, shadow }) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3 hover:border-border transition-all duration-300"
            >
              {/* hover glow blob */}
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

        {/* ── Main client component — fills remaining height ───────── */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<BookingsTableSkeleton />}>
            <AdminBookingsClient
              initialBookings={bookings}
              initialPagination={pagination}
              initialStatus={status ?? null}
              initialEmail={email ?? ""}
              initialPage={page}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
