-- DropForeignKey
ALTER TABLE "SubscriptionItem" DROP CONSTRAINT "SubscriptionItem_planId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionItem" ALTER COLUMN "planId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
