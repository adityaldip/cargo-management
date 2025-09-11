-- Test the relationship between invoice_summary_view and invoice_detail_view
-- This script helps verify that clicking on a summary invoice will show the correct details

-- 1. Test that both views have matching invoice IDs
SELECT 
    'Summary View' as view_type,
    COUNT(*) as total_invoices,
    COUNT(DISTINCT invoice_id) as unique_invoice_ids
FROM invoice_summary_view
UNION ALL
SELECT 
    'Detail View' as view_type,
    COUNT(*) as total_items,
    COUNT(DISTINCT invoice_id) as unique_invoice_ids
FROM invoice_detail_view;

-- 2. Check for any invoice IDs that exist in summary but not in detail
SELECT 
    s.invoice_id,
    s.customer_name,
    s.total_items as summary_items,
    COUNT(d.id) as detail_items
FROM invoice_summary_view s
LEFT JOIN invoice_detail_view d ON s.invoice_id = d.invoice_id
GROUP BY s.invoice_id, s.customer_name, s.total_items
HAVING s.total_items != COUNT(d.id)
ORDER BY s.invoice_id;

-- 3. Check for any invoice IDs that exist in detail but not in summary
SELECT 
    d.invoice_id,
    d.customer_name,
    COUNT(d.id) as detail_items
FROM invoice_detail_view d
LEFT JOIN invoice_summary_view s ON d.invoice_id = s.invoice_id
WHERE s.invoice_id IS NULL
GROUP BY d.invoice_id, d.customer_name
ORDER BY d.invoice_id;

-- 4. Sample relationship test - get summary and details for first invoice
WITH sample_invoice AS (
    SELECT invoice_id, customer_name, total_items, total_amount
    FROM invoice_summary_view 
    LIMIT 1
)
SELECT 
    'SUMMARY' as data_type,
    si.invoice_id,
    si.customer_name,
    si.total_items,
    si.total_amount,
    NULL as item_route,
    NULL as item_weight,
    NULL as item_amount
FROM sample_invoice si
UNION ALL
SELECT 
    'DETAIL' as data_type,
    id.invoice_id,
    id.customer_name,
    NULL as total_items,
    NULL as total_amount,
    id.route as item_route,
    id.weight as item_weight,
    id.amount as item_amount
FROM sample_invoice si
JOIN invoice_detail_view id ON si.invoice_id = id.invoice_id
ORDER BY data_type, item_route;

-- 5. Verify that the sum of detail amounts matches summary amounts
SELECT 
    s.invoice_id,
    s.customer_name,
    s.total_amount as summary_amount,
    SUM(d.amount) as calculated_detail_amount,
    ABS(s.total_amount - SUM(d.amount)) as difference
FROM invoice_summary_view s
JOIN invoice_detail_view d ON s.invoice_id = d.invoice_id
GROUP BY s.invoice_id, s.customer_name, s.total_amount
HAVING ABS(s.total_amount - SUM(d.amount)) > 0.01
ORDER BY difference DESC;

-- 6. Get a complete invoice with all details (useful for frontend testing)
SELECT 
    s.invoice_id,
    s.invoice_number,
    s.customer_name,
    s.invoice_date,
    s.total_amount,
    s.total_items,
    s.total_weight,
    s.currency,
    s.status,
    -- Detail items as JSON array
    json_agg(
        json_build_object(
            'id', d.id,
            'recId', d.recId,
            'route', d.route,
            'mailCat', d.mailCat,
            'mailClass', d.mailClass,
            'weight', d.weight,
            'rate', d.rate,
            'amount', d.amount,
            'date', d.date,
            'origOE', d.origOE,
            'destOE', d.destOE,
            'rateInfo', json_build_object(
                'id', d.rate_id,
                'name', d.rate_name,
                'description', d.rate_description,
                'rate_type', d.rate_type,
                'base_rate', d.base_rate,
                'currency', d.rate_currency
            )
        )
    ) as items_details
FROM invoice_summary_view s
JOIN invoice_detail_view d ON s.invoice_id = d.invoice_id
GROUP BY s.invoice_id, s.invoice_number, s.customer_name, s.invoice_date, 
         s.total_amount, s.total_items, s.total_weight, s.currency, s.status
ORDER BY s.invoice_date DESC
LIMIT 5;
