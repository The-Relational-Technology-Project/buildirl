/*
  Warnings:

  - You are about to drop the column `eventCalendarUrl` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `Club` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Club" DROP COLUMN "eventCalendarUrl",
DROP COLUMN "websiteUrl",
ADD COLUMN     "eventCalendarURL" TEXT,
ADD COLUMN     "websiteURL" TEXT;
