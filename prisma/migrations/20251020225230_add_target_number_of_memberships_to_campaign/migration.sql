/*
  Warnings:

  - Added the required column `targetNumberOfMemberships` to the `membership_campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "membership_campaign" ADD COLUMN     "targetNumberOfMemberships" INTEGER NOT NULL;
