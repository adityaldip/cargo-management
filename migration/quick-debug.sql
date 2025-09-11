-- Quick debug queries to find out why invoice view is empty

-- 1. Check total records in cargo_data
SELECT 'Total cargo_data records' as check_type, COUNT(*) as count FROM cargo_data;

-- 2. Check records with assigned_customer (UUID)
SELECT 'Records with assigned_customer' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE assigned_customer IS NOT NULL;

-- 3. Check records with rate_id
SELECT 'Records with rate_id' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE rate_id IS NOT NULL;

-- 4. Check records with BOTH assigned_customer AND rate_id
SELECT 'Records with both assigned_customer AND rate_id' as check_type, COUNT(*) as count 
FROM cargo_data 
WHERE assigned_customer IS NOT NULL AND rate_id IS NOT NULL;

-- 5. Sample records that should appear in view
SELECT 
    cd.id,
    cd.assigned_customer,
    cd.rate_id,
    cd.invoice,
    cd.total_kg,
    cd.created_at,
    c.name as customer_name,
    r.name as rate_name
FROM cargo_data cd
LEFT JOIN customers c ON cd.assigned_customer = c.id
LEFT JOIN rates r ON cd.rate_id = r.id
WHERE cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL
LIMIT 3;

-- 6. Check if customers table has data
SELECT 'Total customers' as check_type, COUNT(*) as count FROM customers;

-- 7. Check if rates table has data  
SELECT 'Total rates' as check_type, COUNT(*) as count FROM rates;

-- 8. Test the view directly
SELECT 'View records' as check_type, COUNT(*) as count FROM invoice_summary_view;

-- 9. If view has records, show sample
SELECT * FROM invoice_summary_view LIMIT 2;
