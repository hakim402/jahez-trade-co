-- AlterTable: ProductRequest - make clientId nullable + add guest fields
ALTER TABLE "ProductRequest"
  ALTER COLUMN "clientId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "guestFullName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestEmail"    TEXT,
  ADD COLUMN IF NOT EXISTS "guestPhone"    TEXT;

-- AlterTable: VideoBooking - make clientId nullable + add guest fields
ALTER TABLE "VideoBooking"
  ALTER COLUMN "clientId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "guestFullName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestEmail"    TEXT,
  ADD COLUMN IF NOT EXISTS "guestPhone"    TEXT;
