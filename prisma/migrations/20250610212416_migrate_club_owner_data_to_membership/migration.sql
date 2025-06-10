BEGIN;

-- backfill club owner as memberships with LEAD role
INSERT INTO membership (
    user_id,
    membership_tier_id,
    role,
    application_responses,
    status,
    is_welcomed,
    stripe_customer_id,
    stripe_setup_intent_id,
    stripe_subscription_id,
    created_at,
    updated_at
)
SELECT
    c.owner_user_id,
    mt.id,
    'LEAD',
    '{"responses": []}'::jsonb,
    'ACTIVE',
    true,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
FROM
    club c JOIN
    membership_tier mt ON c.id = mt.club_id
WHERE
    c.owner_user_id IS NOT NULL
  AND mt.cost_per_month_usd = 0
  AND NOT EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = c.owner_user_id
      AND m.membership_tier_id = mt.id
);

-- drop the owner_user_id association after membership backfill
UPDATE club SET owner_user_id = null;

COMMIT;