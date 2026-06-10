// app/[locale]/layout.tsx

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, arSA } from "@clerk/localizations";
import { SetHtmlLangDir } from "./_components/SetHTML/set-html-lang";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: locale === "ar" ? "جاهز" : "JAHEZ",
    url: "https://jahez.online",
    logo: "https://jahez.online/logo.png",
    description:
      locale === "ar"
        ? "جاهز تقدم خدمات التوريد من الصين، طلب عروض الأسعار، مكالمات فيديو مباشرة من الأسواق، والاستشارات التجارية."
        : "JAHEZ provides China product sourcing, quotation requests, live market video calls, product inspection, shipping support, and business consulting services.",
    sameAs: [],
  };

  return (
    <>
      <SetHtmlLangDir locale={locale} />

      <script
        id="schema-organization"
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