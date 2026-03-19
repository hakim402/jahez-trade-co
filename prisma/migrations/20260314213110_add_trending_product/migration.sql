-- CreateTable
CREATE TABLE "TrendingProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "shortDesc" TEXT,
    "shortDescAr" TEXT,
    "estimatedPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceCountry" TEXT,
    "sourceUrl" TEXT,
    "supplier" TEXT,
    "category" TEXT,
    "categoryAr" TEXT,
    "tags" TEXT[],
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "addedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendingProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingProductRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendingProductRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "templateKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'twilio',
    "externalId" TEXT,
    "userId" TEXT,
    "requestId" TEXT,
    "quoteId" TEXT,
    "bookingId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingEstimate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "weightKg" DECIMAL(10,3) NOT NULL,
    "volumeCbm" DECIMAL(10,4),
    "freightType" TEXT NOT NULL,
    "estimatedCost" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "transitDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendingProduct_isActive_isDeleted_idx" ON "TrendingProduct"("isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "TrendingProduct_trendScore_idx" ON "TrendingProduct"("trendScore");

-- CreateIndex
CREATE INDEX "TrendingProduct_isFeatured_idx" ON "TrendingProduct"("isFeatured");

-- CreateIndex
CREATE INDEX "TrendingProduct_category_idx" ON "TrendingProduct"("category");

-- CreateIndex
CREATE INDEX "TrendingProduct_createdAt_idx" ON "TrendingProduct"("createdAt");

-- CreateIndex
CREATE INDEX "TrendingProductImage_productId_idx" ON "TrendingProductImage"("productId");

-- CreateIndex
CREATE INDEX "TrendingProductRequest_productId_idx" ON "TrendingProductRequest"("productId");

-- CreateIndex
CREATE INDEX "TrendingProductRequest_userId_idx" ON "TrendingProductRequest"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppLog_to_idx" ON "WhatsAppLog"("to");

-- CreateIndex
CREATE INDEX "WhatsAppLog_status_idx" ON "WhatsAppLog"("status");

-- CreateIndex
CREATE INDEX "WhatsAppLog_userId_idx" ON "WhatsAppLog"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppLog_requestId_idx" ON "WhatsAppLog"("requestId");

-- CreateIndex
CREATE INDEX "ShippingEstimate_userId_idx" ON "ShippingEstimate"("userId");

-- CreateIndex
CREATE INDEX "ShippingEstimate_freightType_idx" ON "ShippingEstimate"("freightType");

-- CreateIndex
CREATE INDEX "ConsultingRequest_status_idx" ON "ConsultingRequest"("status");

-- CreateIndex
CREATE INDEX "ConsultingRequest_userId_idx" ON "ConsultingRequest"("userId");

-- AddForeignKey
ALTER TABLE "TrendingProductImage" ADD CONSTRAINT "TrendingProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TrendingProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingProductRequest" ADD CONSTRAINT "TrendingProductRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TrendingProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
