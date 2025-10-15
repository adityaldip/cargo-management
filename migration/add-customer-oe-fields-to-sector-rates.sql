-- Add customer, origin_oe, and destination_oe fields to sector_rates table
-- This migration adds the new fields to support customer-specific sector rates and OE information

-- Add the new columns to sector_rates table
ALTER TABLE public.sector_rates 
ADD COLUMN customer CHARACTER VARYING(255) NULL,
ADD COLUMN origin_oe CHARACTER VARYING(10) NULL,
ADD COLUMN destination_oe CHARACTER VARYING(10) NULL;

-- Add comments for the new columns
COMMENT ON COLUMN public.sector_rates.customer IS 'Customer name for customer-specific sector rates';
COMMENT ON COLUMN public.sector_rates.origin_oe IS 'Origin OE (Operating Entity) code';
COMMENT ON COLUMN public.sector_rates.destination_oe IS 'Destination OE (Operating Entity) code';

-- Create indexes for better performance on the new fields
CREATE INDEX IF NOT EXISTS idx_sector_rates_customer ON public.sector_rates USING btree (customer) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_origin_oe ON public.sector_rates USING btree (origin_oe) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_destination_oe ON public.sector_rates USING btree (destination_oe) TABLESPACE pg_default;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sector_rates_customer_origin_destination ON public.sector_rates USING btree (customer, origin, destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_origin_oe_destination_oe ON public.sector_rates USING btree (origin_oe, destination_oe) TABLESPACE pg_default;

-- Success message
SELECT 'Successfully added customer, origin_oe, and destination_oe fields to sector_rates table!' as message;
