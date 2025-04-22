/*
  Warnings:

  - Changed the type of `faqs` on the `club` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- First make the column nullable
ALTER TABLE "club" ALTER COLUMN "faqs" DROP NOT NULL;

-- Then drop the column
ALTER TABLE "club" DROP COLUMN "faqs";

-- Add it back with the new type and default value
ALTER TABLE "club" ADD COLUMN "faqs" JSONB NOT NULL DEFAULT '{"items":[]}';
