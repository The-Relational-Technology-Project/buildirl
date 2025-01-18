/*
  Warnings:

  - You are about to drop the `Club` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Membership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MembershipTier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Club" DROP CONSTRAINT "Club_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_membershipTierId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "MembershipTier" DROP CONSTRAINT "MembershipTier_clubId_fkey";

-- DropTable
DROP TABLE "Club";

-- DropTable
DROP TABLE "Membership";

-- DropTable
DROP TABLE "MembershipTier";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "authUserId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerUserId" INTEGER NOT NULL,
    "websiteURL" TEXT,
    "eventCalendarURL" TEXT,
    "instagramHandle" TEXT,
    "applicationQuestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_tier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "benefitDescription" TEXT NOT NULL,
    "contributionDescription" TEXT NOT NULL,
    "costPerMonthInUSD" DECIMAL(65,30) NOT NULL,
    "clubId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "membershipTierId" INTEGER NOT NULL,
    "applicationResponses" JSONB NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_authUserId_key" ON "user"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "club_publicId_key" ON "club"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_userId_membershipTierId_key" ON "membership"("userId", "membershipTierId");

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_tier" ADD CONSTRAINT "membership_tier_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_membershipTierId_fkey" FOREIGN KEY ("membershipTierId") REFERENCES "membership_tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
