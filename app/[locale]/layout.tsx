// app/[locale]/layout.tsx

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, arSA } from "@clerk/localizations";
import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ShippingEstimationButton } from "./_components/ShippingEstimation/ShippingEstimationButton";
import "../globals.css";
import "flag-icons/css/flag-icons.min.css";

const inter = Roboto({
  subsets: ["latin"],
  variable: "--font-en",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-ar",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jahez.online"),
  title: {
    template: "%s | JAHEZ TRADE CO",
    default: "JAHEZ TRADE CO China Product Sourcing & Import Services",
  },
  description:
    "JAHEZ TRADE CO helps businesses source products from China, request quotations, book live market video calls, and get product sourcing, inspection, shipping, and business consulting services.",
  verification: {
    google: "nZi9ngdAitHA46eBbJIOdPwpAQcfe7a2PRaB1R6LR68",
  },
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enables static rendering for this locale — must be called in every
  // server component (layout or page) under [locale] that reads locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const localizationMap = {
    en: enUS,
    ar: arSA,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: isAr ? "جاهز" : "JAHEZ",
    url: "https://jahez.online",
    logo: "https://jahez.online/logo.png",
    description: isAr
      ? "جاهز تقدم خدمات التوريد من الصين، طلب عروض الأسعار، مكالمات فيديو مباشرة من الأسواق، والاستشارات التجارية."
      : "JAHEZ TRADE CO provides China product sourcing, quotation requests, live market video calls, product inspection, shipping support, and business consulting services.",
    sameAs: [],
  };

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body>
        <Script
          id="schema-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
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
            <ThemeProvider>
              {children}
              <Toaster />
              <WhatsAppButton />
              <ShippingEstimationButton />
            </ThemeProvider>
          </NextIntlClientProvider>
        </ClerkProvider>

        <GoogleAnalytics gaId="G-BTTGNXH9T3" />
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}