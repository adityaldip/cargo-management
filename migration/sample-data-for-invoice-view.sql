-- Sample data to populate tables for testing the invoice view
-- Run this after creating the tables

-- 1. Insert sample customers
INSERT INTO customers (name, code, email, phone, address, contact_person, priority, is_active) VALUES
('AirMail Limited', 'AML001', 'contact@airmail.com', '+1-555-0101', '123 Aviation Blvd, New York, NY', 'John Smith', 'high', true),
('Euro Express', 'EEX002', 'info@euroexpress.com', '+49-30-123456', '456 Logistics St, Berlin, Germany', 'Maria Garcia', 'medium', true),
('Nordic Post', 'NOP003', 'support@nordicpost.com', '+46-8-123456', '789 Shipping Ave, Stockholm, Sweden', 'Erik Johansson', 'medium', true),
('Global Cargo', 'GLC004', 'admin@globalcargo.com', '+44-20-123456', '321 Freight Way, London, UK', 'David Brown', 'low', true),
('Express Logistics', 'EXL005', 'service@expresslog.com', '+33-1-123456', '654 Transport Rd, Paris, France', 'Sophie Martin', 'high', true);

-- 2. Insert sample rates
INSERT INTO rates (name, description, rate_type, base_rate, currency, multiplier, tags, is_active) VALUES
('Standard Air Mail', 'Standard air mail rates for international shipping', 'fixed', 1.25, 'EUR', 1.0, ARRAY['airmail', 'standard'], true),
('Express Priority', 'Express priority shipping rates', 'fixed', 2.50, 'EUR', 1.0, ARRAY['express', 'priority'], true),
('Economy Ground', 'Economy ground shipping rates', 'fixed', 0.75, 'EUR', 1.0, ARRAY['economy', 'ground'], true),
('Premium Air', 'Premium air shipping rates', 'fixed', 3.00, 'EUR', 1.0, ARRAY['premium', 'air'], true),
('Bulk Discount', 'Bulk shipping discount rates', 'fixed', 0.50, 'EUR', 1.0, ARRAY['bulk', 'discount'], true);

-- 3. Insert sample cargo data with assigned customers and rate_id
INSERT INTO cargo_data (
    rec_id, inb_flight_date, outb_flight_date, des_no, rec_numb,
    orig_oe, dest_oe, inb_flight_no, outb_flight_no,
    mail_cat, mail_class, total_kg, invoice,
    customer_name_number, assigned_customer, rate_currency,
    rate_id, rate_value, processed_at, assigned_at
) VALUES
-- AirMail Limited shipments
('REC001', '2024-01-15', '2024-01-16', 'DES001', 'NUM001',
 'USFRAT', 'USRIXT', 'AA123', 'AA456',
 'A', 'B', 25.5, 'INV-AML-2024-001',
 'AirMail Limited / ZZXDA14', 'AirMail Limited', 'EUR',
 (SELECT id FROM rates WHERE name = 'Standard Air Mail'), 1.25, NOW(), NOW()),

('REC002', '2024-01-16', '2024-01-17', 'DES002', 'NUM002',
 'USFRAT', 'USRIXT', 'AA124', 'AA457',
 'B', 'A', 18.3, 'INV-AML-2024-002',
 'AirMail Limited / ZZXDA15', 'AirMail Limited', 'EUR',
 (SELECT id FROM rates WHERE name = 'Standard Air Mail'), 1.25, NOW(), NOW()),

-- Euro Express shipments
('REC003', '2024-01-17', '2024-01-18', 'DES003', 'NUM003',
 'DKCPHA', 'FRANK', 'SK789', 'SK012',
 'A', 'A', 32.1, 'INV-EEX-2024-001',
 'Euro Express / EEX001', 'Euro Express', 'EUR',
 (SELECT id FROM rates WHERE name = 'Express Priority'), 2.50, NOW(), NOW()),

('REC004', '2024-01-18', '2024-01-19', 'DES004', 'NUM004',
 'DKCPHA', 'FRANK', 'SK790', 'SK013',
 'B', 'B', 15.7, 'INV-EEX-2024-002',
 'Euro Express / EEX002', 'Euro Express', 'EUR',
 (SELECT id FROM rates WHERE name = 'Express Priority'), 2.50, NOW(), NOW()),

