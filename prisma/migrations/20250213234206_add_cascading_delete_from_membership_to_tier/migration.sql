-- DropForeignKey
ALTER TABLE "membership" DROP CONSTRAINT "membership_membership_tier_id_fkey";

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "membership_tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
