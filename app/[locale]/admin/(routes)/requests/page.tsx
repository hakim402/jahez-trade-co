// app/[locale]/admin/(routes)/requests/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { RequestStatus } from "@prisma/client";
import { getAllProductRequests, getRequestStats } from "./actions";
import { RequestPageClient } from "./_components/RequestPageClient";
import { RequestPageSkeleton } from "./_components/RequestPageSkeleton";
import { AdminHeader } from "../../_components/AdminHeader";

export const metadata: Metadata = { title: "Product Requests | Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    priority?: string;
    search?: string;
    shippingCountry?: string;
    hasQuotes?: string;
    sortBy?: string;
    sortOrder?: string;
    from?: string;
    to?: string;
  }>;
}

// Helper to safely extract data from an ActionResult (server action return shape)
function safeData<T>(
  result: { success: boolean; data?: T; error?: string },
  fallback: T,
): T {
  if (result.success && "data" in result && result.data !== undefined) {
    return result.data;
  }
  return fallback;
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 15;

  const filters = {
    page,
    pageSize,
    status: sp.status as RequestStatus | undefined,
    priority: sp.priority !== undefined ? parseInt(sp.priority, 10) : undefined,
    search: sp.search || undefined,
    shippingCountry: sp.shippingCountry || undefined,
    hasQuotes:
      sp.hasQuotes === "true"
        ? true
        : sp.hasQuotes === "false"
          ? false
          : undefined,
    sortBy: (sp.sortBy as "createdAt" | "priority" | "status") || "createdAt",
    sortOrder: (sp.sortOrder as "asc" | "desc") || "desc",
    createdAtFrom: sp.from ? new Date(sp.from) : undefined,
    createdAtTo: sp.to ? new Date(sp.to) : undefined,
  };

  const [listResult, statsResult] = await Promise.all([
    getAllProductRequests(filters),
    getRequestStats(),
  ]);

  // Safe extraction with fallback
  const { requests, pagination } = safeData(listResult, {
    requests: [],
    pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
  });

  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      <Suspense fallback={<RequestPageSkeleton />}>
        <RequestPageClient
          initialRequests={requests as any}
          initialPagination={pagination}
          initialStats={stats}
          filters={filters}
        />
      </Suspense>
    </div>
  );
}
