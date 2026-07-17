// app/[locale]/admin/(routes)/shipments/[id]/page.tsx

import Link from "next/link";
import { ArrowLeft, PackageX } from "lucide-react";
import { getShipmentById } from "../actions";
import { ShipmentDetailClient } from "./_components/ShipmentDetailClient";
import { AdminHeader } from "../../../_components/AdminHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShipmentById(id);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      {result.success ? (
        <ShipmentDetailClient shipment={result.data} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <PackageX className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-red-700">Couldn&apos;t load this shipment</p>
          <p className="max-w-md text-xs text-red-600">{result.error}</p>
          <Link href="/admin/shipments" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#7b57fc] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Shipments
          </Link>
        </div>
      )}
    </div>
  );
}
