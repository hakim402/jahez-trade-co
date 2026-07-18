-- AlterTable: Add lang column to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'en';
