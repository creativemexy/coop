BEGIN;

ALTER TABLE bnpl_plans
  ALTER COLUMN organization_id DROP NOT NULL;

ALTER TABLE bnpl_subscriptions
  ADD COLUMN IF NOT EXISTS organization_id uuid;

UPDATE bnpl_subscriptions AS subscription
SET organization_id = users.organization_id
FROM users
WHERE subscription.user_id = users.id
  AND subscription.organization_id IS NULL;

UPDATE bnpl_plans
SET organization_id = NULL
WHERE organization_id IS NOT NULL;

COMMIT;
