import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, arSA } from "@clerk/localizations";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ShippingEstimationButton } from "./_components/ShippingEstimation/ShippingEstimationButton";
import "../globals.css";
import "flag-icons/css/flag-icons.min.css";

// ─── NEW SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import  OrganizationSchema  from "@/components/seo/OrganizationSchema";

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

// ─── DYNAMIC METADATA ─────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "home",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
  });
}

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

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body>
        {/* ─── ORGANIZATION SCHEMA (Replaces inline script) ─── */}
        <OrganizationSchema />

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