import { getShipmentById } from "../actions";
import { ShipmentDetailClient } from "./_components/ShipmentDetailClient";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShipmentById(id);

  if (!result.success) {
    // Instead of 404, render an error page with the message
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Shipment</h1>
          <p className="text-muted-foreground">{result.error || "The shipment could not be loaded."}</p>
          <a
            href="/admin/shipments"
            className="inline-flex items-center px-4 py-2 bg-[#7b57fc] text-white rounded-lg hover:bg-[#6845e8]"
          >
            ← Back to Shipments
          </a>
        </div>
      </div>
    );
  }

  return <ShipmentDetailClient shipment={result.data} />;
}