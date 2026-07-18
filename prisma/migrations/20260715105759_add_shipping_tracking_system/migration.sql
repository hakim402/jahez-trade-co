-- CreateEnum
CREATE TYPE "public"."EventSource" AS ENUM ('MANUAL', 'API', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_ORIGIN_PORT', 'CUSTOMS_ORIGIN', 'DEPARTED', 'ARRIVED_DESTINATION', 'CUSTOMS_DESTINATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'EXCEPTION', 'CANCELED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."TrackingSource" AS ENUM ('MANUAL', 'API_17TRACK', 'API_SHIP24', 'API_AFTERSHIP');

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "shipmentId" TEXT;

-- CreateTable
CREATE TABLE "public"."GuestClient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "company" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "shipmentId" TEXT,
    "clientId" TEXT,
    "guestClientId" TEXT,
    "requestId" TEXT,
    "quoteId" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "pdfUrl" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "whatsappSentAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "clientId" TEXT,
    "guestClientId" TEXT,
    "requestId" TEXT,
    "quoteId" TEXT,
    "productDescription" TEXT NOT NULL,
    "productLink" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "originCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "freightType" "public"."FreightType" NOT NULL DEFAULT 'SEA',
    "carrierName" TEXT,
    "carrierTrackingNumber" TEXT,
    "trackingSource" "public"."TrackingSource" NOT NULL DEFAULT 'MANUAL',
    "providerCarrierCode" TEXT,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "weightKg" DECIMAL(10,3),
    "volumeCbm" DECIMAL(10,4),
    "productCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customsFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'BOOKED',
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "public"."ShipmentStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "source" "public"."EventSource" NOT NULL DEFAULT 'MANUAL',
    "rawPayload" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentImage" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestClient_createdById_idx" ON "public"."GuestClient"("createdById" ASC);

-- CreateIndex
CREATE INDEX "GuestClient_email_idx" ON "public"."GuestClient"("email" ASC);

-- CreateIndex
CREATE INDEX "GuestClient_isDeleted_idx" ON "public"."GuestClient"("isDeleted" ASC);

-- CreateIndex
CREATE INDEX "GuestClient_phone_idx" ON "public"."GuestClient"("phone" ASC);

-- CreateIndex
CREATE INDEX "IntegrationSetting_provider_idx" ON "public"."IntegrationSetting"("provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSetting_provider_key_key" ON "public"."IntegrationSetting"("provider" ASC, "key" ASC);

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "public"."Invoice"("clientId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "public"."Invoice"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Invoice_guestClientId_idx" ON "public"."Invoice"("guestClientId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber" ASC);

-- CreateIndex
CREATE INDEX "Invoice_isDeleted_idx" ON "public"."Invoice"("isDeleted" ASC);

-- CreateIndex
CREATE INDEX "Invoice_quoteId_idx" ON "public"."Invoice"("quoteId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_requestId_idx" ON "public"."Invoice"("requestId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_shipmentId_idx" ON "public"."Invoice"("shipmentId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status" ASC);

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "public"."InvoiceItem"("invoiceId" ASC);

-- CreateIndex
CREATE INDEX "Shipment_carrierTrackingNumber_idx" ON "public"."Shipment"("carrierTrackingNumber" ASC);

-- CreateIndex
CREATE INDEX "Shipment_clientId_idx" ON "public"."Shipment"("clientId" ASC);

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "public"."Shipment"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Shipment_guestClientId_idx" ON "public"."Shipment"("guestClientId" ASC);

-- CreateIndex
CREATE INDEX "Shipment_isDeleted_idx" ON "public"."Shipment"("isDeleted" ASC);

-- CreateIndex
CREATE INDEX "Shipment_quoteId_idx" ON "public"."Shipment"("quoteId" ASC);

-- CreateIndex
CREATE INDEX "Shipment_requestId_idx" ON "public"."Shipment"("requestId" ASC);

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "public"."Shipment"("status" ASC);

-- CreateIndex
CREATE INDEX "Shipment_trackingCode_idx" ON "public"."Shipment"("trackingCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingCode_key" ON "public"."Shipment"("trackingCode" ASC);

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_occurredAt_idx" ON "public"."ShipmentEvent"("shipmentId" ASC, "occurredAt" ASC);

-- CreateIndex
CREATE INDEX "ShipmentEvent_status_idx" ON "public"."ShipmentEvent"("status" ASC);

-- CreateIndex
CREATE INDEX "ShipmentImage_shipmentId_sortOrder_idx" ON "public"."ShipmentImage"("shipmentId" ASC, "sortOrder" ASC);

-- AddForeignKey
ALTER TABLE "public"."GuestClient" ADD CONSTRAINT "GuestClient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationSetting" ADD CONSTRAINT "IntegrationSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_guestClientId_fkey" FOREIGN KEY ("guestClientId") REFERENCES "public"."GuestClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."ProductRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_guestClientId_fkey" FOREIGN KEY ("guestClientId") REFERENCES "public"."GuestClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."ProductRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentImage" ADD CONSTRAINT "ShipmentImage_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

