-- Check ALL columns in product_variations for the user's tenant
-- Focus on finding NOT NULL columns without defaults

SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN c.is_nullable = 'NO' AND c.column_default IS NULL THEN '⚠️ PROBLEM: NOT NULL without default'
        ELSE '✓ OK'
    END as status
FROM information_schema.columns c
WHERE c.table_schema = 'org_cmkcyw8kx00010apeiyhdg1f4'
  AND c.table_name = 'product_variations'
ORDER BY 
    CASE WHEN c.is_nullable = 'NO' AND c.column_default IS NULL THEN 0 ELSE 1 END,
    c.ordinal_position;
