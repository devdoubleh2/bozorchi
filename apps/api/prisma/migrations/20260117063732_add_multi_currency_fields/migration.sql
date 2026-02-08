-- =====================================================
-- MULTI-TENANT SAFE MIGRATION
-- Adds multi-currency support fields
-- =====================================================
-- 
-- WARNING: This migration must be run on ALL tenant schemas
-- Use the companion migration script to execute across all tenants
--
-- Fields Added:
-- 1. product_variations.supplier_price_base (required, backfilled from supplier_price)
-- 2. product_variations.last_exchange_rate (optional, defaults to 1)
-- 3. product_variations.supplier_price_currency (made NOT NULL with default 'UZS')
-- 4. transactions.source_currency (optional)
-- 5. transactions.source_amount (optional)
--
-- =====================================================

BEGIN;

-- Step 1: Add new columns to product_variations
-- Add supplier_price_base with temporary NULL to allow backfill
ALTER TABLE product_variations 
  ADD COLUMN IF NOT EXISTS supplier_price_base DECIMAL(15,2);

-- Add last_exchange_rate with default
ALTER TABLE product_variations 
  ADD COLUMN IF NOT EXISTS last_exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1;

-- Step 2: Backfill supplier_price_base with supplier_price
-- For existing records, assume they're in base currency (UZS)
UPDATE product_variations 
SET supplier_price_base = supplier_price 
WHERE supplier_price_base IS NULL;

-- Step 3: Make supplier_price_base NOT NULL and add constraint
ALTER TABLE product_variations 
  ALTER COLUMN supplier_price_base SET NOT NULL;

-- Step 4: Update supplier_price_currency to be NOT NULL with default
-- First set existing NULLs to 'UZS'
UPDATE product_variations 
SET supplier_price_currency = 'UZS' 
WHERE supplier_price_currency IS NULL;

-- Then make the column NOT NULL with default
ALTER TABLE product_variations 
  ALTER COLUMN supplier_price_currency SET NOT NULL,
  ALTER COLUMN supplier_price_currency SET DEFAULT 'UZS';

-- Step 5: Add new columns to transactions
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS source_currency VARCHAR(10),
  ADD COLUMN IF NOT EXISTS source_amount DECIMAL(15,2);

-- Step 6: Add helpful comments for documentation
COMMENT ON COLUMN product_variations.supplier_price IS 'Original supplier price in supplier_price_currency';
COMMENT ON COLUMN product_variations.supplier_price_currency IS 'Currency code of supplier_price (e.g., USD, EUR, UZS)';
COMMENT ON COLUMN product_variations.supplier_price_base IS 'Supplier price converted to store base currency for COGS calculations';
COMMENT ON COLUMN product_variations.last_exchange_rate IS 'Exchange rate used for last conversion of supplier_price to supplier_price_base';
COMMENT ON COLUMN transactions.source_currency IS 'Original currency for import transactions (e.g., USD when importing from USA)';
COMMENT ON COLUMN transactions.source_amount IS 'Original amount in source_currency before conversion to base currency';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify success:
-- =====================================================
--
-- 1. Check all product_variations have supplier_price_base:
-- SELECT COUNT(*) as total, 
--        COUNT(supplier_price_base) as with_base_price,
--        COUNT(*) - COUNT(supplier_price_base) as missing_base_price
-- FROM product_variations;
-- Expected: missing_base_price = 0
--
-- 2. Check all product_variations have supplier_price_currency:
-- SELECT COUNT(*) as total,
--        COUNT(supplier_price_currency) as with_currency,
--        COUNT(*) - COUNT(supplier_price_currency) as missing_currency
-- FROM product_variations;
-- Expected: missing_currency = 0
--
-- 3. Verify backfill worked (supplier_price_base equals supplier_price):
-- SELECT COUNT(*) as correctly_backfilled
-- FROM product_variations
-- WHERE supplier_price_base = supplier_price;
--
-- 4. Check transaction columns exist:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'transactions'
-- AND column_name IN ('source_currency', 'source_amount');
--
-- =====================================================
