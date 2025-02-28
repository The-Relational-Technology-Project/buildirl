-- CreateIndex
CREATE INDEX "club_owner_user_id_idx" ON "club"("owner_user_id");

-- CreateIndex
CREATE INDEX "membership_user_id_idx" ON "membership"("user_id");

-- CreateIndex
CREATE INDEX "membership_membership_tier_id_idx" ON "membership"("membership_tier_id");

-- CreateIndex
CREATE INDEX "membership_tier_club_id_idx" ON "membership_tier"("club_id");

-- CreateIndex
CREATE INDEX "user_auth_user_id_idx" ON "user"("auth_user_id");

-- CreateIndex
CREATE INDEX "user_settings_user_id_idx" ON "user_settings"("user_id");
