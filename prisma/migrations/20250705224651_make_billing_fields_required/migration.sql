/*
  Warnings:

  - Made the column `billing_interval` on table `membership_tier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cost_per_billing_interval` on table `membership_tier` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "membership_tier" ALTER COLUMN "billing_interval" SET NOT NULL,
ALTER COLUMN "cost_per_billing_interval" SET NOT NULL;
