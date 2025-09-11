-- Debug script for invoice_summary_view
-- Run these queries to understand why invoice_id and invoice_number are empty

-- 1. Check if cargo_data table has any data at all:
SELECT COUNT(*) as total_records FROM cargo_data;

-- 2. Check if any records have assigned_customer and rate_id populated:
SELECT COUNT(*) as records_with_assignments FROM cargo_data WHERE assigned_customer IS NOT NULL AND rate_id IS NOT NULL;

-- 3. Check sample records with assignment data:
SELECT cd.id, cd.invoice, cd.assigned_customer, cd.rate_id, r.name as rate_name, r.base_rate, cd.total_kg, cd.created_at 
FROM cargo_data cd
LEFT JOIN rates r ON cd.rate_id = r.id
WHERE cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL
LIMIT 5;

-- 4. Check for records without assignments (these won't appear in view):
SELECT COUNT(*) as records_without_assignments FROM cargo_data WHERE assigned_customer IS NULL OR rate_id IS NULL;

-- 5. Test the view directly:
SELECT * FROM invoice_summary_view LIMIT 5;

-- 6. Check if invoice field is always NULL:
SELECT 
    COUNT(*) as total_records,
    COUNT(cd.invoice) as non_null_invoices,
    COUNT(*) - COUNT(cd.invoice) as null_invoices
FROM cargo_data cd;

-- 7. Test the COALESCE logic manually:
SELECT 
    cd.assigned_customer,
    cd.invoice,
    MIN(cd.created_at) as min_created_at,
    MAX(cd.invoice) as max_invoice,
    COALESCE(MAX(cd.invoice), 'INV-' || MAX(cd.assigned_customer::text) || '-' || TO_CHAR(MIN(cd.created_at), 'YYYYMMDD') || '-' || TO_CHAR(MIN(cd.created_at), 'HH24MISS')) as test_invoice_id
FROM cargo_data cd
WHERE cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL
GROUP BY cd.assigned_customer
LIMIT 5;

-- 8. Check if customers table has data:
SELECT COUNT(*) as total_customers FROM customers;

-- 9. Check if rates table has data:
SELECT COUNT(*) as total_rates FROM rates;
