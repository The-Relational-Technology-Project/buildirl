/*
  Warnings:

  - You are about to drop the column `stripeConnectAccountId` on the `club` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `membership` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSetupIntentId` on the `membership` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `membership` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `membership_tier` table. All the data in the column will be lost.
  - You are about to drop the column `stripeProductId` on the `membership_tier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_connect_account_id]` on the table `club` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_setup_intent_id]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_product_id]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_price_id]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "club_stripeConnectAccountId_key";

-- DropIndex
DROP INDEX "membership_stripeCustomerId_key";

-- DropIndex
DROP INDEX "membership_stripeSetupIntentId_key";

-- DropIndex
DROP INDEX "membership_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "membership_tier_stripePriceId_key";

-- DropIndex
DROP INDEX "membership_tier_stripeProductId_key";

-- AlterTable
ALTER TABLE "club" DROP COLUMN "stripeConnectAccountId",
ADD COLUMN     "stripe_connect_account_id" TEXT;

-- AlterTable
ALTER TABLE "membership" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSetupIntentId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_setup_intent_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "membership_tier" DROP COLUMN "stripePriceId",
DROP COLUMN "stripeProductId",
ADD COLUMN     "stripe_price_id" TEXT,
ADD COLUMN     "stripe_product_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "club_stripe_connect_account_id_key" ON "club"("stripe_connect_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripe_customer_id_key" ON "membership"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripe_setup_intent_id_key" ON "membership"("stripe_setup_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_stripe_subscription_id_key" ON "membership"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_stripe_product_id_key" ON "membership_tier"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_stripe_price_id_key" ON "membership_tier"("stripe_price_id");
