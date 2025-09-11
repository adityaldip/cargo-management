-- Create a view for invoice data to optimize query performance
 -- This view generates invoices directly from cargo_data table

CREATE OR REPLACE VIEW invoice_summary_view AS
SELECT 
    -- Generate invoice ID from invoice field
    cd.invoice as invoice_id,
    cd.invoice as invoice_number,
    COALESCE(cd.assigned_customer, cd.customer_name_number, 'Unknown') as customer_name,
    MIN(COALESCE(cd.inb_flight_date, cd.created_at::text)) as invoice_date,
    CASE 
        WHEN COUNT(cd.id) = COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) 
        THEN 'processed'
        WHEN COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) = 0 
        THEN 'pending'
        ELSE 'partial'
    END as status,
    COALESCE(cd.rate_currency, 'EUR') as currency,
    
    -- Aggregated cargo data
    COUNT(cd.id) as total_items,
    COALESCE(SUM(cd.total_kg), 0) as total_weight,
    COALESCE(SUM(cd.assigned_rate * cd.total_kg), 0) as total_amount,
    
    -- Additional useful fields
    MIN(cd.created_at) as first_item_date,
    MAX(cd.created_at) as last_item_date,
    COUNT(DISTINCT cd.orig_oe || ' -> ' || cd.dest_oe) as unique_routes,
    COUNT(DISTINCT cd.mail_cat) as unique_mail_categories,
    
    -- Rate information
    COALESCE(AVG(cd.assigned_rate), 0) as average_rate,
    MIN(cd.assigned_rate) as min_rate,
    MAX(cd.assigned_rate) as max_rate,
    
    -- Processing status
    CASE 
        WHEN COUNT(cd.id) = COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) 
        THEN 'processed'
        WHEN COUNT(CASE WHEN cd.assigned_customer IS NOT NULL THEN 1 END) = 0 
        THEN 'pending'
        ELSE 'partial'
    END as processing_status

FROM cargo_data cd
WHERE cd.invoice IS NOT NULL AND cd.invoice != ''
GROUP BY 
    cd.invoice,
    cd.assigned_customer,
    cd.customer_name_number,
    cd.rate_currency;

-- Note: Indexes cannot be created on views in PostgreSQL
-- The underlying cargo_data table should have appropriate indexes for performance

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
