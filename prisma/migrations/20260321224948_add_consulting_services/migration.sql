-- CreateEnum
CREATE TYPE "ConsultingServiceTopic" AS ENUM ('sourcing', 'import', 'logistics', 'market_entry', 'supplier', 'other');

-- CreateEnum
CREATE TYPE "ConsultingDeliveryFormat" AS ENUM ('video_call', 'written_report', 'on_site', 'hybrid', 'async');

-- CreateTable
CREATE TABLE "ConsultingService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "shortDesc" TEXT,
    "shortDescAr" TEXT,
    "topic" "ConsultingServiceTopic" NOT NULL DEFAULT 'other',
    "category" TEXT,
    "categoryAr" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceFrom" DECIMAL(10,2),
    "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "duration" TEXT,
    "durationAr" TEXT,
    "deliveryFormat" "ConsultingDeliveryFormat",
    "includesEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includesAr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultingServiceImage" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultingServiceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultingServiceRequest" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultingServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultingService_isActive_isDeleted_idx" ON "ConsultingService"("isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "ConsultingService_topic_idx" ON "ConsultingService"("topic");

-- CreateIndex
CREATE INDEX "ConsultingService_isFeatured_idx" ON "ConsultingService"("isFeatured");

-- CreateIndex
CREATE INDEX "ConsultingService_sortOrder_idx" ON "ConsultingService"("sortOrder");

-- CreateIndex
CREATE INDEX "ConsultingService_requestCount_idx" ON "ConsultingService"("requestCount");

-- CreateIndex
CREATE INDEX "ConsultingService_addedById_idx" ON "ConsultingService"("addedById");

-- CreateIndex
CREATE INDEX "ConsultingService_createdAt_idx" ON "ConsultingService"("createdAt");

-- CreateIndex
CREATE INDEX "ConsultingServiceImage_serviceId_idx" ON "ConsultingServiceImage"("serviceId");

-- CreateIndex
CREATE INDEX "ConsultingServiceRequest_serviceId_idx" ON "ConsultingServiceRequest"("serviceId");

-- CreateIndex
CREATE INDEX "ConsultingServiceRequest_requestId_idx" ON "ConsultingServiceRequest"("requestId");

-- CreateIndex
CREATE INDEX "ConsultingServiceRequest_userId_idx" ON "ConsultingServiceRequest"("userId");

-- AddForeignKey
ALTER TABLE "ConsultingService" ADD CONSTRAINT "ConsultingService_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingServiceImage" ADD CONSTRAINT "ConsultingServiceImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ConsultingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingServiceRequest" ADD CONSTRAINT "ConsultingServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ConsultingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingServiceRequest" ADD CONSTRAINT "ConsultingServiceRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConsultingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingServiceRequest" ADD CONSTRAINT "ConsultingServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
