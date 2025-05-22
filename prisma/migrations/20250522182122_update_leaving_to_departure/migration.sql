/*
  Warnings:

  - The values [LEAVING] on the enum `EmailTemplateType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmailTemplateType_new" AS ENUM ('ACCEPTANCE', 'REJECTION', 'DEPARTURE');
ALTER TABLE "email_template" ALTER COLUMN "type" TYPE "EmailTemplateType_new" USING ("type"::text::"EmailTemplateType_new");
ALTER TYPE "EmailTemplateType" RENAME TO "EmailTemplateType_old";
ALTER TYPE "EmailTemplateType_new" RENAME TO "EmailTemplateType";
DROP TYPE "EmailTemplateType_old";
COMMIT;
