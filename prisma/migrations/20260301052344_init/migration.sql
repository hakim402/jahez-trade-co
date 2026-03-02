-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'QUOTED', 'APPROVED', 'REJECTED', 'IN_PRODUCTION', 'SHIPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('MARKET', 'FACTORY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'PROPOSED', 'CONFIRMED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'WHATSAPP', 'MICROSOFT_TEAMS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionItemStatus" AS ENUM ('ACTIVE', 'CANCELED', 'UPCOMING', 'ENDED', 'ABANDONED', 'INCOMPLETE', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "PaymentAttemptType" AS ENUM ('CHECKOUT', 'RECURRING');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clerkSubscriptionId" TEXT NOT NULL,
    "userId" TEXT,
    "lastSyncPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionItem" (
    "id" TEXT NOT NULL,
    "clerkItemId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "planId" TEXT,
    "status" "SubscriptionItemStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "isDefaultPlan" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "lastSyncPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "clerkPaymentAttemptId" TEXT NOT NULL,
    "type" "PaymentAttemptType" NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL,
    "subscriptionItemId" TEXT,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "clerkPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT,
    "intervalCount" INTEGER,
    "trialPeriodDays" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoBooking" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "requestNotes" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "handledById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "meetingProvider" "MeetingProvider",
    "meetingLink" TEXT,
    "meetingPassword" TEXT,
    "clientConfirmedAt" TIMESTAMP(3),
    "transcriptUrl" TEXT,
    "aiSummary" TEXT,
    "slotId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "oldStatus" "BookingStatus" NOT NULL,
    "newStatus" "BookingStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productLink" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "customNotes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "acceptedQuoteId" TEXT,
    "aiParsedData" JSONB,
    "aiEstimatedPrice" DECIMAL(10,2),
    "aiConfidence" DOUBLE PRECISION,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "oldStatus" "RequestStatus" NOT NULL,
    "newStatus" "RequestStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "adminNotes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteStatusHistory" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "oldStatus" "QuoteStatus" NOT NULL,
    "newStatus" "QuoteStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "requestId" TEXT,
    "quoteId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "estimatedPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "confidence" DOUBLE PRECISION,
    "suggestedSupplierIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "bookingId" TEXT,
    "requestId" TEXT,
    "quoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_clerkSubscriptionId_key" ON "Subscription"("clerkSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_clerkSubscriptionId_idx" ON "Subscription"("clerkSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionItem_clerkItemId_key" ON "SubscriptionItem"("clerkItemId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_clerkItemId_idx" ON "SubscriptionItem"("clerkItemId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_status_idx" ON "SubscriptionItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_clerkPaymentAttemptId_key" ON "PaymentAttempt"("clerkPaymentAttemptId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_clerkPaymentAttemptId_idx" ON "PaymentAttempt"("clerkPaymentAttemptId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_idx" ON "PaymentAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_clerkPlanId_key" ON "Plan"("clerkPlanId");

-- CreateIndex
CREATE INDEX "Plan_clerkPlanId_idx" ON "Plan"("clerkPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoBooking_slotId_key" ON "VideoBooking"("slotId");

-- CreateIndex
CREATE INDEX "VideoBooking_clientId_idx" ON "VideoBooking"("clientId");

-- CreateIndex
CREATE INDEX "VideoBooking_handledById_idx" ON "VideoBooking"("handledById");

-- CreateIndex
CREATE INDEX "VideoBooking_status_idx" ON "VideoBooking"("status");

-- CreateIndex
CREATE INDEX "VideoBooking_scheduledAt_idx" ON "VideoBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_idx" ON "BookingStatusHistory"("bookingId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_startTime_idx" ON "AvailabilitySlot"("startTime");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_createdById_idx" ON "AvailabilitySlot"("createdById");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_isBooked_idx" ON "AvailabilitySlot"("isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRequest_acceptedQuoteId_key" ON "ProductRequest"("acceptedQuoteId");

-- CreateIndex
CREATE INDEX "ProductRequest_clientId_idx" ON "ProductRequest"("clientId");

-- CreateIndex
CREATE INDEX "ProductRequest_status_idx" ON "ProductRequest"("status");

-- CreateIndex
CREATE INDEX "ProductRequest_createdAt_idx" ON "ProductRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ProductRequest_isDeleted_idx" ON "ProductRequest"("isDeleted");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_requestId_idx" ON "RequestStatusHistory"("requestId");

-- CreateIndex
CREATE INDEX "Quote_requestId_idx" ON "Quote"("requestId");

-- CreateIndex
CREATE INDEX "Quote_createdById_idx" ON "Quote"("createdById");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_isDeleted_idx" ON "Quote"("isDeleted");

-- CreateIndex
CREATE INDEX "QuoteStatusHistory_quoteId_idx" ON "QuoteStatusHistory"("quoteId");

-- CreateIndex
CREATE INDEX "File_requestId_idx" ON "File"("requestId");

-- CreateIndex
CREATE INDEX "File_quoteId_idx" ON "File"("quoteId");

-- CreateIndex
CREATE INDEX "AISuggestion_requestId_idx" ON "AISuggestion"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_startedAt_idx" ON "ChatSession"("startedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_subscriptionItemId_fkey" FOREIGN KEY ("subscriptionItemId") REFERENCES "SubscriptionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoBooking" ADD CONSTRAINT "VideoBooking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoBooking" ADD CONSTRAINT "VideoBooking_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoBooking" ADD CONSTRAINT "VideoBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "VideoBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequest" ADD CONSTRAINT "ProductRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequest" ADD CONSTRAINT "ProductRequest_acceptedQuoteId_fkey" FOREIGN KEY ("acceptedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteStatusHistory" ADD CONSTRAINT "QuoteStatusHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteStatusHistory" ADD CONSTRAINT "QuoteStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "VideoBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
