-- CreateTable
CREATE TABLE "membership_campaign" (
    "id" SERIAL NOT NULL,
    "membership_tier_id" INTEGER NOT NULL,
    "target_per_month_in_usd" DECIMAL(65,30) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_budget_item" (
    "id" SERIAL NOT NULL,
    "membership_campaign_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "cost_per_month_in_usd" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_budget_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "membership_campaign" ADD CONSTRAINT "membership_campaign_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "membership_tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budget_item" ADD CONSTRAINT "campaign_budget_item_membership_campaign_id_fkey" FOREIGN KEY ("membership_campaign_id") REFERENCES "membership_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
