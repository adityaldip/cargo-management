-- Migration: Add customer_id and transit_route columns to preview_flights_v3 table
-- This migration adds customer assignment and transit route information to flight preview data

-- Add customer_id column
ALTER TABLE public.preview_flights_v3 
ADD COLUMN IF NOT EXISTS customer_id UUID NULL;

-- Add foreign key constraint for customer_id
-- Drop constraint if it exists first
ALTER TABLE public.preview_flights_v3 
DROP CONSTRAINT IF EXISTS fk_preview_flights_v3_customer_id;

ALTER TABLE public.preview_flights_v3 
ADD CONSTRAINT fk_preview_flights_v3_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add transit_route column
ALTER TABLE public.preview_flights_v3 
ADD COLUMN IF NOT EXISTS transit_route CHARACTER VARYING(255) NULL;

-- Create index for customer_id for better performance
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_customer_id 
ON public.preview_flights_v3 USING btree (customer_id) TABLESPACE pg_default;

-- Create index for transit_route for better performance
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_transit_route 
ON public.preview_flights_v3 USING btree (transit_route) TABLESPACE pg_default;

-- Add comments for new columns
COMMENT ON COLUMN public.preview_flights_v3.customer_id IS 'Foreign key reference to customers table for customer assignment';
COMMENT ON COLUMN public.preview_flights_v3.transit_route IS 'Transit route information as string';

-- Success message
SELECT 'customer_id and transit_route columns added to preview_flights_v3 table successfully!' as message;

