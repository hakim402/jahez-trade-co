/*
  Warnings:

  - You are about to drop the column `altAr` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `altEn` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `captionAr` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `captionEn` on the `PostImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PostImage" DROP COLUMN "altAr",
DROP COLUMN "altEn",
DROP COLUMN "captionAr",
DROP COLUMN "captionEn",
ADD COLUMN     "altText" TEXT,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;
