/*
  Warnings:

  - You are about to drop the column `initiation_fee_cost_per_month_usd` on the `membership_tier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "membership_tier" DROP COLUMN "initiation_fee_cost_per_month_usd",
ADD COLUMN     "initiation_fee_cost_in_usd" DECIMAL(65,30);
