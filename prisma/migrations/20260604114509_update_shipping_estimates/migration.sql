CREATE TYPE "FreightType" AS ENUM ('AIR', 'SEA', 'LAND', 'EXPRESS');

ALTER TABLE "ShippingEstimate"
ADD COLUMN IF NOT EXISTS "baseFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "chargeableWeightKg" DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS "heightCm" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "lengthCm" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "ratePerKg" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "widthCm" DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS "ShippingEstimate_createdAt_idx"
ON "ShippingEstimate"("createdAt");

CREATE INDEX IF NOT EXISTS "ShippingEstimate_originCountry_destinationCountry_idx"
ON "ShippingEstimate"("originCountry", "destinationCountry");

ALTER TABLE "ShippingEstimate"
ADD CONSTRAINT "ShippingEstimate_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;