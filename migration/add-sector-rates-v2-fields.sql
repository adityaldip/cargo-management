-- Migration: Create new sector_rates_v2 table for SectorRatesV2 component
-- This migration creates a new table specifically for the SectorRatesV2 UI component

-- Create new table for SectorRatesV2
CREATE TABLE public.sector_rates_v2 (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    text_label VARCHAR(255) NULL,
    origin_airport VARCHAR(50) NULL,
    airbaltic_origin TEXT[] NULL,
    sector_rate VARCHAR(20) NULL,
    airbaltic_destination TEXT[] NULL,
    final_destination VARCHAR(255) NULL,
    customer VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sector_rates_v2_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add comments for SectorRatesV2 table columns
COMMENT ON TABLE public.sector_rates_v2 IS 'Sector Rates V2 table for the new UI component';
COMMENT ON COLUMN public.sector_rates_v2.text_label IS 'Manual text label for sector rate (e.g., "NL Post (AMS → IST)")';
COMMENT ON COLUMN public.sector_rates_v2.origin_airport IS 'Origin airport information (e.g., "no previous stop")';
COMMENT ON COLUMN public.sector_rates_v2.airbaltic_origin IS 'AirBaltic origin airport codes as array (e.g., ["AMS", "FRA"] or ["ALL"])';
COMMENT ON COLUMN public.sector_rates_v2.sector_rate IS 'Sector rate as string (e.g., "€2.00")';
COMMENT ON COLUMN public.sector_rates_v2.airbaltic_destination IS 'AirBaltic destination airport codes as array (e.g., ["IST", "RIX"] or ["ALL"])';
COMMENT ON COLUMN public.sector_rates_v2.final_destination IS 'Final destination information (e.g., "no additional" or "SYD, MEL")';
COMMENT ON COLUMN public.sector_rates_v2.customer IS 'Customer name';
COMMENT ON COLUMN public.sector_rates_v2.is_active IS 'Whether the sector rate is active';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_text_label ON public.sector_rates_v2 USING btree (text_label) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_origin_airport ON public.sector_rates_v2 USING btree (origin_airport) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_airbaltic_origin ON public.sector_rates_v2 USING GIN (airbaltic_origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_airbaltic_destination ON public.sector_rates_v2 USING GIN (airbaltic_destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_final_destination ON public.sector_rates_v2 USING btree (final_destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_customer ON public.sector_rates_v2 USING btree (customer) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sector_rates_v2_is_active ON public.sector_rates_v2 USING btree (is_active) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_sector_rates_v2_updated_at 
    BEFORE UPDATE ON public.sector_rates_v2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.sector_rates_v2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations for authenticated users" ON public.sector_rates_v2
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.sector_rates_v2 TO authenticated;
GRANT ALL ON public.sector_rates_v2 TO service_role;

-- Insert sample data for SectorRatesV2
INSERT INTO public.sector_rates_v2 (
    text_label,
    origin_airport,
    airbaltic_origin,
    sector_rate,
    airbaltic_destination,
    final_destination,
    customer,
    is_active
) VALUES
('NL Post (AMS → IST)', 'no previous stop', ARRAY['AMS'], '€2.00', ARRAY['IST'], 'no additional', 'NL Post', false),
('NL Post (AMS → IST)', 'no previous stop', ARRAY['AMS'], '€2.00', ARRAY['IST'], 'no additional', 'NL Post', false),
('NL Post (AMS → IST) → APAC', 'no previous stop', ARRAY['AMS'], '€1.50', ARRAY['IST'], 'SYD, MEL', 'NL Post', false),
('DHL (FRA → RIX)', 'no previous stop', ARRAY['FRA'], '€1.80', ARRAY['RIX'], 'no additional', 'DHL', false);

-- Success message
SELECT 'SectorRatesV2 fields added to sector_rates table successfully!' as message;
