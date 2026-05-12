// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, arSA } from "@clerk/localizations";
import { SetHtmlLangDir } from "./_components/SetHTML/set-html-lang";
import { Metadata } from "next";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const baseUrl = "https://jahez.online";

  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      en: `${baseUrl}/en`,
      ar: `${baseUrl}/ar`,
    },
  };

  return {
    title:
      locale === "ar"
        ? "جاهز - متتبع منتجاتك الشخصية"
        : "JAHEZ - Your Personal Products Tracker",
    description:
      locale === "ar"
        ? "جاهز هو تطبيق ويب متطور يساعدك على تتبع وإدارة منتجاتك المفضلة بسهولة."
        : "JAHEZ is a cutting-edge web application designed to help you effortlessly track and manage your favorite products.",
    alternates,
    openGraph: {
      title:
        locale === "ar"
          ? "جاهز - متتبع منتجاتك الشخصية"
          : "JAHEZ - Your Personal Products Tracker",
      description:
        locale === "ar"
          ? "تتبع منتجاتك المفضلة بكل سهولة"
          : "Track your favorite products effortlessly",
      url: `${baseUrl}/${locale}`,
      siteName: locale === "ar" ? "جاهز" : "JAHEZ",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title:
        locale === "ar"
          ? "جاهز - متتبع منتجاتك الشخصية"
          : "JAHEZ - Your Personal Products Tracker",
      description:
        locale === "ar"
          ? "تتبع منتجاتك المفضلة بكل سهولة"
          : "Track your favorite products effortlessly",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const localizationMap = {
    en: enUS,
    ar: arSA,
  };

  // JSON-LD WebSite schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: locale === "ar" ? "جاهز" : "JAHEZ",
    url: `https://jahez.online/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `https://jahez.online/${locale}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* Set HTML lang + dir safely */}
      <SetHtmlLangDir locale={locale} />

      {/*
        JSON-LD structured data.
        Use a plain <script> tag — NOT next/script's <Script>.
        React 19 (used by Next.js 15+) automatically hoists plain <script> tags
        with type="application/ld+json" to <head> on the server, so they are
        never executed on the client and never trigger the React warning.
      */}
      <script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ClerkProvider
        localization={localizationMap[locale as "en" | "ar"]}
        appearance={{
          cssLayerName: "clerk",
          variables: {
            colorBackground: "var(--primary-foreground)",
            colorForeground: "var(--primary)",
            colorInput: "var(--color-input)",
            colorPrimary: "var(--indigo)",
            colorText: "var(--foreground)",
          },
        }}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </ClerkProvider>
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}