-- CreateTable
CREATE TABLE "club_following" (
    "user_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "club_following_user_id_idx" ON "club_following"("user_id");

-- CreateIndex
CREATE INDEX "club_following_club_id_idx" ON "club_following"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_following_user_id_club_id_key" ON "club_following"("user_id", "club_id");

-- AddForeignKey
ALTER TABLE "club_following" ADD CONSTRAINT "club_following_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_following" ADD CONSTRAINT "club_following_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
