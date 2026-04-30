/*
  Warnings:

  - You are about to drop the column `fileId` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `PostVideoEmbed` table. All the data in the column will be lost.
  - You are about to drop the column `titleAr` on the `PostVideoEmbed` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `PostVideoEmbed` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `PostVideoEmbed` table. All the data in the column will be lost.
  - Made the column `url` on table `PostImage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PostImage" DROP CONSTRAINT "PostImage_fileId_fkey";

-- AlterTable
ALTER TABLE "PostImage" DROP COLUMN "fileId",
ALTER COLUMN "url" SET NOT NULL;

-- AlterTable
ALTER TABLE "PostVideoEmbed" DROP COLUMN "provider",
DROP COLUMN "titleAr",
DROP COLUMN "titleEn",
DROP COLUMN "videoId";
