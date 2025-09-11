-- Comprehensive debug script for both invoice views
-- This will help identify why the invoice PDF preview shows empty cargo data

-- ===========================================
-- STEP 1: Check basic data availability
-- ===========================================

SELECT '=== BASIC DATA CHECK ===' as section;

-- 1.1 Check total cargo_data records
SELECT 'Total cargo_data records' as check_type, COUNT(*) as count FROM cargo_data;

-- 1.2 Check records with assigned_customer (UUID)
SELECT 'Records with assigned_customer' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE assigned_customer IS NOT NULL;

-- 1.3 Check records with rate_id
SELECT 'Records with rate_id' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE rate_id IS NOT NULL;

-- 1.4 Check records with BOTH assigned_customer AND rate_id (required for views)
SELECT 'Records with BOTH assigned_customer AND rate_id' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE assigned_customer IS NOT NULL AND rate_id IS NOT NULL;

-- 1.5 Check customers table
SELECT 'Total customers' as check_type, COUNT(*) as count FROM customers;

-- 1.6 Check rates table
SELECT 'Total rates' as check_type, COUNT(*) as count FROM rates;

-- ===========================================
-- STEP 2: Test the views
-- ===========================================

SELECT '=== VIEW TESTING ===' as section;

-- 2.1 Test invoice_summary_view
SELECT 'invoice_summary_view records' as check_type, COUNT(*) as count FROM invoice_summary_view;

-- 2.2 Test invoice_detail_view
SELECT 'invoice_detail_view records' as check_type, COUNT(*) as count FROM invoice_detail_view;

-- ===========================================
-- STEP 3: Sample data from views
-- ===========================================

SELECT '=== SAMPLE DATA FROM VIEWS ===' as section;

-- 3.1 Sample from invoice_summary_view
SELECT 'Sample from invoice_summary_view:' as info;
SELECT invoice_id, invoice_number, customer_name, total_items, total_weight, total_amount, currency
FROM invoice_summary_view 
LIMIT 3;

-- 3.2 Sample from invoice_detail_view
SELECT 'Sample from invoice_detail_view:' as info;
SELECT invoice_id, recId, route, mailCat, weight, rate, amount, customer_name
FROM invoice_detail_view 
LIMIT 3;

-- ===========================================
-- STEP 4: Test the API data flow
-- ===========================================

SELECT '=== API DATA FLOW TEST ===' as section;

-- 4.1 Test what the API would return for invoice summary
SELECT 'What API would return for invoice summary:' as info;
SELECT 
    invoice_id as id,
    invoice_number,
    customer_name as customer,
    invoice_date as date,
    total_amount as amount,
    status,
    total_items as items,
    total_weight,
    currency
FROM invoice_summary_view 
LIMIT 1;

-- 4.2 Test what the API would return for invoice details
SELECT 'What API would return for invoice details:' as info;
SELECT 
    id,
    recId,
    route,
    mailCat,
    mailClass,
    weight,
    rate,
    amount,
    date,
    invoice,
    origOE,
    destOE,
    rate_id,
    rate_name,
    rate_description,
    rate_type,
    base_rate,
    rate_currency
FROM invoice_detail_view 
WHERE invoice_id = (SELECT invoice_id FROM invoice_summary_view LIMIT 1)
LIMIT 3;

-- ===========================================
-- STEP 5: Check for common issues
-- ===========================================

SELECT '=== COMMON ISSUES CHECK ===' as section;

-- 5.1 Check if invoice field is always NULL
SELECT 
    'Invoice field analysis' as check_type,
    COUNT(*) as total_records,
    COUNT(cd.invoice) as non_null_invoices,
    COUNT(*) - COUNT(cd.invoice) as null_invoices
FROM cargo_data cd;

-- 5.2 Check if assigned_customer values are valid UUIDs
SELECT 
    'assigned_customer UUID validation' as check_type,
    COUNT(*) as total_with_assigned_customer,
    COUNT(CASE WHEN assigned_customer::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids
FROM cargo_data 
WHERE assigned_customer IS NOT NULL;

-- 5.3 Check if rate_id values are valid UUIDs
SELECT 
    'rate_id UUID validation' as check_type,
    COUNT(*) as total_with_rate_id,
    COUNT(CASE WHEN rate_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids
FROM cargo_data 
WHERE rate_id IS NOT NULL;

-- 5.4 Check for records with zero amounts
SELECT 'Records with zero amounts' as check_type, COUNT(*) as count 
FROM invoice_detail_view 
WHERE amount = 0;

-- ===========================================
-- STEP 6: Manual invoice generation test
-- ===========================================

SELECT '=== MANUAL INVOICE GENERATION TEST ===' as section;

-- 6.1 Test the COALESCE logic manually
SELECT 
    'Manual invoice ID generation test:' as info,
    cd.assigned_customer,
    cd.invoice,
    MIN(cd.created_at) as min_created_at,
    MAX(cd.invoice) as max_invoice,
    COALESCE(MAX(cd.invoice), 'INV-' || MAX(cd.assigned_customer::text) || '-' || TO_CHAR(MIN(cd.created_at), 'YYYYMMDD') || '-' || TO_CHAR(MIN(cd.created_at), 'HH24MISS')) as generated_invoice_id
FROM cargo_data cd
WHERE cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL
GROUP BY cd.assigned_customer
LIMIT 3;
