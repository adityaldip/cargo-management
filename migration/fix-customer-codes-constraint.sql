-- Fix customer_codes constraint to allow multiple products per customer code
-- The current constraint prevents multiple products from using the same customer code

-- Drop the existing unique constraint
ALTER TABLE public.customer_codes 
DROP CONSTRAINT IF EXISTS customer_codes_customer_id_code_key;

-- Create a new unique constraint that allows multiple products per customer code
-- but prevents duplicate products for the same customer
ALTER TABLE public.customer_codes 
ADD CONSTRAINT customer_codes_customer_id_product_key 
UNIQUE (customer_id, product);

-- Add an index for better performance on customer_id and code lookups
CREATE INDEX IF NOT EXISTS idx_customer_codes_customer_id_code 
ON public.customer_codes USING btree (customer_id, code);
