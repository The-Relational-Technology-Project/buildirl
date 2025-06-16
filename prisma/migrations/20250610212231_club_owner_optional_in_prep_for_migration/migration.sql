-- DropForeignKey
ALTER TABLE "club" DROP CONSTRAINT "club_owner_user_id_fkey";

-- AlterTable
ALTER TABLE "club" ALTER COLUMN "owner_user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
