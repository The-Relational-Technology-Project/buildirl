-- AlterTable
ALTER TABLE "club" ADD COLUMN "contribution_reasons" JSONB;
UPDATE "club" SET "contribution_reasons" = '{"items": []}' WHERE "contribution_reasons" IS NULL;
ALTER TABLE "club" ALTER COLUMN "contribution_reasons" SET NOT NULL;
