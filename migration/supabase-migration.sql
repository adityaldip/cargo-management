-- Cargo Management System Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE rate_type AS ENUM ('fixed', 'per_kg', 'distance_based', 'zone_based');

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(255),
    priority priority_level DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_date DATE DEFAULT CURRENT_DATE,
    total_shipments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer rules table
CREATE TABLE customer_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '{}',
    match_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    where_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(priority)
);

-- Rate rules table
CREATE TABLE rate_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '{}',
    match_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(priority)
);

-- Cargo data table
CREATE TABLE cargo_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rec_id VARCHAR(255) NOT NULL,
    inb_flight_date VARCHAR(50),
    outb_flight_date VARCHAR(50),
    des_no VARCHAR(50),
    rec_numb VARCHAR(50),
    orig_oe VARCHAR(50),
    dest_oe VARCHAR(50),
    inb_flight_no VARCHAR(50),
    outb_flight_no VARCHAR(50),
    mail_cat VARCHAR(10),
    mail_class VARCHAR(10),
    total_kg DECIMAL(10,2),
    invoice VARCHAR(100),
    customer_name_number TEXT,
    assigned_customer VARCHAR(255),
    assigned_rate DECIMAL(10,2),
    rate_currency VARCHAR(3),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Column mappings table
CREATE TABLE column_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255) NOT NULL,
    mapped_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(original_name)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status invoice_status DEFAULT 'draft',
    due_date DATE NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customer_rules_priority ON customer_rules(priority);
CREATE INDEX idx_customer_rules_is_active ON customer_rules(is_active);
CREATE INDEX idx_rate_rules_priority ON rate_rules(priority);
CREATE INDEX idx_rate_rules_is_active ON rate_rules(is_active);
CREATE INDEX idx_cargo_data_rec_id ON cargo_data(rec_id);
CREATE INDEX idx_cargo_data_orig_oe ON cargo_data(orig_oe);
CREATE INDEX idx_cargo_data_dest_oe ON cargo_data(dest_oe);
CREATE INDEX idx_cargo_data_assigned_customer ON cargo_data(assigned_customer);
CREATE INDEX idx_cargo_data_processed_at ON cargo_data(processed_at);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_rules_updated_at BEFORE UPDATE ON customer_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_rules_updated_at BEFORE UPDATE ON rate_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cargo_data_updated_at BEFORE UPDATE ON cargo_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_column_mappings_updated_at BEFORE UPDATE ON column_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your authentication needs)
-- For now, allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON customer_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON rate_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON cargo_data
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON column_mappings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO customers (name, code, email, phone, address, contact_person, priority, total_shipments) VALUES
('Premium Express Ltd', 'PREM001', 'contact@premiumexpress.com', '+371 2345 6789', 'Riga, Latvia', 'Anna Berzina', 'high', 245),
('Nordic Post AS', 'NORD002', 'info@nordicpost.ee', '+372 5678 9012', 'Tallinn, Estonia', 'Erik Saar', 'high', 189),
('Baltic Express Network', 'BALT003', 'support@balticexpress.lt', '+370 6789 0123', 'Vilnius, Lithuania', 'Ruta Kazlauskas', 'medium', 156),
('Cargo Masters International', 'CARG004', 'operations@cargomasters.com', '+49 30 1234 5678', 'Berlin, Germany', 'Hans Mueller', 'medium', 134),
('General Mail Services', 'GENM005', 'service@generalmail.com', '+33 1 2345 6789', 'Paris, France', 'Marie Dubois', 'low', 78);

