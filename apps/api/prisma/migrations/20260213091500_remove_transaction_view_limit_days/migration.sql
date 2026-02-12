BEGIN;

ALTER TABLE "user_organizations"
  DROP COLUMN IF EXISTS "transaction_view_limit_days";

COMMIT;
