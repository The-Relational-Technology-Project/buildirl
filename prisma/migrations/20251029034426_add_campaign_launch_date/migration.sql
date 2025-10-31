-- 1. add the column nullable, no default yet
   ALTER TABLE "membership_campaign"
     ADD COLUMN "launchDate" TIMESTAMP(3);
   
   -- 2. backfill old rows from created_at
   UPDATE "membership_campaign"
   SET "launchDate" = "created_at"
   WHERE "launchDate" IS NULL;
   
   -- 3. enforce future behavior
   ALTER TABLE "membership_campaign"
     ALTER COLUMN "launchDate" SET NOT NULL,
     ALTER COLUMN "launchDate" SET DEFAULT CURRENT_TIMESTAMP;