-- Insert first 20 customer rules (route codes)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('DKCPHA', 'Route rule for DKCPHA', 1, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DKCPHA"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DKCPHB', 'Route rule for DKCPHB', 2, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DKCPHB"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DKCPHC', 'Route rule for DKCPHC', 3, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DKCPHC"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DKCPHP', 'Route rule for DKCPHP', 4, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DKCPHP"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('ISREKA', 'Route rule for ISREKA', 5, '[{"field": "orig_dest_oe", "operator": "equals", "value": "ISREKA"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SESTOK', 'Route rule for SESTOK', 6, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SESTOK"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USEWRZ', 'Route rule for USEWRZ', 7, '[{"field": "orig_dest_oe", "operator": "equals", "value": "USEWRZ"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USCHIX', 'Route rule for USCHIX', 8, '[{"field": "orig_dest_oe", "operator": "equals", "value": "USCHIX"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USLAXS', 'Route rule for USLAXS', 9, '[{"field": "orig_dest_oe", "operator": "equals", "value": "USLAXS"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEARND', 'Route rule for SEARND', 10, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEARND"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAA', 'Route rule for SEMMAA', 11, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAA"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAB', 'Route rule for SEMMAB', 12, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAB"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAH', 'Route rule for SEMMAH', 13, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAH"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAI', 'Route rule for SEMMAI', 14, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAI"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAC', 'Route rule for SEMMAC', 15, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAC"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAF', 'Route rule for SEMMAF', 16, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAF"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAQ', 'Route rule for SEMMAQ', 17, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAQ"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SEMMAG', 'Route rule for SEMMAG', 18, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SEMMAG"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLHFDW', 'Route rule for NLHFDW', 19, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDW"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLHFDS', 'Route rule for NLHFDS', 20, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDS"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']);

-- Continue with remaining route rules (21-40)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('NLHFDR', 'Route rule for NLHFDR', 21, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDR"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('LV%', 'Route rule for LV%', 22, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "LV"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('TM%', 'Route rule for TM%', 23, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "TM"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('KG%', 'Route rule for KG%', 24, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "KG"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('BY%', 'Route rule for BY%', 25, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "BY"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('HR%', 'Route rule for HR%', 26, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "HR"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('MK%', 'Route rule for MK%', 27, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "MK"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLHFDY', 'Route rule for NLHFDY', 28, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDY"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLHFDZ', 'Route rule for NLHFDZ', 29, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDZ"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLHFDX', 'Route rule for NLHFDX', 30, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLHFDX"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NL%', 'Route rule for NL%', 31, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "NL"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('TWTPEB', 'Route rule for TWTPEB', 32, '[{"field": "orig_dest_oe", "operator": "equals", "value": "TWTPEB"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SESTOA', 'Route rule for SESTOA', 33, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SESTOA"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('FIHELZ', 'Route rule for FIHELZ', 34, '[{"field": "orig_dest_oe", "operator": "equals", "value": "FIHELZ"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SESTOD', 'Route rule for SESTOD', 35, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SESTOD"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('HU%', 'Route rule for HU%', 36, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "HU"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EEEAP%', 'Route rule for EEEAP%', 37, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "EEEAP"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EETLLM', 'Route rule for EETLLM', 38, '[{"field": "orig_dest_oe", "operator": "equals", "value": "EETLLM"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NLSRKY', 'Route rule for NLSRKY', 39, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NLSRKY"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EETLL%', 'Route rule for EETLL%', 40, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "EETLL"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']);

-- Continue with more route rules (41-103)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('LTKUNZ', 'Route rule for LTKUNZ', 41, '[{"field": "orig_dest_oe", "operator": "equals", "value": "LTKUNZ"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('AZ%', 'Route rule for AZ%', 42, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "AZ"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('LT%', 'Route rule for LT%', 43, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "LT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EELOOX', 'Route rule for EELOOX', 44, '[{"field": "orig_dest_oe", "operator": "equals", "value": "EELOOX"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EELOOY', 'Route rule for EELOOY', 45, '[{"field": "orig_dest_oe", "operator": "equals", "value": "EELOOY"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EELOOZ', 'Route rule for EELOOZ', 46, '[{"field": "orig_dest_oe", "operator": "equals", "value": "EELOOZ"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('UZTASE', 'Route rule for UZTASE', 47, '[{"field": "orig_dest_oe", "operator": "equals", "value": "UZTASE"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEROUX', 'Route rule for DEROUX', 48, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEROUX"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEROUZ', 'Route rule for DEROUZ', 49, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEROUZ"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEDIEY', 'Route rule for DEDIEY', 50, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEDIEY"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEDIET', 'Route rule for DEDIET', 51, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEDIET"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DENIAA', 'Route rule for DENIAA', 52, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DENIAA"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEFRAA', 'Route rule for DEFRAA', 53, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEFRAA"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('DEFRAB', 'Route rule for DEFRAB', 54, '[{"field": "orig_dest_oe", "operator": "equals", "value": "DEFRAB"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('FIHELA', 'Route rule for FIHELA', 55, '[{"field": "orig_dest_oe", "operator": "equals", "value": "FIHELA"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('BE%', 'Route rule for BE%', 56, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "BE"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SGSIN%', 'Route rule for SGSIN%', 57, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "SGSIN"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('GRATH%', 'Route rule for GRATH%', 58, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "GRATH"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USFRA%', 'Route rule for USFRA%', 59, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USFRA"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USWAW%', 'Route rule for USWAW%', 60, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USWAW"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']);

-- Continue with more route rules (61-103)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('USTBS%', 'Route rule for USTBS%', 61, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USTBS"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USTLL%', 'Route rule for USTLL%', 62, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USTLL"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USHEL%', 'Route rule for USHEL%', 63, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USHEL"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USLON%', 'Route rule for USLON%', 64, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USLON"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USMAD%', 'Route rule for USMAD%', 65, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USMAD"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USRIX%', 'Route rule for USRIX%', 66, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USRIX"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USVNO%', 'Route rule for USVNO%', 67, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USVNO"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USEVIZ', 'Route rule for USEVIZ', 68, '[{"field": "orig_dest_oe", "operator": "equals", "value": "USEVIZ"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USSGVZ', 'Route rule for USSGVZ', 69, '[{"field": "orig_dest_oe", "operator": "equals", "value": "USSGVZ"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('SJLYRA', 'Route rule for SJLYRA', 70, '[{"field": "orig_dest_oe", "operator": "equals", "value": "SJLYRA"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USMLA%', 'Route rule for USMLA%', 71, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USMLA"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('EETLLT', 'Route rule for EETLLT', 72, '[{"field": "orig_dest_oe", "operator": "equals", "value": "EETLLT"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USOSL%', 'Route rule for USOSL%', 73, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USOSL"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USLJU%', 'Route rule for USLJU%', 74, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USLJU"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('HRZAG', 'Route rule for HRZAG', 75, '[{"field": "orig_dest_oe", "operator": "equals", "value": "HRZAG"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('IT%', 'Route rule for IT%', 76, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "IT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('VA%', 'Route rule for VA%', 77, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "VA"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('CH%', 'Route rule for CH%', 78, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "CH"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NOOSLZ', 'Route rule for NOOSLZ', 79, '[{"field": "orig_dest_oe", "operator": "equals", "value": "NOOSLZ"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('NO%', 'Route rule for NO%', 80, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "NO"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('UA%', 'Route rule for UA%', 81, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "UA"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('AT%', 'Route rule for AT%', 82, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "AT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('ES%', 'Route rule for ES%', 83, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "ES"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('PLWAW%', 'Route rule for PLWAW%', 84, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "PLWAW"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('GB%', 'Route rule for GB%', 85, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "GB"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('AU%', 'Route rule for AU%', 86, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "AU"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('JE%', 'Route rule for JE%', 87, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "JE"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('IE%', 'Route rule for IE%', 88, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "IE"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('FR%', 'Route rule for FR%', 89, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "FR"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('PT%', 'Route rule for PT%', 90, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "PT"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('CN%', 'Route rule for CN%', 91, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "CN"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('UZTAS%', 'Route rule for UZTAS%', 92, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "UZTAS"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('GE%', 'Route rule for GE%', 93, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "GE"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('IL%', 'Route rule for IL%', 94, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "IL"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('CZ%', 'Route rule for CZ%', 95, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "CZ"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('MD%', 'Route rule for MD%', 96, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "MD"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USORD%', 'Route rule for USORD%', 97, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USORD"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USJFK%', 'Route rule for USJFK%', 98, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USJFK"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('USLAXA%', 'Route rule for USLAXA%', 99, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "USLAXA"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('ROBUH%', 'Route rule for ROBUH%', 100, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "ROBUH"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('JP%', 'Route rule for JP%', 101, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "JP"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('AM%', 'Route rule for AM%', 102, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "AM"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']),
('MTMAR%', 'Route rule for MTMAR%', 103, '[{"field": "orig_dest_oe", "operator": "starts_with", "value": "MTMAR"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Orig.OE', 'Des.OE']);

-- Flight Number rules (104-125)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('BT620%', 'Flight rule for BT620%', 104, '[{"field": "flight_number", "operator": "starts_with", "value": "BT620"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT733', 'Flight rule for BT733', 105, '[{"field": "flight_number", "operator": "equals", "value": "BT733"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT69%', 'Flight rule for BT69%', 106, '[{"field": "flight_number", "operator": "starts_with", "value": "BT69"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT658%', 'Flight rule for BT658%', 107, '[{"field": "flight_number", "operator": "starts_with", "value": "BT658"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT65%', 'Flight rule for BT65%', 108, '[{"field": "flight_number", "operator": "starts_with", "value": "BT65"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT872%', 'Flight rule for BT872%', 109, '[{"field": "flight_number", "operator": "starts_with", "value": "BT872"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT852%', 'Flight rule for BT852%', 110, '[{"field": "flight_number", "operator": "starts_with", "value": "BT852"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT854%', 'Flight rule for BT854%', 111, '[{"field": "flight_number", "operator": "starts_with", "value": "BT854"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT612%', 'Flight rule for BT612%', 112, '[{"field": "flight_number", "operator": "starts_with", "value": "BT612"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT478%', 'Flight rule for BT478%', 113, '[{"field": "flight_number", "operator": "starts_with", "value": "BT478"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT274%', 'Flight rule for BT274%', 114, '[{"field": "flight_number", "operator": "starts_with", "value": "BT274"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT68%', 'Flight rule for BT68%', 115, '[{"field": "flight_number", "operator": "starts_with", "value": "BT68"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT846%', 'Flight rule for BT846%', 116, '[{"field": "flight_number", "operator": "starts_with", "value": "BT846"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT60%', 'Flight rule for BT60%', 117, '[{"field": "flight_number", "operator": "starts_with", "value": "BT60"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT308', 'Flight rule for BT308', 118, '[{"field": "flight_number", "operator": "equals", "value": "BT308"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT326', 'Flight rule for BT326', 119, '[{"field": "flight_number", "operator": "equals", "value": "BT326"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT421%', 'Flight rule for BT421%', 120, '[{"field": "flight_number", "operator": "starts_with", "value": "BT421"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT72%', 'Flight rule for BT72%', 121, '[{"field": "flight_number", "operator": "starts_with", "value": "BT72"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']),
('BT618%', 'Flight rule for BT618%', 122, '[{"field": "flight_number", "operator": "starts_with", "value": "BT618"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Inb. Flight No.', 'Outb. Flight No.']);

-- Mail Category rules (123-125)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('U%', 'Mail category rule for U%', 123, '[{"field": "mail_category", "operator": "starts_with", "value": "U"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Mail Cat.']),
('C%', 'Mail category rule for C%', 124, '[{"field": "mail_category", "operator": "starts_with", "value": "C"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Mail Cat.']),
('E%', 'Mail category rule for E%', 125, '[{"field": "mail_category", "operator": "starts_with", "value": "E"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Mail Cat.']);

-- Mail Class rules (126-140)
INSERT INTO customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('BE% (mail_class)', 'Mail class rule for BE%', 126, '[{"field": "mail_class", "operator": "starts_with", "value": "BE"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('AT% (mail_class)', 'Mail class rule for AT%', 127, '[{"field": "mail_class", "operator": "starts_with", "value": "AT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('FR% (mail_class)', 'Mail class rule for FR%', 128, '[{"field": "mail_class", "operator": "starts_with", "value": "FR"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Mail Class']),
('DE% (mail_class)', 'Mail class rule for DE%', 129, '[{"field": "mail_class", "operator": "starts_with", "value": "DE"}]'::jsonb, '{"assignTo": "cargo-masters"}'::jsonb, ARRAY['Mail Class']),
('IT% (mail_class)', 'Mail class rule for IT%', 130, '[{"field": "mail_class", "operator": "starts_with", "value": "IT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('MT% (mail_class)', 'Mail class rule for MT%', 131, '[{"field": "mail_class", "operator": "starts_with", "value": "MT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('CZ% (mail_class)', 'Mail class rule for CZ%', 132, '[{"field": "mail_class", "operator": "starts_with", "value": "CZ"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('CH% (mail_class)', 'Mail class rule for CH%', 133, '[{"field": "mail_class", "operator": "starts_with", "value": "CH"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('NL% (mail_class)', 'Mail class rule for NL%', 134, '[{"field": "mail_class", "operator": "starts_with", "value": "NL"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('GB% (mail_class)', 'Mail class rule for GB%', 135, '[{"field": "mail_class", "operator": "starts_with", "value": "GB"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Mail Class']),
('NO% (mail_class)', 'Mail class rule for NO%', 136, '[{"field": "mail_class", "operator": "starts_with", "value": "NO"}]'::jsonb, '{"assignTo": "nordic-post"}'::jsonb, ARRAY['Mail Class']),
('ES% (mail_class)', 'Mail class rule for ES%', 137, '[{"field": "mail_class", "operator": "starts_with", "value": "ES"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('LT% (mail_class)', 'Mail class rule for LT%', 138, '[{"field": "mail_class", "operator": "starts_with", "value": "LT"}]'::jsonb, '{"assignTo": "baltic-express"}'::jsonb, ARRAY['Mail Class']),
('UA% (mail_class)', 'Mail class rule for UA%', 139, '[{"field": "mail_class", "operator": "starts_with", "value": "UA"}]'::jsonb, '{"assignTo": "general-mail"}'::jsonb, ARRAY['Mail Class']),
('VA% (mail_class)', 'Mail class rule for VA%', 140, '[{"field": "mail_class", "operator": "starts_with", "value": "VA"}]'::jsonb, '{"assignTo": "premium-express"}'::jsonb, ARRAY['Mail Class']);

-- Insert sample rate rules
INSERT INTO rate_rules (name, description, priority, conditions, actions) VALUES
('EU Zone Standard Rate', 'Standard rate for EU destinations under 25kg', 1, 
 '[{"field": "route", "operator": "contains", "value": "FRANK,DEBER,CZPRG,ITFCO"}, {"field": "weight", "operator": "less_than", "value": "25"}, {"field": "mail_category", "operator": "equals", "value": "A"}]'::jsonb, 
 '{"rateType": "per_kg", "baseRate": 4.50, "multiplier": 1.0, "currency": "EUR", "tags": ["EU", "Standard", "Light"]}'::jsonb),
('Nordic Express Premium', 'Premium rates for Nordic routes with priority handling', 2, 
 '[{"field": "route", "operator": "contains", "value": "SEARNK,NOKRS,DKAAR,FICPH"}, {"field": "mail_category", "operator": "equals", "value": "A"}, {"field": "weight", "operator": "greater_than", "value": "10"}]'::jsonb, 
 '{"rateType": "per_kg", "baseRate": 6.75, "multiplier": 1.25, "currency": "EUR", "tags": ["Nordic", "Premium", "Express"]}'::jsonb),
('Heavy Cargo Discount', 'Discounted rates for heavy shipments over 50kg', 3, 
 '[{"field": "weight", "operator": "greater_than", "value": "50"}, {"field": "mail_category", "operator": "equals", "value": "B"}]'::jsonb, 
 '{"rateType": "per_kg", "baseRate": 3.25, "multiplier": 0.85, "currency": "EUR", "tags": ["Heavy", "Discount", "Bulk"]}'::jsonb);

-- Success message
SELECT 'Cargo Management System database setup completed successfully!' as message;
