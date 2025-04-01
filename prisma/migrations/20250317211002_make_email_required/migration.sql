/*
  Warnings:

  - Made the column `email` on table `user_settings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user_settings" ALTER COLUMN "email" SET NOT NULL;
