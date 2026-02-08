-- =====================================================
-- FIX: Add default value to supplier_price column
-- =====================================================
--
-- Root cause: The supplier_price column is NOT NULL without a default.
-- The code now uses delivery_cost instead, but the old supplier_price
-- column still requires a value on insert, causing null constraint violations.
--
-- Usage: Run this SQL file against the database
-- psql $DATABASE_URL -f fix_supplier_price_default.sql
-- =====================================================

DO $$
DECLARE
    schema_record RECORD;
    schema_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Fixing supplier_price default for all tenants...';

    FOR schema_record IN
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'org_%'
        ORDER BY schema_name
    LOOP
        schema_count := schema_count + 1;
        RAISE NOTICE '⏳ Processing schema: %', schema_record.schema_name;

        BEGIN
            -- Add default value to supplier_price column
            EXECUTE format('
                ALTER TABLE %I.product_variations
                ALTER COLUMN supplier_price SET DEFAULT 0',
                schema_record.schema_name
            );

            success_count := success_count + 1;
            RAISE NOTICE '✅ Fixed schema: %', schema_record.schema_name;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Schema % issue: %', schema_record.schema_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '🎉 Fix complete! Processed % schemas, % successful', schema_count, success_count;
END $$;
