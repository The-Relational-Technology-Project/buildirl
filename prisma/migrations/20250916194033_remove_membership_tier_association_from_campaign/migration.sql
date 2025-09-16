/*
  Warnings:

  - You are about to drop the column `endDate` on the `membership_campaign` table. All the data in the column will be lost.
  - You are about to drop the column `membership_tier_id` on the `membership_campaign` table. All the data in the column will be lost.
  - You are about to drop the column `target_per_month_in_usd` on the `membership_campaign` table. All the data in the column will be lost.
  - Added the required column `club_id` to the `membership_campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDate` to the `membership_campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "membership_campaign" DROP CONSTRAINT "membership_campaign_membership_tier_id_fkey";

-- AlterTable
ALTER TABLE "membership_campaign" DROP COLUMN "endDate",
DROP COLUMN "membership_tier_id",
DROP COLUMN "target_per_month_in_usd",
ADD COLUMN     "club_id" INTEGER NOT NULL,
ADD COLUMN     "targetDate" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "membership_campaign" ADD CONSTRAINT "membership_campaign_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
