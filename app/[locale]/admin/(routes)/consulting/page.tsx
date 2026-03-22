// app/[locale]/admin/(routes)/consulting/page.tsx

import { Suspense } from "react"
import type { Metadata } from "next"
import { getAllConsultingRequests, getAllConsultingServices, getConsultingFullStats } from "./actions"
import { ConsultingPageClient } from "./_components/ConsultingPageClient"
import { ConsultingPageSkeleton } from "./_components/ConsultingPageSkeleton"
import { AdminHeader } from "../../_components/AdminHeader"

export const metadata: Metadata = { title: "Consulting | Admin" }

interface PageProps {
  searchParams: Promise<{
    tab?: string
    page?: string
    status?: string
    topic?: string
    search?: string
    active?: string
    spage?: string
  }>
}

// Helper to safely extract data from an ActionResult, providing a fallback on failure
function safeData<T>(
  result: { success: boolean; data?: T },
  fallback: T
): T {
  return result.success && result.data !== undefined ? result.data : fallback
}

export default async function ConsultingPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const tab = sp.tab === "services" ? "services" : "requests"
  const reqPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const svcPage = Math.max(1, parseInt(sp.spage ?? "1", 10) || 1)
  const pageSize = 12

  const reqFilters = {
    page: reqPage,
    pageSize,
    status: sp.status as any | undefined,
    topic: sp.topic || undefined,
    search: sp.search || undefined,
  }

  const svcFilters = {
    page: svcPage,
    pageSize,
    topic: sp.topic as any | undefined,
    search: sp.search || undefined,
    isActive: sp.active === "false" ? false : sp.active === "true" ? true : undefined,
  }

  const [statsResult, requestsResult, servicesResult] = await Promise.all([
    getConsultingFullStats(),
    getAllConsultingRequests(reqFilters),
    getAllConsultingServices(svcFilters),
  ])

  const stats = statsResult.success ? statsResult.data : null

  // Use safeData to guarantee requests and services are always defined
  const requests = safeData(
    requestsResult,
    { items: [], pagination: { page: reqPage, pageSize, totalCount: 0, totalPages: 0 } }
  )

  const services = safeData(
    servicesResult,
    { items: [], pagination: { page: svcPage, pageSize, totalCount: 0, totalPages: 0 } }
  )

  return (
    <>
      <AdminHeader />
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Suspense fallback={<ConsultingPageSkeleton />}>
          <ConsultingPageClient
            initialTab={tab}
            stats={stats}
            initialRequests={requests.items as any}
            requestsPagination={requests.pagination}
            reqFilters={reqFilters}
            initialServices={services.items as any}
            servicesPagination={services.pagination}
            svcFilters={svcFilters}
          />
        </Suspense>
      </div>
    </>
  )
}