-- Nordic Post shipments
('REC005', '2024-01-19', '2024-01-20', 'DES005', 'NUM005',
 'SEARNK', 'OSLO', 'DY345', 'DY678',
 'A', 'A', 28.9, 'INV-NOP-2024-001',
 'Nordic Post / NOP001', 'Nordic Post', 'EUR',
 (SELECT id FROM rates WHERE name = 'Standard Air Mail'), 1.25, NOW(), NOW()),

('REC006', '2024-01-20', '2024-01-21', 'DES006', 'NUM006',
 'SEARNK', 'OSLO', 'DY346', 'DY679',
 'B', 'A', 22.4, 'INV-NOP-2024-002',
 'Nordic Post / NOP002', 'Nordic Post', 'EUR',
 (SELECT id FROM rates WHERE name = 'Standard Air Mail'), 1.25, NOW(), NOW()),

-- Global Cargo shipments
('REC007', '2024-01-21', '2024-01-22', 'DES007', 'NUM007',
 'GBLHR', 'GBMAN', 'BA123', 'BA456',
 'A', 'B', 35.2, 'INV-GLC-2024-001',
 'Global Cargo / GLC001', 'Global Cargo', 'EUR',
 (SELECT id FROM rates WHERE name = 'Economy Ground'), 0.75, NOW(), NOW()),

-- Express Logistics shipments
('REC008', '2024-01-22', '2024-01-23', 'DES008', 'NUM008',
 'FRCDG', 'FRNCE', 'AF789', 'AF012',
 'A', 'A', 41.8, 'INV-EXL-2024-001',
 'Express Logistics / EXL001', 'Express Logistics', 'EUR',
 (SELECT id FROM rates WHERE name = 'Premium Air'), 3.00, NOW(), NOW()),

('REC009', '2024-01-23', '2024-01-24', 'DES009', 'NUM009',
 'FRCDG', 'FRNCE', 'AF790', 'AF013',
 'B', 'A', 19.6, 'INV-EXL-2024-002',
 'Express Logistics / EXL002', 'Express Logistics', 'EUR',
 (SELECT id FROM rates WHERE name = 'Premium Air'), 3.00, NOW(), NOW()),

-- More AirMail Limited shipments (to test grouping)
('REC010', '2024-01-24', '2024-01-25', 'DES010', 'NUM010',
 'USFRAT', 'USRIXT', 'AA125', 'AA458',
 'A', 'A', 30.1, 'INV-AML-2024-003',
 'AirMail Limited / ZZXDA16', 'AirMail Limited', 'EUR',
 (SELECT id FROM rates WHERE name = 'Standard Air Mail'), 1.25, NOW(), NOW());

-- 4. Insert some cargo data WITHOUT assigned customers (these won't appear in the view)
INSERT INTO cargo_data (
    rec_id, inb_flight_date, outb_flight_date, des_no, rec_numb,
    orig_oe, dest_oe, inb_flight_no, outb_flight_no,
    mail_cat, mail_class, total_kg, invoice,
    customer_name_number
) VALUES
('REC011', '2024-01-25', '2024-01-26', 'DES011', 'NUM011',
 'USFRAT', 'USRIXT', 'AA126', 'AA459',
 'A', 'B', 25.0, 'INV-PENDING-001',
 'Unassigned Customer / UNK001'),

('REC012', '2024-01-26', '2024-01-27', 'DES012', 'NUM012',
 'DKCPHA', 'FRANK', 'SK791', 'SK014',
 'B', 'A', 20.0, 'INV-PENDING-002',
 'Another Unassigned / UNK002');

-- Verify the data
SELECT 'Customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'Rates' as table_name, COUNT(*) as record_count FROM rates
UNION ALL
SELECT 'Cargo Data (Total)' as table_name, COUNT(*) as record_count FROM cargo_data
UNION ALL
SELECT 'Cargo Data (With Assignments)' as table_name, COUNT(*) as record_count FROM cargo_data 
WHERE assigned_customer IS NOT NULL AND rate_id IS NOT NULL AND assigned_customer != '';
