// app/[locale]/(pages)/services/[id]/page.tsx

import type { Metadata }   from "next"
import { notFound }        from "next/navigation"
import { getDetailPageData } from "../actions"
import { ServiceDetailClient } from "./_components/ServiceDetailClient"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  const isAr = locale === "ar"
  const result = await getDetailPageData(id, 3)
  if (!result.success) return { title: "Service | Mewan" }
  const s = result.data.service
  return {
    title:       `${(isAr ? s.titleAr : null) ?? s.title} | Mewan`,
    description: (isAr ? s.shortDescAr : null) ?? s.shortDesc ?? undefined,
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params
  const isAr  = locale === "ar"
  const result = await getDetailPageData(id, 3)
  if (!result.success) notFound()
  const { service, related } = result.data

  return (
    <ServiceDetailClient
      service={service}
      related={related}
      isAr={isAr}
    />
  )
}