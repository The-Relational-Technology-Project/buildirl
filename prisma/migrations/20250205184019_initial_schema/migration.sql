-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'DECLINED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MembershipTierStatus" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag_line" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" INTEGER NOT NULL,
    "website_url" TEXT,
    "event_calendar_url" TEXT,
    "instagram_handle" TEXT,
    "application_questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_tier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "benefit_description" TEXT NOT NULL,
    "contribution_description" TEXT NOT NULL,
    "cost_per_month_usd" DECIMAL(65,30) NOT NULL,
    "club_id" INTEGER NOT NULL,
    "status" "MembershipTierStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "membership_tier_id" INTEGER NOT NULL,
    "application_responses" JSONB NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_user_id_key" ON "user"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_public_id_key" ON "club"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_user_id_membership_tier_id_key" ON "membership"("user_id", "membership_tier_id");

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_tier" ADD CONSTRAINT "membership_tier_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "membership_tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
