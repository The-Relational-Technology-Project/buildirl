-- CreateTable
CREATE TABLE "club_blacklist" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "club_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_blacklist_club_id_key" ON "club_blacklist"("club_id");