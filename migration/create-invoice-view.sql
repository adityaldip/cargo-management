-- Create a view for invoice data to optimize query performance
-- This view generates invoices directly from cargo_data table

-- Drop the existing view first to avoid data type conflicts
DROP VIEW IF EXISTS invoice_summary_view;

CREATE VIEW invoice_summary_view AS
SELECT 
    -- Generate consistent invoice ID and readable invoice number
    COALESCE('INV-' || MAX(cd.assigned_customer::text) || '-' || TO_CHAR(MIN(COALESCE(
        CASE 
            WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
            THEN cd.inb_flight_date::date 
            ELSE NULL 
        END,
        cd.created_at
    )), 'YYYYMMDD') || '-' || CASE 
        WHEN TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )), 'HH24MISS') = '000000'
        THEN TO_CHAR(MIN(cd.created_at), 'HH24MISS')
        ELSE TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )), 'HH24MISS')
    END) as invoice_id,
    COALESCE('INV-' || TO_CHAR(MIN(COALESCE(
        CASE 
            WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
            THEN cd.inb_flight_date::date 
            ELSE NULL 
        END,
        cd.created_at
    )), 'YYYYMMDD') || '-' || CASE 
        WHEN TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )), 'HH24MISS') = '000000'
        THEN TO_CHAR(MIN(cd.created_at), 'HH24MISS')
        ELSE TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )), 'HH24MISS')
    END) as invoice_number,
    COALESCE(c.name, 'Unknown') as customer_name,
    
    -- Customer details from customers table
    c.id as customer_id,
    c.code as customer_code,
    c.email as customer_email,
    c.phone as customer_phone,
    c.address as customer_address,
    c.contact_person as customer_contact_person,
    c.city as customer_city,
    c.state as customer_state,
    c.postal_code as customer_postal_code,
    c.country as customer_country,
    c.accounting_label as customer_accounting_label,
    
    -- Handle date field properly - inb_flight_date is VARCHAR, not date
    MIN(COALESCE(
        CASE 
            WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
            THEN cd.inb_flight_date 
            ELSE NULL 
        END,
        cd.created_at::text
    )) as invoice_date, 
    CASE 
        WHEN COUNT(cd.id) = COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) 
        THEN 'processed'
        WHEN COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) = 0 
        THEN 'pending'
        ELSE 'partial'
    END as status,
    COALESCE(cd.rate_currency, 'EUR') as currency,
    
    -- Aggregated cargo data with proper null handling
    COUNT(cd.id) as total_items,
    COALESCE(SUM(COALESCE(cd.total_kg, 0)), 0) as total_weight,
    COALESCE(SUM(COALESCE(r.base_rate, 0) * COALESCE(cd.total_kg, 0)), 0) as total_amount,
    
    -- Additional useful fields
    MIN(cd.created_at) as first_item_date,
    MAX(cd.created_at) as last_item_date,
    COUNT(DISTINCT COALESCE(cd.orig_oe, '') || ' -> ' || COALESCE(cd.dest_oe, '')) as unique_routes,
    COUNT(DISTINCT cd.mail_cat) as unique_mail_categories,
    
    -- Rate information with null handling
    COALESCE(AVG(COALESCE(r.base_rate, 0)), 0) as average_rate,
    MIN(COALESCE(r.base_rate, 0)) as min_rate,
    MAX(COALESCE(r.base_rate, 0)) as max_rate,
    
    -- Rate details
    r.name as rate_name,
    r.rate_type as rate_type,
    
    -- Processing status
    CASE 
        WHEN COUNT(cd.id) = COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) 
        THEN 'processed'
        WHEN COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) = 0 
        THEN 'pending'
        ELSE 'partial'
    END as processing_status

FROM cargo_data cd
LEFT JOIN rates r ON cd.rate_id = r.id
LEFT JOIN customers c ON cd.assigned_customer = c.id
WHERE cd.assigned_customer IS NOT NULL 
  AND cd.rate_id IS NOT NULL
GROUP BY 
    cd.assigned_customer,
    cd.customer_name_number,
    cd.rate_currency,
    cd.rate_id,
    r.name,
    r.rate_type,
    c.name;

-- Note: Indexes cannot be created on views in PostgreSQL
-- The underlying cargo_data table should have appropriate indexes for performance

-- DIAGNOSTIC QUERIES - Run these to troubleshoot if view is empty:

-- 1. Check if cargo_data table has any data at all:
-- SELECT COUNT(*) as total_records FROM cargo_data;

-- 2. Check if any records have assigned_customer and rate_id populated:
-- SELECT COUNT(*) as records_with_assignments FROM cargo_data WHERE assigned_customer IS NOT NULL AND rate_id IS NOT NULL;

-- 3. Check sample records with assignment data:
-- SELECT cd.id, cd.invoice, cd.assigned_customer, cd.rate_id, r.name as rate_name, r.base_rate, cd.total_kg, cd.created_at 
-- FROM cargo_data cd
-- LEFT JOIN rates r ON cd.rate_id = r.id
-- WHERE cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL
-- LIMIT 5;

-- 4. Check for records without assignments (these won't appear in view):
-- SELECT COUNT(*) as records_without_assignments FROM cargo_data WHERE assigned_customer IS NULL OR rate_id IS NULL;

-- 5. Test the view directly:
-- SELECT * FROM invoice_summary_view LIMIT 5;

-- Create a materialized view for even better performance (optional)
-- Uncomment if you want to use materialized view instead
/*
CREATE MATERIALIZED VIEW invoice_summary_materialized AS
SELECT * FROM invoice_summary_view;

-- Create index on materialized view
CREATE INDEX idx_invoice_materialized_customer ON invoice_summary_materialized(customer_name);
CREATE INDEX idx_invoice_materialized_date ON invoice_summary_materialized(invoice_date);
CREATE INDEX idx_invoice_materialized_status ON invoice_summary_materialized(status);
CREATE INDEX idx_invoice_materialized_amount ON invoice_summary_materialized(total_amount);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_invoice_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW invoice_summary_materialized;
END;
$$ LANGUAGE plpgsql;
*/
