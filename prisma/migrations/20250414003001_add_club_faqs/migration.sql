-- AlterTable
ALTER TABLE "club" ADD COLUMN     "faqs" JSONB[] DEFAULT ARRAY[]::JSONB[];
