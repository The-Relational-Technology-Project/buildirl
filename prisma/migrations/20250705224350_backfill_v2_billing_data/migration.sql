-- Phase 1: Backfill V2 billing data for existing membership tiers
-- This migration populates cost_per_billing_interval and billing_interval
-- for any existing records that only have cost_per_month_usd

-- Backfill missing V2 data:
-- - Set cost_per_billing_interval = cost_per_month_usd (for existing data)
-- - Set billing_interval = 'MONTHLY' (default for all existing tiers)
UPDATE membership_tier 
SET 
  cost_per_billing_interval = cost_per_month_usd,
  billing_interval = 'MONTHLY'
WHERE 
  cost_per_billing_interval IS NULL;