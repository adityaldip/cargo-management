-- Create a detailed invoice view showing individual cargo items
-- This view provides line-item details for each invoice, structured to match CargoInvoiceItem interface

-- Drop the existing view first to avoid data type conflicts
DROP VIEW IF EXISTS invoice_detail_view;

CREATE VIEW invoice_detail_view AS
SELECT 
    -- Invoice identification (for grouping) - must match summary view exactly
    COALESCE('INV-' || cd.assigned_customer::text || '-' || TO_CHAR(MIN(COALESCE(
        CASE 
            WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
            THEN cd.inb_flight_date::date 
            ELSE NULL 
        END,
        cd.created_at
    )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'YYYYMMDD') || '-' || CASE 
        WHEN TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS') = '000000'
        THEN TO_CHAR(MIN(cd.created_at) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS')
        ELSE TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS')
    END) as invoice_id,
    COALESCE('INV-' || TO_CHAR(MIN(COALESCE(
        CASE 
            WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
            THEN cd.inb_flight_date::date 
            ELSE NULL 
        END,
        cd.created_at
    )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'YYYYMMDD') || '-' || CASE 
        WHEN TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS') = '000000'
        THEN TO_CHAR(MIN(cd.created_at) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS')
        ELSE TO_CHAR(MIN(COALESCE(
            CASE 
                WHEN cd.inb_flight_date IS NOT NULL AND cd.inb_flight_date != '' 
                THEN cd.inb_flight_date::date 
                ELSE NULL 
            END,
            cd.created_at
        )) OVER (PARTITION BY cd.assigned_customer, cd.rate_id), 'HH24MISS')
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
    
    -- Individual cargo item details (matching CargoInvoiceItem interface)
    cd.id as id,                                    -- CargoInvoiceItem.id
    cd.rec_id as recId,                            -- CargoInvoiceItem.recId
    cd.orig_oe || ' -> ' || cd.dest_oe as route,   -- CargoInvoiceItem.route
    cd.mail_cat as mailCat,                        -- CargoInvoiceItem.mailCat
    cd.mail_class as mailClass,                    -- CargoInvoiceItem.mailClass
    COALESCE(cd.total_kg, 0) as weight,            -- CargoInvoiceItem.weight
    COALESCE(r.base_rate, 0) as rate,              -- CargoInvoiceItem.rate
    COALESCE(r.base_rate * COALESCE(cd.total_kg, 0), 0) as amount, -- CargoInvoiceItem.amount
    COALESCE(cd.inb_flight_date, cd.created_at::text) as date, -- CargoInvoiceItem.date
    cd.invoice as invoice,                         -- CargoInvoiceItem.invoice
    cd.orig_oe as origOE,                          -- CargoInvoiceItem.origOE
    cd.dest_oe as destOE,                          -- CargoInvoiceItem.destOE
    
    -- Rate information (matching rateInfo structure)
    r.id as rate_id,                               -- Rate ID
    r.name as rate_name,                           -- Rate name
    r.description as rate_description,             -- Rate description
    r.rate_type as rate_type,                      -- Rate type
    r.base_rate as base_rate,                      -- Base rate
    cd.rate_currency as rate_currency,             -- Rate currency
    
    -- Additional details for display
    cd.inb_flight_no as inbound_flight,
    cd.outb_flight_no as outbound_flight,
    cd.des_no as destination_number,
    cd.rec_numb as record_number,
    cd.inb_flight_date as inbound_date,
    cd.outb_flight_date as outbound_date,
    
    -- Processing information
    cd.processed_at as processed_at,
    cd.assigned_at as assigned_at,
    cd.created_at as created_at,
    cd.updated_at as updated_at,
    
    -- Status information
    CASE 
        WHEN cd.assigned_customer IS NOT NULL AND cd.rate_id IS NOT NULL 
        THEN 'processed'
        WHEN cd.assigned_customer IS NULL AND cd.rate_id IS NULL 
        THEN 'pending'
        ELSE 'partial'
    END as item_status

FROM cargo_data cd
LEFT JOIN rates r ON cd.rate_id = r.id
LEFT JOIN customers c ON cd.assigned_customer = c.id
WHERE cd.assigned_customer IS NOT NULL 
  AND cd.rate_id IS NOT NULL;

-- Note: This view shows individual cargo items, not aggregated data
-- Use this for detailed invoice line items

-- DIAGNOSTIC QUERIES - Run these to test the detail view:

-- 1. Check total detail records:
-- SELECT COUNT(*) as total_detail_records FROM invoice_detail_view;

-- 2. Check detail records by customer:
-- SELECT customer_name, COUNT(*) as item_count, SUM(amount) as total_amount
-- FROM invoice_detail_view 
-- GROUP BY customer_name
-- ORDER BY total_amount DESC;

-- 3. Check detail records by invoice:
-- SELECT invoice_id, customer_name, COUNT(*) as item_count, SUM(amount) as total_amount
-- FROM invoice_detail_view 
-- GROUP BY invoice_id, customer_name
-- ORDER BY invoice_id;

-- 4. Sample detail records (matching CargoInvoiceItem structure):
-- SELECT id, recId, route, mailCat, weight, rate, amount, date, item_status
-- FROM invoice_detail_view 
-- LIMIT 10;

-- 5. Check for any items with zero amounts:
-- SELECT COUNT(*) as zero_amount_items FROM invoice_detail_view WHERE amount = 0;

-- 6. Get invoice details for a specific customer (useful for PDF generation):
-- SELECT * FROM invoice_detail_view 
-- WHERE customer_name = 'AirMail Limited'
-- ORDER BY date DESC;

-- 7. Check rate information:
-- SELECT DISTINCT rate_name, rate_type, base_rate, rate_currency
-- FROM invoice_detail_view 
-- ORDER BY rate_name;
