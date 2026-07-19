// app/[locale]/dashboard/(routes)/requests/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { RequestStatus } from "@prisma/client";
import { getDashboardSummary } from "./actions";
import { RequestsPageClient } from "./_components/RequestsPageClient";
import { RequestsPageSkeleton } from "./_components/RequestsPageSkeleton";
import { ClientHeader } from "../../_components/ClientHeader";

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "My Requests | Dashboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export default async function RequestsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 10;
  const isAr = locale === "ar";
  const status = sp.status as RequestStatus | undefined;
  const search = sp.search || undefined;

  const result = await getDashboardSummary(page, pageSize, status, search);

  let data = null;
  if (result.success) data = result.data;

  return (
    <>
      <ClientHeader />
      <div
        className={`flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen max-w-7xl m-auto  ${isAr ? "rtl" : "ltr"}`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <Suspense fallback={<RequestsPageSkeleton isAr={isAr} />}>
          <RequestsPageClient
            isAr={isAr}
            initialData={data}
            page={page}
            pageSize={pageSize}
            filterStatus={status}
          />
        </Suspense>
      </div>
    </>
  );
}
