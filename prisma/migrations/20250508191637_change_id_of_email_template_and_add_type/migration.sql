/*
  Warnings:

  - The primary key for the `email_template` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `email_template` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "EmailTemplateType" ADD VALUE 'REJECTION';

-- DropIndex
DROP INDEX "email_template_club_id_type_key";

-- AlterTable
ALTER TABLE "email_template" DROP CONSTRAINT "email_template_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "email_template_pkey" PRIMARY KEY ("club_id", "type");
