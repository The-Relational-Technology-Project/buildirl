-- CreateTable
CREATE TABLE "referral_email" (
    "id" BIGSERIAL NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_email_referrer_id_idx" ON "referral_email"("referrer_id");

-- AddForeignKey
ALTER TABLE "referral_email" ADD CONSTRAINT "referral_email_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
