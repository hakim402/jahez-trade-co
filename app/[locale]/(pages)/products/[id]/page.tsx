// app/[locale]/(pages)/products/[id]/page.tsx

import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { ProductGallery } from "../_components/ProductGallery"
import { RequestProductButton } from "../_components/RequestProductButton"
import { ProductBreadcrumb } from "../_components/ProductBreadcrumb"
import { RelatedProducts } from "../_components/RelatedProducts"
import { Badge } from "@/components/ui/badge"
import { Flame, Globe, Tag, TrendingUp, Eye, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import {
  getPublicProductById,
  incrementProductView,
} from "../actions"
import { Header } from "@/app/[locale]/_components/Header/Header"

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getPublicProductById(id)
  if (!product) return { title: "Product Not Found" }
  return {
    title: product.name,
    description: product.shortDesc ?? product.description ?? undefined,
    openGraph: {
      images: product.images[0] ? [product.images[0].url] : [],
    },
  }
}

const COUNTRY_FLAGS: Record<string, string> = {
  CN: "🇨🇳", US: "🇺🇸", SA: "🇸🇦", AE: "🇦🇪", YE: "🇾🇪", TR: "🇹🇷", IN: "🇮🇳",
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const locale  = await getLocale()
  const isAr    = locale === "ar"

  const product = await getPublicProductById(id)
  if (!product) notFound()

  // If product exists but is inactive, show unavailable message
  if (!product.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Header />
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {isAr ? "المنتج غير متاح حالياً" : "Product unavailable"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isAr ? "هذا المنتج غير متاح في الوقت الحالي." : "This product is not currently available."}
          </p>
          <Link
            href={`/${locale}/products`}
            className="text-sm text-[#7b57fc] hover:underline"
          >
            {isAr ? "تصفح المنتجات الأخرى" : "Browse other products"}
          </Link>
        </div>
      </div>
    )
  }

  // Serialize Prisma Decimal → number | null (cannot cross server/client boundary)
  const estimatedPrice = product.estimatedPrice !== null ? Number(product.estimatedPrice) : null

  // Increment view count non-blocking
  incrementProductView(id).catch(() => {})

  const name     = isAr && product.nameAr     ? product.nameAr     : product.name
  const desc     = isAr && product.descriptionAr ? product.descriptionAr : product.description
  const shortDesc = isAr && product.shortDescAr  ? product.shortDescAr  : product.shortDesc
  const category = isAr && product.categoryAr   ? product.categoryAr   : product.category

  const trendColor =
    product.trendScore >= 80 ? "text-red-500"    :
    product.trendScore >= 60 ? "text-orange-500" :
    product.trendScore >= 40 ? "text-amber-500"  :
    "text-muted-foreground"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">

        {/* Breadcrumb + Back */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/${locale}/products`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#7b57fc] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAr ? "العودة للمنتجات" : "Back to Products"}
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-sm text-foreground truncate max-w-50">{name}</span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Left: Gallery ── */}
          <ProductGallery images={product.images} name={name} />

          {/* ── Right: Info ── */}
          <div className={`flex flex-col gap-5 ${isAr ? "text-right" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.isFeatured && (
                <Badge className="bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/20 hover:bg-[#7b57fc]/10 gap-1">
                  <Flame className="w-3 h-3" />
                  {isAr ? "مميز" : "Featured"}
                </Badge>
              )}
              {product.trendScore >= 60 && (
                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/10 gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {isAr ? "رائج" : "Trending"}
                </Badge>
              )}
              {category && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="w-3 h-3" />
                  {category}
                </Badge>
              )}
              {product.sourceCountry && (
                <Badge variant="outline" className="gap-1">
                  {COUNTRY_FLAGS[product.sourceCountry] ?? "🌍"}
                  {isAr ? "المصدر" : "Source"}: {product.sourceCountry}
                </Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {name}
              </h1>
              {/* Show both names if available */}
              {isAr && product.name && product.nameAr && product.name !== product.nameAr && (
                <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
              )}
            </div>

            {/* Short desc */}
            {shortDesc && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {shortDesc}
              </p>
            )}

            {/* Price */}
            {estimatedPrice !== null && (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#7b57fc] tabular-nums">
                  {estimatedPrice.toLocaleString()}
                </span>
                <span className="text-base text-muted-foreground">{product.currency}</span>
                <span className="text-xs text-muted-foreground/70 ml-1">
                  ({isAr ? "سعر تقديري" : "estimated"})
                </span>
              </div>
            )}

            {/* Stats strip */}
            <div className="flex items-center gap-5 py-3 border-y border-border/50">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span className="tabular-nums">{product.viewCount.toLocaleString()}</span>
                <span className="text-xs">{isAr ? "مشاهدة" : "views"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span className="tabular-nums">{product._count.relatedRequests}</span>
                <span className="text-xs">{isAr ? "طلب" : "requests"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm ml-auto">
                <Flame className={`w-3.5 h-3.5 ${trendColor}`} />
                <span className={`font-semibold tabular-nums ${trendColor}`}>{product.trendScore}</span>
                <span className="text-xs text-muted-foreground">{isAr ? "نقطة" : "pts"}</span>
              </div>
            </div>

            {/* Full description */}
            {desc && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {isAr ? "الوصف" : "Description"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {desc}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Supplier row */}
            {(product.supplier || product.sourceCountry) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isAr ? "المورد" : "Supplier"}:&nbsp;
                  <span className="text-foreground font-medium">
                    {product.supplier ?? product.sourceCountry}
                    {product.sourceCountry && COUNTRY_FLAGS[product.sourceCountry] && (
                      <span className="ml-1">{COUNTRY_FLAGS[product.sourceCountry]}</span>
                    )}
                  </span>
                </span>
              </div>
            )}

            {/* CTA — Request button */}
            <div className="pt-2">
              <RequestProductButton
                productId={product.id}
                productName={name}
                isAr={isAr}
              />
            </div>

            {/* Trust note */}
            <p className="text-xs text-muted-foreground/60 text-center">
              {isAr
                ? "🔒 سعرك النهائي سيُحدَّد بعد مراجعة طلبك من قِبَل فريقنا"
                : "🔒 Final price is confirmed after our team reviews your request"}
            </p>
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts
          currentId={product.id}
          category={product.category}
          isAr={isAr}
        />
      </div>
    </div>
  )
}