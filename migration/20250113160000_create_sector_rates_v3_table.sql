-- Migration: Create sector_rates_v3 table for Price Assignment 3.0
-- This migration creates a new table specifically for the SectorRatesV3 component

-- Create new table for SectorRatesV3
CREATE TABLE IF NOT EXISTS public.sector_rates_v3 (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    status BOOLEAN NOT NULL DEFAULT true,
    label VARCHAR(255) NULL,
    airbaltic_origin TEXT[] NULL,
    airbaltic_destination TEXT[] NULL,
    sector_rate NUMERIC(10, 2) NULL,
    transit_routes TEXT[] NULL,
    transit_prices NUMERIC(10, 2)[] NULL,
    customer_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sector_rates_v3_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add foreign key constraint to customers table
ALTER TABLE public.sector_rates_v3 
ADD CONSTRAINT fk_sector_rates_v3_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add comments for SectorRatesV3 table columns
COMMENT ON TABLE public.sector_rates_v3 IS 'Sector Rates V3 table for Price Assignment 3.0 component';
COMMENT ON COLUMN public.sector_rates_v3.status IS 'Status of the sector rate (active/inactive)';
COMMENT ON COLUMN public.sector_rates_v3.label IS 'Label for sector rate (e.g., "NL Post (AMS → IST)")';
COMMENT ON COLUMN public.sector_rates_v3.airbaltic_origin IS 'AirBaltic origin airport codes as array (e.g., ["AMS", "FRA"])';
COMMENT ON COLUMN public.sector_rates_v3.airbaltic_destination IS 'AirBaltic destination airport codes as array (e.g., ["IST", "RIX"])';
COMMENT ON COLUMN public.sector_rates_v3.sector_rate IS 'Sector rate as numeric value (e.g., 2.00)';
COMMENT ON COLUMN public.sector_rates_v3.transit_routes IS 'Transit routes as array of airport codes';
COMMENT ON COLUMN public.sector_rates_v3.transit_prices IS 'Transit prices as array of numeric values corresponding to transit_routes';
COMMENT ON COLUMN public.sector_rates_v3.customer_id IS 'Foreign key reference to customers table';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_status ON public.sector_rates_v3 USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_label ON public.sector_rates_v3 USING btree (label) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_airbaltic_origin ON public.sector_rates_v3 USING GIN (airbaltic_origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_airbaltic_destination ON public.sector_rates_v3 USING GIN (airbaltic_destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_transit_routes ON public.sector_rates_v3 USING GIN (transit_routes) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_customer_id ON public.sector_rates_v3 USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_created_at ON public.sector_rates_v3 USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
-- First, ensure the function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_sector_rates_v3_updated_at ON public.sector_rates_v3;
CREATE TRIGGER update_sector_rates_v3_updated_at 
    BEFORE UPDATE ON public.sector_rates_v3 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.sector_rates_v3 ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.sector_rates_v3;
CREATE POLICY "Allow all operations for authenticated users" ON public.sector_rates_v3
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.sector_rates_v3 TO authenticated;
GRANT ALL ON public.sector_rates_v3 TO service_role;

-- Success message
SELECT 'sector_rates_v3 table created successfully!' as message;

