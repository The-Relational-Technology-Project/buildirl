-- CreateEnum
CREATE TYPE "MembershipTierStatus" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "membership_tier" ADD COLUMN     "status" "MembershipTierStatus" NOT NULL DEFAULT 'PUBLISHED';
