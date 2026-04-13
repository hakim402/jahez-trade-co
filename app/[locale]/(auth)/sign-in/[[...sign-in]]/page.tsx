// app/[locale]/(auth)/sign-in/page.tsx
import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/[locale]/_components/Header/Header";
import { FooterSection } from "@/app/[locale]/_components/Footer/FooterSection";
import { SignInClient } from "./SignInClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const baseUrl = "https://jahez.online";

  const title = isAr ? "تسجيل الدخول | جاهز" : "Sign In | JAHEZ";
  const description = isAr
    ? "سجل دخولك إلى حسابك على جاهز للوصول إلى المنتجات الرائجة وخدمات الاستشارة وتتبع الطلبات."
    : "Sign in to your JAHEZ account to access trending products, consulting services, and order tracking.";

  const alternates = {
    canonical: `${baseUrl}/${locale}/sign-in`,
    languages: {
      en: `${baseUrl}/en/sign-in`,
      ar: `${baseUrl}/ar/sign-in`,
    },
  };

  const ogImage = {
    url: `${baseUrl}/images/signin-og.jpg`,
    width: 1200,
    height: 630,
    alt: isAr ? "تسجيل الدخول إلى جاهز" : "Sign In to JAHEZ",
  };

  return {
    title,
    description,
    alternates,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/sign-in`,
      siteName: isAr ? "جاهز" : "JAHEZ",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage,
    },
  };
}

export default async function SignInPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* <Header /> */}
      <SignInClient locale={locale} isAr={isAr} />
      <FooterSection />
    </main>
  );
}