-- CreateEnum
CREATE TYPE "EmailBlastStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateTable
CREATE TABLE "email_blast" (
    "id" BIGSERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "status" "EmailBlastStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_blast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_blast_club_id_idx" ON "email_blast"("club_id");

-- CreateIndex
CREATE INDEX "email_blast_club_id_status_idx" ON "email_blast"("club_id", "status");

-- AddForeignKey
ALTER TABLE "email_blast" ADD CONSTRAINT "email_blast_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
