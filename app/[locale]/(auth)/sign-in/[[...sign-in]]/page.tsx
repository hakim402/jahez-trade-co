// app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx

import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/[locale]/_components/Header/Header";
import { FooterSection } from "@/app/[locale]/_components/Footer/FooterSection";
import { SignInClient } from "./SignInClient";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
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
    ? "تسجيل الدخول | جاهز - منصة التوريد من الصين"
    : "Sign In | JAHEZ - China Sourcing & Trading Platform";

  const description = isAr
    ? "سجل دخولك إلى حساب جاهز للوصول إلى خدمات التوريد من الصين، الاستيراد إلى الولايات المتحدة والإمارات ودبي واليمن، وتتبع طلباتك."
    : "Sign in to your JAHEZ account to access China sourcing services, import solutions for USA, UAE, Dubai & Yemen, and track your orders.";

  return {
    title,
    description,
    keywords: isAr
      ? "تسجيل الدخول, جاهز, التوريد من الصين, الاستيراد, الولايات المتحدة, الإمارات, دبي, اليمن"
      : "sign in, JAHEZ, China sourcing, import, USA, UAE, Dubai, Yemen, trading company",
    alternates: {
      canonical: `https://jahez.online/${locale}/sign-in`,
      languages: {
        en: `https://jahez.online/en/sign-in`,
        ar: `https://jahez.online/ar/sign-in`,
        "x-default": `https://jahez.online/en/sign-in`,
      },
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `https://jahez.online/${locale}/sign-in`,
      siteName: isAr ? "جاهز" : "JAHEZ TRADE CO",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: [
        {
          url: "https://jahez.online/images/signin-og.jpg",
          width: 1200,
          height: 630,
          alt: isAr ? "تسجيل الدخول إلى جاهز" : "Sign In to JAHEZ TRADE CO",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://jahez.online/images/signin-og.jpg"],
    },
  };
}

export default async function SignInPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "تسجيل الدخول" : "Sign In", url: `/${locale}/sign-in` },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <SignInClient locale={locale} isAr={isAr} />
      <FooterSection />
    </main>
  );
}