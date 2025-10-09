/*
  Warnings:

  - Added the required column `values` to the `club` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "club" ADD COLUMN     "values" JSONB NOT NULL;

-- Backfill existing rows with the required default structure
UPDATE "club"
SET "values" = '{"items": []}'
WHERE "values" IS NULL;