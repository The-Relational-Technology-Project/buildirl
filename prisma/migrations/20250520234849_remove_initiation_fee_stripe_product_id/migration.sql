/*
  Warnings:

  - You are about to drop the column `initiation_fee_stripe_product_id` on the `membership_tier` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "membership_tier_initiation_fee_stripe_product_id_key";

-- AlterTable
ALTER TABLE "membership_tier" DROP COLUMN "initiation_fee_stripe_product_id";
