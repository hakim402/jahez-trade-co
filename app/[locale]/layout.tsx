// app/[locale]/layout.tsx

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ReactNode } from "react";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS, arSA } from "@clerk/localizations";

import { SetHtmlLangDir } from "@/app/[locale]/_components/SetHTML/set-html-lang";

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

  return (
    <>
      {/* ✅ Safely update html lang + dir */}
      <SetHtmlLangDir locale={locale} />

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