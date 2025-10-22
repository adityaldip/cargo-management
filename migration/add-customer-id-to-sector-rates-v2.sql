-- Migration: Add customer_id column to sector_rates_v2 table
-- This migration adds a foreign key relationship to the customers table

-- Add customer_id column
ALTER TABLE public.sector_rates_v2 
ADD COLUMN customer_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE public.sector_rates_v2 
ADD CONSTRAINT fk_sector_rates_v2_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_customer_id ON public.sector_rates_v2 USING btree (customer_id) TABLESPACE pg_default;

-- Update comment
COMMENT ON COLUMN public.sector_rates_v2.customer_id IS 'Foreign key reference to customers table';

-- Success message
SELECT 'customer_id column added to sector_rates_v2 table successfully!' as message;
