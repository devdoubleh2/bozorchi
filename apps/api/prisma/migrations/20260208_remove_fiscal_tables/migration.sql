-- Drop fiscal tables and remove fiscal fields from stores table

BEGIN;

-- Drop fiscal receipt items first (has foreign key to fiscal_receipts)
DROP TABLE IF EXISTS "fiscal_receipt_items" CASCADE;

-- Drop fiscal receipts (has foreign key to stores and fiscal_devices)
DROP TABLE IF EXISTS "fiscal_receipts" CASCADE;

-- Drop fiscal devices (has foreign key to stores)
DROP TABLE IF EXISTS "fiscal_devices" CASCADE;

-- Remove fiscal fields from stores table
ALTER TABLE "stores" 
  DROP COLUMN IF EXISTS "fiscal_enabled",
  DROP COLUMN IF EXISTS "fiscal_device_id",
  DROP COLUMN IF EXISTS "fiscal_api_key",
  DROP COLUMN IF EXISTS "fiscal_terminal_id",
  DROP COLUMN IF EXISTS "fiscal_company_tin";

COMMIT;
