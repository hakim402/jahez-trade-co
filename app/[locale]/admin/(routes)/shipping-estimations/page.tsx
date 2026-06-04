import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminHeader } from "../../_components/AdminHeader";
import { getShippingEstimates, getShippingRates } from "./actions";
import { ShippingEstimationsClient } from "./_components/ShippingEstimationsClient";
import { ShippingEstimationsSkeleton } from "./_components/ShippingEstimationsSkeleton";
import type { CalculationMode } from "./actions";

export const metadata: Metadata = {
  title: "Shipping Estimations | Admin",
};

export default async function ShippingEstimationsPage() {
  const [rates, estimates] = await Promise.all([
    getShippingRates(),
    getShippingEstimates(),
  ]);

  const serializedRates = rates.map((rate) => ({
    ...rate,
    calculationMode: rate.calculationMode as CalculationMode,
    createdAt: rate.createdAt.toISOString(),
    updatedAt: rate.updatedAt.toISOString(),
  }));

  const serializedEstimates = estimates.map((estimate) => ({
    ...estimate,
    createdAt: estimate.createdAt.toISOString(),
    updatedAt: estimate.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />

      <Suspense fallback={<ShippingEstimationsSkeleton />}>
        <ShippingEstimationsClient
          initialRates={serializedRates}
          initialEstimates={serializedEstimates}
        />
      </Suspense>
    </div>
  );
}