/*
  Warnings:

  - You are about to drop the column `template` on the `club` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "club" DROP COLUMN "template",
ADD COLUMN     "theme" JSONB;
