/*
  Warnings:

  - You are about to drop the column `stripeConnectAccountId` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `user_settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeConnectAccountId]` on the table `club` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `membership` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_settings_stripeConnectAccountId_key";

-- DropIndex
DROP INDEX "user_settings_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "club" ADD COLUMN     "stripeConnectAccountId" TEXT;

-- AlterTable
ALTER TABLE "membership" ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "stripeConnectAccountId",
DROP COLUMN "stripeCustomerId";

-- CreateIndex
CREATE UNIQUE INDEX "club_stripeConnectAccountId_key" ON "club"("stripeConnectAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripeCustomerId_key" ON "membership"("stripeCustomerId");
