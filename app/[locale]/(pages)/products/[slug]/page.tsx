// app/[locale]/(pages)/products/[slug]/page.tsx

import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ProductGallery } from "../_components/ProductGallery";
import { RequestProductButton } from "../_components/RequestProductDialog";
import { RelatedProducts } from "../_components/RelatedProducts";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Globe,
  Tag,
  TrendingUp,
  Eye,
  Package,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicProductBySlug, incrementProductView } from "../actions";
import { getProductSlug } from "../_lib/product-url";
import { Header } from "@/app/[locale]/_components/Header/Header";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import ProductSchema from "@/components/seo/ProductSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Map country code to SVG flag component
const COUNTRY_FLAG_COMPONENT: Record<string, React.ElementType> = {
  CN,
  US,
  SA,
  AE,
  YE,
};

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const isAr = locale === "ar";
  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const description =
    (isAr && product.shortDescAr ? product.shortDescAr : product.shortDesc) ??
    (isAr && product.descriptionAr ? product.descriptionAr : product.description) ??
    undefined;

  const slugValue = getProductSlug(product as any); // ✅ FIXED: cast to any
  const imageUrl = product.images?.[0]?.url || null;

  return generatePageMetadata({
    pageType: "product",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: `products/${slugValue}`,
    customTitle: name,
    customDescription: description,
    ogImageUrl: imageUrl,
    ogImageAlt: name,
    modifiedDate: product.updatedAt,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();

  // Show unavailable screen if product exists but is inactive
  if (!product.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {isAr ? "المنتج غير متاح حالياً" : "Product unavailable"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isAr
                ? "هذا المنتج غير متاح في الوقت الحالي."
                : "This product is not currently available."}
            </p>
            <Link
              href={`/${locale}/products`}
              className="text-sm text-[#7b57fc] hover:underline"
            >
              {isAr ? "تصفح المنتجات الأخرى" : "Browse other products"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // estimatedPrice is already number | null — serialized by getPublicProductBySlug
  const estimatedPrice = product.estimatedPrice;

  // Fire-and-forget view count (keyed by id — stable regardless of slug changes)
  incrementProductView(product.id).catch(() => {});

  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const desc =
    isAr && product.descriptionAr ? product.descriptionAr : product.description;
  const shortDesc =
    isAr && product.shortDescAr ? product.shortDescAr : product.shortDesc;
  const category =
    isAr && product.categoryAr ? product.categoryAr : product.category;

  const trendColor =
    product.trendScore >= 80
      ? "text-red-500"
      : product.trendScore >= 60
        ? "text-orange-500"
        : product.trendScore >= 40
          ? "text-amber-500"
          : "text-muted-foreground";

  const FlagComponent = product.sourceCountry
    ? COUNTRY_FLAG_COMPONENT[product.sourceCountry]
    : null;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "المنتجات" : "Products", url: `/${locale}/products` },
    { name: name, url: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <ProductSchema product={product as any} locale={locale as "en" | "ar"} />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 mt-10">
        {/* Back + breadcrumb */}
        <div
          className="flex items-center gap-3 mb-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          <Link
            href={`/${locale}/products`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#7b57fc] transition-colors"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
            {isAr ? "العودة للمنتجات" : "Back to Products"}
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-sm text-foreground truncate max-w-50">
            {name}
          </span>
        </div>

        {/* Main grid - unchanged from your original */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images} name={name} />

          {/* Info */}
          <div
            className={`flex flex-col gap-5 ${isAr ? "text-right" : "text-left"}`}
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* Badges */}
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
              {FlagComponent && (
                <Badge variant="outline" className="gap-1">
                  <FlagComponent className="w-4 h-4" />
                  {isAr ? "المصدر" : "Source"}: {product.sourceCountry}
                </Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {name}
              </h1>
              {isAr &&
                product.name &&
                product.nameAr &&
                product.name !== product.nameAr && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.name}
                  </p>
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
                <span className="text-base text-muted-foreground">
                  {product.currency}
                </span>
                <span className="text-xs text-muted-foreground/70 ml-1">
                  ({isAr ? "سعر تقديري" : "estimated"})
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-5 py-3 border-y border-border/50">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {product.viewCount.toLocaleString()}
                </span>
                <span className="text-xs">{isAr ? "مشاهدة" : "views"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {product._count.relatedRequests}
                </span>
                <span className="text-xs">{isAr ? "طلب" : "requests"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm ml-auto">
                <Flame className={`w-3.5 h-3.5 ${trendColor}`} />
                <span className={`font-semibold tabular-nums ${trendColor}`}>
                  {product.trendScore}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isAr ? "نقطة" : "pts"}
                </span>
              </div>
            </div>

            {/* Full desc */}
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

            {/* Supplier */}
            {(product.supplier || product.sourceCountry) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isAr ? "المورد" : "Supplier"}:&nbsp;
                  <span className="text-foreground font-medium flex items-center gap-1">
                    {product.supplier ?? product.sourceCountry}
                    {FlagComponent && <FlagComponent className="w-4 h-4" />}
                  </span>
                </span>
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              <RequestProductButton
                product={{
                  id: product.id,
                  name: product.name,
                  nameAr: product.nameAr,
                  slug,
                  shortDesc: product.shortDesc,
                  shortDescAr: product.shortDescAr,
                  description: product.description,
                  sourceUrl: product.sourceUrl,
                  supplier: product.supplier,
                  estimatedPrice: product.estimatedPrice,
                  currency: product.currency,
                  imageUrl: product.images[0]?.url ?? null,
                }}
                variant="detail"
              />
            </div>

            {/* Trust note */}
            <p className="text-xs text-muted-foreground/60 text-center">
              {isAr
                ? " سعرك النهائي سيُحدَّد بعد مراجعة طلبك من قِبَل فريقنا"
                : " Final price confirmed after our team reviews your request"}
            </p>
          </div>
        </div>

        {/* Related */}
        <RelatedProducts
          currentId={product.id}
          category={product.category}
          isAr={isAr}
        />
      </div>
    </div>
  );
}