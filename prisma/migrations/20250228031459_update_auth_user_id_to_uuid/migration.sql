/*
  Warnings:

  - The `auth_user_id` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "auth_user_id",
ADD COLUMN     "auth_user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_user_id_key" ON "user"("auth_user_id");

-- CreateIndex
CREATE INDEX "user_auth_user_id_idx" ON "user"("auth_user_id");
