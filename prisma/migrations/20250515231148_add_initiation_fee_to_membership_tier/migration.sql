/*
  Warnings:

  - A unique constraint covering the columns `[initation_fee_stripe_price_id]` on the table `membership_tier` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "membership_tier" ADD COLUMN     "initation_fee_stripe_price_id" TEXT,
ADD COLUMN     "initiation_fee_cost_per_month_usd" DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "membership_tier_initation_fee_stripe_price_id_key" ON "membership_tier"("initation_fee_stripe_price_id");
