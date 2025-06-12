/*
  Warnings:

  - You are about to drop the column `owner_user_id` on the `club` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "club" DROP CONSTRAINT "club_owner_user_id_fkey";

-- DropIndex
DROP INDEX "club_owner_user_id_idx";

-- AlterTable
ALTER TABLE "club" DROP COLUMN "owner_user_id";
