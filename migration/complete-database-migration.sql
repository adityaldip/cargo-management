-- Complete Database Migration for Cargo Management System
-- This script creates all tables, types, functions, and triggers in the correct order
-- Run this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types first (before tables that reference them)
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE rate_type AS ENUM ('fixed', 'per_kg', 'distance_based', 'zone_based');

-- Create the update_updated_at_column function (needed for triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name CHARACTER VARYING(255) NOT NULL,
    code CHARACTER VARYING(50) NOT NULL,
    email CHARACTER VARYING(255) NOT NULL,
    phone CHARACTER VARYING(50) NULL,
    address TEXT NULL,
    contact_person CHARACTER VARYING(255) NULL,
    priority priority_level NULL DEFAULT 'medium'::priority_level,
    is_active BOOLEAN NULL DEFAULT true,
    created_date DATE NULL DEFAULT CURRENT_DATE,
    total_shipments INTEGER NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    accounting_label CHARACTER VARYING(255) NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- 2. Create customer_codes table
CREATE TABLE public.customer_codes (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    code CHARACTER VARYING(50) NOT NULL,
    accounting_label CHARACTER VARYING(255) NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT customer_codes_pkey PRIMARY KEY (id),
    CONSTRAINT customer_codes_customer_id_code_key UNIQUE (customer_id, code)
) TABLESPACE pg_default;

-- 3. Create rates table
CREATE TABLE public.rates (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name CHARACTER VARYING(255) NOT NULL,
    description TEXT NULL,
    rate_type CHARACTER VARYING(50) NOT NULL DEFAULT 'fixed',
    base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency CHARACTER VARYING(3) NOT NULL DEFAULT 'EUR',
    multiplier NUMERIC(5,2) DEFAULT 1.0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rates_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 4. Create customer_rules table
CREATE TABLE public.customer_rules (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name CHARACTER VARYING(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '{}',
    match_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE NULL,
    where_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT customer_rules_pkey PRIMARY KEY (id),
    CONSTRAINT customer_rules_priority_key UNIQUE (priority)
) TABLESPACE pg_default;

-- 5. Create rate_rules table
CREATE TABLE public.rate_rules (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name CHARACTER VARYING(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    rate_id UUID NOT NULL REFERENCES rates(id) ON DELETE CASCADE,
    match_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rate_rules_pkey PRIMARY KEY (id),
    CONSTRAINT rate_rules_priority_key UNIQUE (priority)
) TABLESPACE pg_default;

-- 6. Create cargo_data table
CREATE TABLE public.cargo_data (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    rec_id CHARACTER VARYING(255) NOT NULL,
    inb_flight_date CHARACTER VARYING(50) NULL,
    outb_flight_date CHARACTER VARYING(50) NULL,
    des_no CHARACTER VARYING(50) NULL,
    rec_numb CHARACTER VARYING(50) NULL,
    orig_oe CHARACTER VARYING(50) NULL,
    dest_oe CHARACTER VARYING(50) NULL,
    inb_flight_no CHARACTER VARYING(50) NULL,
    outb_flight_no CHARACTER VARYING(50) NULL,
    mail_cat CHARACTER VARYING(10) NULL,
    mail_class CHARACTER VARYING(10) NULL,
    total_kg NUMERIC(10, 2) NULL,
    invoice CHARACTER VARYING(100) NULL,
    customer_name_number TEXT NULL,
    assigned_customer UUID NULL,
    customer_code_id UUID NULL,
    assigned_rate NUMERIC(10, 2) NULL,
    rate_currency CHARACTER VARYING(3) NULL,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE NULL,
    rate_id UUID NULL,
    rate_value NUMERIC(10, 2) NULL,
    CONSTRAINT cargo_data_pkey PRIMARY KEY (id),
    CONSTRAINT cargo_data_rate_id_fkey FOREIGN KEY (rate_id) REFERENCES rates (id) ON DELETE SET NULL,
    CONSTRAINT cargo_data_customer_code_id_fkey FOREIGN KEY (customer_code_id) REFERENCES customer_codes (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 7. Create column_mappings table
CREATE TABLE public.column_mappings (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    original_name CHARACTER VARYING(255) NOT NULL,
    mapped_name CHARACTER VARYING(255) NOT NULL,
    data_type CHARACTER VARYING(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT column_mappings_pkey PRIMARY KEY (id),
    CONSTRAINT column_mappings_original_name_key UNIQUE (original_name)
) TABLESPACE pg_default;

-- 8. Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    invoice_number CHARACTER VARYING(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    total_amount NUMERIC(12,2) NOT NULL,
    currency CHARACTER VARYING(3) DEFAULT 'EUR',
    status invoice_status DEFAULT 'draft',
    due_date DATE NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]',
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT invoices_pkey PRIMARY KEY (id),
    CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers USING btree (code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_customer_codes_customer_id ON public.customer_codes USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_codes_code ON public.customer_codes USING btree (code) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rates_is_active ON public.rates USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_customer_rules_priority ON public.customer_rules USING btree (priority) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_rules_is_active ON public.customer_rules USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rate_rules_priority ON public.rate_rules USING btree (priority) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rate_rules_is_active ON public.rate_rules USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rate_rules_rate_id ON public.rate_rules USING btree (rate_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cargo_data_rec_id ON public.cargo_data USING btree (rec_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_orig_oe ON public.cargo_data USING btree (orig_oe) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_dest_oe ON public.cargo_data USING btree (dest_oe) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_processed_at ON public.cargo_data USING btree (processed_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_assigned_at ON public.cargo_data USING btree (assigned_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_rate_id ON public.cargo_data USING btree (rate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_rate_value ON public.cargo_data USING btree (rate_value) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_assigned_customer ON public.cargo_data USING btree (assigned_customer) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cargo_data_customer_code_id ON public.cargo_data USING btree (customer_code_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices USING btree (due_date) TABLESPACE pg_default;

-- Create triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_codes_updated_at 
    BEFORE UPDATE ON public.customer_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rates_updated_at 
    BEFORE UPDATE ON public.rates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_rules_updated_at 
    BEFORE UPDATE ON public.customer_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_rules_updated_at 
    BEFORE UPDATE ON public.rate_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cargo_data_updated_at 
    BEFORE UPDATE ON public.cargo_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_column_mappings_updated_at 
    BEFORE UPDATE ON public.column_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.customer_codes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.rates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.customer_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.rate_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.cargo_data
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.column_mappings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customer_codes TO authenticated;
GRANT ALL ON public.rates TO authenticated;
GRANT ALL ON public.customer_rules TO authenticated;
GRANT ALL ON public.rate_rules TO authenticated;
GRANT ALL ON public.cargo_data TO authenticated;
GRANT ALL ON public.column_mappings TO authenticated;
GRANT ALL ON public.invoices TO authenticated;

GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.customer_codes TO service_role;
GRANT ALL ON public.rates TO service_role;
GRANT ALL ON public.customer_rules TO service_role;
GRANT ALL ON public.rate_rules TO service_role;
GRANT ALL ON public.cargo_data TO service_role;
GRANT ALL ON public.column_mappings TO service_role;
GRANT ALL ON public.invoices TO service_role;

-- Insert sample data
INSERT INTO public.customers (name, code, email, phone, address, contact_person, priority, total_shipments) VALUES
('Premium Express Ltd', 'PREM001', 'contact@premiumexpress.com', '+371 2345 6789', 'Riga, Latvia', 'Anna Berzina', 'high', 245),
('Nordic Post AS', 'NORD002', 'info@nordicpost.ee', '+372 5678 9012', 'Tallinn, Estonia', 'Erik Saar', 'high', 189),
('Baltic Express Network', 'BALT003', 'support@balticexpress.lt', '+370 6789 0123', 'Vilnius, Lithuania', 'Ruta Kazlauskas', 'medium', 156),
('Cargo Masters International', 'CARG004', 'operations@cargomasters.com', '+49 30 1234 5678', 'Berlin, Germany', 'Hans Mueller', 'medium', 134),
('General Mail Services', 'GENM005', 'service@generalmail.com', '+33 1 2345 6789', 'Paris, France', 'Marie Dubois', 'low', 78);

-- Insert sample customer codes
INSERT INTO public.customer_codes (customer_id, code, accounting_label, is_active) VALUES
((SELECT id FROM public.customers WHERE code = 'PREM001'), 'PREM001', 'Premium Express Main Code', true),
((SELECT id FROM public.customers WHERE code = 'PREM001'), 'PREM001-EXPRESS', 'Premium Express Express Service', true),
((SELECT id FROM public.customers WHERE code = 'NORD002'), 'NORD002', 'Nordic Post Main Code', true),
((SELECT id FROM public.customers WHERE code = 'NORD002'), 'NORD002-PRIORITY', 'Nordic Post Priority Service', true),
((SELECT id FROM public.customers WHERE code = 'BALT003'), 'BALT003', 'Baltic Express Main Code', true),
((SELECT id FROM public.customers WHERE code = 'CARG004'), 'CARG004', 'Cargo Masters Main Code', true),
((SELECT id FROM public.customers WHERE code = 'CARG004'), 'CARG004-HEAVY', 'Cargo Masters Heavy Cargo', true),
((SELECT id FROM public.customers WHERE code = 'GENM005'), 'GENM005', 'General Mail Main Code', true);

-- Insert sample rates
INSERT INTO public.rates (name, description, rate_type, base_rate, currency, multiplier, tags, is_active) VALUES
('EU Standard Rate', 'Standard rate for EU destinations', 'per_kg', 4.50, 'EUR', 1.0, ARRAY['EU', 'Standard'], true),
('Nordic Express Premium', 'Premium rates for Nordic routes', 'per_kg', 6.75, 'EUR', 1.25, ARRAY['Nordic', 'Premium'], true),
('Heavy Cargo Discount', 'Discounted rates for heavy shipments', 'per_kg', 3.25, 'EUR', 0.85, ARRAY['Heavy', 'Discount'], true);

-- Insert sample customer rules (using customer code IDs)
INSERT INTO public.customer_rules (name, description, priority, conditions, actions, where_fields) VALUES
('DKCPHA', 'Route rule for DKCPHA', 1, '[{"field": "orig_oe", "operator": "equals", "value": "DKCPHA"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'PREM001') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('DKCPHB', 'Route rule for DKCPHB', 2, '[{"field": "orig_oe", "operator": "equals", "value": "DKCPHB"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'PREM001-EXPRESS') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('DKCPHC', 'Route rule for DKCPHC', 3, '[{"field": "orig_oe", "operator": "equals", "value": "DKCPHC"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'PREM001') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('DKCPHP', 'Route rule for DKCPHP', 4, '[{"field": "orig_oe", "operator": "equals", "value": "DKCPHP"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'PREM001-EXPRESS') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('ISREKA', 'Route rule for ISREKA', 5, '[{"field": "orig_oe", "operator": "equals", "value": "ISREKA"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'NORD002') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('SESTOK', 'Route rule for SESTOK', 6, '[{"field": "orig_oe", "operator": "equals", "value": "SESTOK"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'NORD002-PRIORITY') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('USEWRZ', 'Route rule for USEWRZ', 7, '[{"field": "orig_oe", "operator": "equals", "value": "USEWRZ"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'CARG004') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('USCHIX', 'Route rule for USCHIX', 8, '[{"field": "orig_oe", "operator": "equals", "value": "USCHIX"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'CARG004-HEAVY') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('USLAXS', 'Route rule for USLAXS', 9, '[{"field": "orig_oe", "operator": "equals", "value": "USLAXS"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'CARG004') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']),
('SEARND', 'Route rule for SEARND', 10, '[{"field": "orig_oe", "operator": "equals", "value": "SEARND"}]'::jsonb, '{"assignTo": "' || (SELECT id FROM public.customer_codes WHERE code = 'BALT003') || '"}'::jsonb, ARRAY['orig_oe', 'dest_oe']);

-- Insert sample rate rules
INSERT INTO public.rate_rules (name, description, priority, conditions, rate_id) VALUES
('EU Zone Standard Rate', 'Standard rate for EU destinations under 25kg', 1, 
 '[{"field": "route", "operator": "contains", "value": "FRANK,DEBER,CZPRG,ITFCO"}, {"field": "weight", "operator": "less_than", "value": "25"}, {"field": "mail_category", "operator": "equals", "value": "A"}]'::jsonb, 
 (SELECT id FROM public.rates WHERE name = 'EU Standard Rate')),
('Nordic Express Premium', 'Premium rates for Nordic routes with priority handling', 2, 
 '[{"field": "route", "operator": "contains", "value": "SEARNK,NOKRS,DKAAR,FICPH"}, {"field": "mail_category", "operator": "equals", "value": "A"}, {"field": "weight", "operator": "greater_than", "value": "10"}]'::jsonb, 
 (SELECT id FROM public.rates WHERE name = 'Nordic Express Premium')),
('Heavy Cargo Discount', 'Discounted rates for heavy shipments over 50kg', 3, 
 '[{"field": "weight", "operator": "greater_than", "value": "50"}, {"field": "mail_category", "operator": "equals", "value": "B"}]'::jsonb, 
 (SELECT id FROM public.rates WHERE name = 'Heavy Cargo Discount'));

-- Success message
SELECT 'Complete Cargo Management System database setup completed successfully!' as message;
