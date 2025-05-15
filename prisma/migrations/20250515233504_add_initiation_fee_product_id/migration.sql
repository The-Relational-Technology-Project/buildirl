/*
  Warnings:

  - You are about to drop the column `initation_fee_stripe_price_id` on the `membership_tier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[initiation_fee_stripe_product_id]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[initiation_fee_stripe_price_id]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "membership_tier_initation_fee_stripe_price_id_key";

-- AlterTable
ALTER TABLE "membership_tier" DROP COLUMN "initation_fee_stripe_price_id",
ADD COLUMN     "initiation_fee_stripe_price_id" TEXT,
ADD COLUMN     "initiation_fee_stripe_product_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_initiation_fee_stripe_product_id_key" ON "membership_tier"("initiation_fee_stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_initiation_fee_stripe_price_id_key" ON "membership_tier"("initiation_fee_stripe_price_id");
