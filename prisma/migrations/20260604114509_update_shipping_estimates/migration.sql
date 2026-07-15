-- CreateEnum
CREATE TYPE "public"."FreightType" AS ENUM ('AIR', 'SEA', 'LAND', 'EXPRESS');

-- AlterTable
ALTER TABLE "public"."ShippingEstimate" ADD COLUMN     "baseFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chargeableWeightKg" DECIMAL(10,3),
ADD COLUMN     "heightCm" DECIMAL(10,2),
ADD COLUMN     "lengthCm" DECIMAL(10,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ratePerKg" DECIMAL(10,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "widthCm" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."TrendingProduct" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "slugAr" TEXT;

-- CreateIndex
CREATE INDEX "ShippingEstimate_createdAt_idx" ON "public"."ShippingEstimate"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ShippingEstimate_originCountry_destinationCountry_idx" ON "public"."ShippingEstimate"("originCountry" ASC, "destinationCountry" ASC);

-- CreateIndex
CREATE INDEX "TrendingProduct_slugAr_idx" ON "public"."TrendingProduct"("slugAr" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingProduct_slugAr_key" ON "public"."TrendingProduct"("slugAr" ASC);

-- CreateIndex
CREATE INDEX "TrendingProduct_slug_idx" ON "public"."TrendingProduct"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingProduct_slug_key" ON "public"."TrendingProduct"("slug" ASC);

-- AddForeignKey
ALTER TABLE "public"."ShippingEstimate" ADD CONSTRAINT "ShippingEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

