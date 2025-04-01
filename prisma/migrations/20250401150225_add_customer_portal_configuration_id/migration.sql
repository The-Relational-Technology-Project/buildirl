/*
  Warnings:

  - A unique constraint covering the columns `[stripe_customer_portal_configuration_id]` on the table `club` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "club" ADD COLUMN     "stripe_customer_portal_configuration_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "club_stripe_customer_portal_configuration_id_key" ON "club"("stripe_customer_portal_configuration_id");
