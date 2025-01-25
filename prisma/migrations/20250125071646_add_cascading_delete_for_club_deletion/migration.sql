-- DropForeignKey
ALTER TABLE "membership_tier" DROP CONSTRAINT "membership_tier_clubId_fkey";

-- AddForeignKey
ALTER TABLE "membership_tier" ADD CONSTRAINT "membership_tier_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
