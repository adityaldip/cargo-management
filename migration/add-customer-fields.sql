-- Add new columns to customer_codes table
ALTER TABLE public.customer_codes 
ADD COLUMN IF NOT EXISTS product character varying(255) null;

-- Add new address fields to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS city character varying(100) null,
ADD COLUMN IF NOT EXISTS state character varying(100) null,
ADD COLUMN IF NOT EXISTS postal_code character varying(20) null,
ADD COLUMN IF NOT EXISTS country character varying(100) null;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_codes_product ON public.customer_codes USING btree (product);
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers USING btree (city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON public.customers USING btree (state);
CREATE INDEX IF NOT EXISTS idx_customers_country ON public.customers USING btree (country);
