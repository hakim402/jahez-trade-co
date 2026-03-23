// app/[locale]/dashboard/(routes)/video-booking/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { BookingStatus } from "@prisma/client";
import { getBookingDashboardSummary } from "./actions";
import { BookingPageClient } from "./_components/BookingPageClient";
import { BookingPageSkeleton } from "./_components/BookingsPageSkeleton";
import { ClientHeader } from "../../_components/ClientHeader";

export const metadata: Metadata = { title: "Video Booking | Dashboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function VideoBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isAr = locale === "ar";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = sp.status as BookingStatus | undefined;

  const result = await getBookingDashboardSummary(page, 10, status);

  let data = null;
  if (result.success) data = result.data;

  return (
    <>
      <ClientHeader />
      <div
        className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen max-w-7xl m-auto"
        dir={isAr ? "rtl" : "ltr"}
      >
        <Suspense fallback={<BookingPageSkeleton isAr={isAr} />}>
          <BookingPageClient
            isAr={isAr}
            initialData={data}
            page={page}
            filterStatus={status}
          />
        </Suspense>
      </div>
    </>
  );
}
