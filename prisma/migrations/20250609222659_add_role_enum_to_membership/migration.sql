-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEAD', 'MEMBER');

-- AlterTable
ALTER TABLE "membership" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';
