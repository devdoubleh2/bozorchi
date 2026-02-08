-- =====================================================
-- FIX: Add default value to supplier_price_base column
-- =====================================================
--
-- This migration fixes the null constraint violation when creating products.
-- The supplier_price_base column was added as NOT NULL without a default,
-- but the Prisma schema no longer includes it, causing inserts to fail.
--
-- Usage: Run this SQL file against the database
-- psql $DATABASE_URL -f fix_supplier_price_base_default.sql
-- =====================================================

DO $$
DECLARE
    schema_record RECORD;
    schema_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Fixing supplier_price_base default for all tenants...';

    FOR schema_record IN
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'org_%'
        ORDER BY schema_name
    LOOP
        schema_count := schema_count + 1;
        RAISE NOTICE '⏳ Processing schema: %', schema_record.schema_name;

        BEGIN
            -- Add default value to supplier_price_base column
            EXECUTE format('
                ALTER TABLE %I.product_variations
                ALTER COLUMN supplier_price_base SET DEFAULT 0',
                schema_record.schema_name
            );

            success_count := success_count + 1;
            RAISE NOTICE '✅ Fixed schema: %', schema_record.schema_name;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Schema % may not have supplier_price_base column: %', schema_record.schema_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '🎉 Fix complete! Processed % schemas, % successful', schema_count, success_count;
END $$;
