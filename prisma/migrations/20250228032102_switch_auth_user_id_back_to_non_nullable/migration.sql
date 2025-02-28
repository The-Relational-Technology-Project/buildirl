/*
  Warnings:

  - Made the column `auth_user_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "auth_user_id" SET NOT NULL;
