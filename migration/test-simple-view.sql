-- Test with a simplified view to isolate the issue

-- Drop and recreate with minimal fields first
DROP VIEW IF EXISTS test_invoice_view;

CREATE VIEW test_invoice_view AS
SELECT 
    cd.assigned_customer,
    cd.rate_id,
    cd.invoice,
    MIN(cd.created_at) as min_created_at,
    COUNT(*) as record_count,
    -- Test the invoice generation logic
    COALESCE(MAX(cd.invoice), 'INV-' || MAX(cd.assigned_customer::text) || '-' || TO_CHAR(MIN(cd.created_at), 'YYYYMMDD')) as test_invoice_id
FROM cargo_data cd
WHERE cd.assigned_customer IS NOT NULL 
  AND cd.rate_id IS NOT NULL
GROUP BY 
    cd.assigned_customer,
    cd.rate_id;

-- Test the simple view
SELECT * FROM test_invoice_view LIMIT 5;

-- If this works, then the issue is in the complex view
-- If this is empty, then the issue is with the data or basic query
