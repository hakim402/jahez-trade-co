// app/[locale]/admin/(routes)/shipments/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { ShipmentStatus } from "@prisma/client";
import { getShipments, getShipmentStats } from "./actions";
import { ShipmentsPageClient } from "./_components/ShipmentsPageClient";
import { ShipmentsPageSkeleton } from "./_components/ShipmentsPageSkeleton";
import { AdminHeader } from "../../_components/AdminHeader";

// Always fetch fresh — a shipment created a second ago must show up immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Shipments & Tracking | Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

function safeData<T>(result: { success: boolean; data?: T; error?: string }, fallback: T): T {
  if (result.success && "data" in result && result.data !== undefined) return result.data;
  return fallback;
}

export default async function AdminShipmentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 20;

  const filters = {
    page,
    pageSize,
    status: (sp.status as ShipmentStatus | "ALL" | undefined) ?? "ALL",
    search: sp.search || undefined,
  };

  const [listResult, statsResult] = await Promise.all([
    getShipments(filters),
    getShipmentStats(),
  ]);

  const { shipments, pagination } = safeData(listResult, {
    shipments: [],
    pagination: { page, pageSize, totalCount: 0, totalPages: 1 },
  });

  const listError = !listResult.success ? listResult.error : null;

  const stats = safeData(statsResult, { total: 0, inTransit: 0, delivered: 0, delayed: 0 });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      <Suspense fallback={<ShipmentsPageSkeleton />}>
        <ShipmentsPageClient
          initialShipments={shipments}
          initialPagination={pagination}
          stats={stats}
          filters={filters}
          loadError={listError}
        />
      </Suspense>
    </div>
  );
}
