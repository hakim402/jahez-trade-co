// app/[locale]/dashboard/(routes)/shipments/page.tsx

import type { Metadata } from "next";
import { getMyShipments } from "./actions";
import { MyShipmentsClient } from "./_components/MyShipmentsClient";
import { ClientHeader } from "../../_components/ClientHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "My Shipments | Dashboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardShipmentsPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const result = await getMyShipments();
  const shipments = result.success ? result.data : [];

  return (
    <>
      <ClientHeader />
      <div
        className={`flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen max-w-7xl m-auto ${isAr ? "rtl" : "ltr"}`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <MyShipmentsClient shipments={shipments} locale={locale} isAr={isAr} />
      </div>
    </>
  );
}
