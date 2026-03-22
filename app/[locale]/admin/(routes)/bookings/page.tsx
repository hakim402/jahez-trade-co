// app/[locale]/admin/(routes)/video-bookings/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { BookingStatus } from "@prisma/client";
import { getAdminBookingContext, getAllBookings, getAllSlots } from "./actions";
import { VideoBookingPageClient } from "./_components/VideoBookingPageClient";
import { VideoBookingPageSkeleton } from "./_components/VideoBookingPageSkeleton";

export const metadata: Metadata = { title: "Video Bookings | Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    email?: string;
    from?: string;
    to?: string;
    tab?: string;
    slotsPage?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const slotsPage = Math.max(1, parseInt(sp.slotsPage ?? "1", 10) || 1);
  const tab = sp.tab === "slots" ? "slots" : "bookings";
  const status = sp.status as BookingStatus | undefined;

  const [contextResult, bookingsResult, slotsResult] = await Promise.all([
    getAdminBookingContext(),
    getAllBookings({
      page,
      pageSize: 15,
      status,
      clientEmail: sp.email || undefined,
      dateFrom: sp.from ? new Date(sp.from) : undefined,
      dateTo: sp.to ? new Date(sp.to) : undefined,
    }),
    getAllSlots(slotsPage, 20),
  ]);

  const kpi = contextResult.success ? contextResult.data.kpi : null;
  const availableSlotCount = contextResult.success
    ? contextResult.data.availableSlotCount
    : 0;
  const bookings = bookingsResult.success ? bookingsResult.data.bookings : [];
  const bookingPagination = bookingsResult.success
    ? bookingsResult.data.pagination
    : { page: 1, pageSize: 15, totalCount: 0, totalPages: 0 };
  const slots = slotsResult.success ? slotsResult.data.slots : [];
  const slotPagination = slotsResult.success
    ? slotsResult.data.pagination
    : { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-foreground">Video Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage client video call sessions and availability slots
        </p>
      </div>

      <Suspense fallback={<VideoBookingPageSkeleton />}>
        <VideoBookingPageClient
          kpi={kpi}
          availableSlotCount={availableSlotCount}
          initialBookings={bookings}
          bookingPagination={bookingPagination}
          initialSlots={slots}
          slotPagination={slotPagination}
          initialTab={tab}
          filters={{
            status,
            email: sp.email || undefined,
            from: sp.from || undefined,
            to: sp.to || undefined,
          }}
        />
      </Suspense>
    </div>
  );
}
