/*
  Warnings:

  - A unique constraint covering the columns `[stripeSetupIntentId]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeProductId]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceId]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeConnectAccountId]` on the table `user_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `user_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "membership" ADD COLUMN     "stripeSetupIntentId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "membership_tier" ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripeSetupIntentId_key" ON "membership"("stripeSetupIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripeSubscriptionId_key" ON "membership"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_stripeProductId_key" ON "membership_tier"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_stripePriceId_key" ON "membership_tier"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_stripeConnectAccountId_key" ON "user_settings"("stripeConnectAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_stripeCustomerId_key" ON "user_settings"("stripeCustomerId");
