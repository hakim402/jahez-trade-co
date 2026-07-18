// app/[locale]/(pages)/track/[code]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { PackageX } from "lucide-react";
import { Header } from "../../../_components/Header/Header";
import { FooterHero } from "../../../_components/Footer/FooterHero";
import { FooterSection } from "../../../_components/Footer/FooterSection";
import { getPublicShipmentByCode } from "../actions";
import { TrackResult } from "../_components/TrackResult";

interface PageProps {
  params: Promise<{ locale: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, code } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? `تتبع ${code} | جاهز` : `Track ${code} | JAHEZ Trade Co.`,
    robots: { index: false, follow: false },
  };
}

export default async function TrackResultPage({ params }: PageProps) {
  const { locale, code } = await params;
  const isAr = locale === "ar";
  const result = await getPublicShipmentByCode(code);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <div className="mb-28">

      <Header />
      </div>
      {result.success ? (
        <TrackResult shipment={result.data} locale={locale} />
      ) : (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <PackageX className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">
            {isAr ? "لم يتم العثور على الشحنة" : "Shipment Not Found"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{result.error}</p>
          <Link href={`/${locale}/track`} className="text-sm font-medium text-[#7b57fc] hover:underline">
            {isAr ? "جرّب رمزاً آخر" : "Try another tracking code"}
          </Link>
        </div>
      )}
      <FooterHero />
      <FooterSection />
    </main>
  );
}
