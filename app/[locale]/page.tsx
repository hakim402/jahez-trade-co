import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Header } from "./_components/Header/Header";
import { FeatureSections } from "./_components/Features/FeaturesSection";
import { VideoBookingSections } from "./_components/Features/VideoBookingSection";
import { HomeHero } from "./_components/Hero/HomeHero";
import { HowItWorks } from "./_components/HowItWork/HowItWorks";
import { FooterSection } from "./_components/Footer/FooterSection";
import { FooterHero } from "./_components/Footer/FooterHero";
import { HowWeOperate } from "./(pages)/about/_components/HowWeOperate";
import { MissionValues } from "./(pages)/about/_components/MissionValues";
import { ServicesShowcase } from "./(pages)/services/_components/ServicesShowcase";
import EmployeeShowcase from "./_components/Employees/EmployeeShowcase";
import { TrendingProductsSection } from "./(pages)/products/_components/TrendingProducts/TrendingProductsSection";
import HomeBlogShowCase from "./(pages)/blogs/_components/HomeBlogShowCase/HomeBlogShowCase";

// ─── NEW SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BlogSchema from "@/components/seo/BlogSchema";
import ProductSchema from "@/components/seo/ProductSchema";
import ServiceSchema from "@/components/seo/ServiceSchema";
import { getFeaturedPosts } from "./(pages)/blogs/actions";
import { getTrendingProducts } from "./(pages)/products/actions";
import { getFeaturedConsultingServices } from "./(pages)/services/actions";


export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

// ─── SIMPLIFIED METADATA ─────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "home",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
  });
}

// ─── HOMEPAGE COMPONENT ──────────────────────────
export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  // Fetch data for schemas
  const featuredPosts = await getFeaturedPosts(locale as "en" | "ar", 3);
  const trendingProducts = await getTrendingProducts(6);
  const featuredServices = await getFeaturedConsultingServices(3);

  return (
    <div>
      {/* ─── SCHEMA MARKUP FOR HOME ─────────────────── */}
      
      {/* Blog Schema: Featured Posts (cast to `any` to bypass strict type check) */}
      {featuredPosts.success &&
        featuredPosts.data.slice(0, 3).map((post) => (
          <Suspense key={post.id} fallback={null}>
            <BlogSchema post={post as any} locale={locale as "en" | "ar"} />
          </Suspense>
        ))}

      {/* Product Schema: Trending Products (cast to `any`) */}
      {trendingProducts.slice(0, 3).map((product) => (
        <Suspense key={product.id} fallback={null}>
          <ProductSchema product={product as any} locale={locale as "en" | "ar"} />
        </Suspense>
      ))}

      {/* Service Schema: Featured Services (cast to `any`) */}
      {featuredServices.slice(0, 3).map((service) => (
        <Suspense key={service.id} fallback={null}>
          <ServiceSchema service={service as any} locale={locale as "en" | "ar"} />
        </Suspense>
      ))}

      {/* ─── UI COMPONENTS (unchanged) ────────────── */}
      <Header />
      <HomeHero />
      <TrendingProductsSection />
      <FeatureSections />
      <HowWeOperate isAr={isAr} locale={locale} />
      <HomeBlogShowCase locale={locale as "en" | "ar"} />
      <VideoBookingSections />
      <MissionValues isAr={isAr} />
      <HowItWorks />
      <ServicesShowcase
        isAr={isAr}
        heading={isAr ? "خدماتنا" : "Our Services"}
        subheading={
          isAr
            ? "نقدم حلول توريد واستيراد واستشارات تجارية موثوقة لمساعدة أعمالك على النمو."
            : "We provide reliable sourcing, import, and business consulting solutions to help your business grow."
        }
      />
      <EmployeeShowcase locale={locale as "en" | "ar"} />
      <FooterHero />
      <FooterSection />
    </div>
  );
}