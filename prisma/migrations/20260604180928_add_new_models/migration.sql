-- AlterTable
ALTER TABLE "ShippingEstimate" ADD COLUMN     "calculationMode" TEXT NOT NULL DEFAULT 'PER_KG',
ADD COLUMN     "goodsType" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ratePerCbm" DECIMAL(10,2),
ALTER COLUMN "weightKg" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "freightType" TEXT NOT NULL,
    "calculationMode" TEXT NOT NULL DEFAULT 'PER_KG',
    "goodsType" TEXT,
    "baseFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ratePerKg" DECIMAL(10,2),
    "ratePerCbm" DECIMAL(10,2),
    "minCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transitDaysMin" INTEGER,
    "transitDaysMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingRate_originCountry_destinationCountry_idx" ON "ShippingRate"("originCountry", "destinationCountry");

-- CreateIndex
CREATE INDEX "ShippingRate_freightType_idx" ON "ShippingRate"("freightType");

-- CreateIndex
CREATE INDEX "ShippingRate_calculationMode_idx" ON "ShippingRate"("calculationMode");

-- CreateIndex
CREATE INDEX "ShippingRate_isActive_idx" ON "ShippingRate"("isActive");

-- CreateIndex
CREATE INDEX "ShippingEstimate_calculationMode_idx" ON "ShippingEstimate"("calculationMode");
