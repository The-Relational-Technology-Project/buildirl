/*
  Warnings:

  - A unique constraint covering the columns `[userId,membershipTierId]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_membershipTierId_key" ON "Membership"("userId", "membershipTierId");
