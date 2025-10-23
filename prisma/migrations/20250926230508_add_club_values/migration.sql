-- AlterTable
ALTER TABLE "club" ADD COLUMN "values" JSONB;
UPDATE "club" SET "values" = '{"items": []}' WHERE "values" IS NULL;
ALTER TABLE "club" ALTER COLUMN "values" SET NOT NULL;