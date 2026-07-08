// app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx

import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/[locale]/_components/Header/Header";
import { FooterSection } from "@/app/[locale]/_components/Footer/FooterSection";
import { SignUpClient } from "./SignUpClient";

// ─── SEO IMPORTS ─────────────────────────────
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ─── DYNAMIC METADATA ─────────────────────────
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr
    ? "إنشاء حساب | جاهز - منصة التوريد من الصين"
    : "Sign Up | JAHEZ - China Sourcing & Trading Platform";

  const description = isAr
    ? "أنشئ حسابك على جاهز للوصول إلى خدمات التوريد من الصين، الاستيراد إلى الولايات المتحدة والإمارات ودبي واليمن، وإدارة طلباتك."
    : "Create your JAHEZ account to access China sourcing services, import solutions for USA, UAE, Dubai & Yemen, and manage your orders.";

  return {
    title,
    description,
    keywords: isAr
      ? "إنشاء حساب, جاهز, التوريد من الصين, الاستيراد, الولايات المتحدة, الإمارات, دبي, اليمن, تجارة عالمية"
      : "sign up, JAHEZ, China sourcing, import, USA, UAE, Dubai, Yemen, global trade, trading company",
    alternates: {
      canonical: `https://jahez.online/${locale}/sign-up`,
      languages: {
        en: `https://jahez.online/en/sign-up`,
        ar: `https://jahez.online/ar/sign-up`,
        "x-default": `https://jahez.online/en/sign-up`,
      },
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `https://jahez.online/${locale}/sign-up`,
      siteName: isAr ? "جاهز" : "JAHEZ TRADE CO",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: [
        {
          url: "https://jahez.online/images/signup-og.jpg",
          width: 1200,
          height: 630,
          alt: isAr ? "إنشاء حساب على جاهز" : "Sign Up for JAHEZ TRADE CO",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://jahez.online/images/signup-og.jpg"],
    },
  };
}

export default async function SignUpPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "إنشاء حساب" : "Sign Up", url: `/${locale}/sign-up` },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <SignUpClient locale={locale} isAr={isAr} />
      <FooterSection />
    </main>
  );
}