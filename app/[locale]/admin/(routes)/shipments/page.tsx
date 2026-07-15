import { getShipments, getShipmentStats } from "./actions";
import { ShipmentsPageClient } from "./_components/ShipmentsPageClient";

export default async function AdminShipmentsPage() {
  const [shipmentsResult, statsResult] = await Promise.all([
    getShipments({ page: 1, pageSize: 20 }),
    getShipmentStats(),
  ]);

  console.log("[AdminShipmentsPage] shipmentsResult:", shipmentsResult);
  console.log("[AdminShipmentsPage] statsResult:", statsResult);

  const initialShipments = shipmentsResult.success ? shipmentsResult.data.shipments : [];
  const initialTotal = shipmentsResult.success ? shipmentsResult.data.total : 0;
  const stats = statsResult.success
    ? statsResult.data
    : { total: 0, inTransit: 0, delivered: 0, delayed: 0 };

  const error = shipmentsResult.success ? null : shipmentsResult.error;

  return (
    <ShipmentsPageClient
      initialShipments={initialShipments}
      initialTotal={initialTotal}
      stats={stats}
      error={error}
    />
  );
}