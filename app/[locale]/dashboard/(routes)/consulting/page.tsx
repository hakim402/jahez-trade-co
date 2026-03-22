// app/[locale]/dashboard/(routes)/consulting/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import type { ConsultingStatus } from "./actions";
import { getConsultingDashboardSummary } from "./actions";
import { ConsultingPageClient } from "./_components/ConsultingPageClient";
import { ConsultingPageSkeleton } from "./_components/ConsultingPageSkeleton";
import { ClientHeader } from "../../_components/ClientHeader";

export const metadata: Metadata = { title: "Consulting | Dashboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; tab?: string }>;
}

export default async function ConsultingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isAr = locale === "ar";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = sp.status as ConsultingStatus | undefined;
  const tab = sp.tab === "services" ? "services" : "freeform";

  const result = await getConsultingDashboardSummary(page, 10, status);

  let data = null;
  if (result.success) data = result.data;

  return (
    <div
      className={`flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <ClientHeader />

      <Suspense fallback={<ConsultingPageSkeleton isAr={isAr} />}>
        <ConsultingPageClient
          isAr={isAr}
          initialData={data}
          page={page}
          filterStatus={status}
          initialTab={tab}
        />
      </Suspense>
    </div>
  );
}
