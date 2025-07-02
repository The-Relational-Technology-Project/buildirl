-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL');

-- AlterTable
ALTER TABLE "membership_tier" ADD COLUMN     "billing_interval" "BillingInterval",
ADD COLUMN     "cost_per_billing_interval" DECIMAL(65,30);
