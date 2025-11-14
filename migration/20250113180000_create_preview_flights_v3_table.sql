-- Migration to create preview_flights_v3 table for Price Assignment 3.0
-- This table stores flight data for preview functionality

CREATE TABLE IF NOT EXISTS public.preview_flights_v3 (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    origin CHARACTER VARYING(50) NOT NULL,
    destination CHARACTER VARYING(50) NOT NULL,
    inbound CHARACTER VARYING(50) NULL,
    outbound CHARACTER VARYING(50) NULL,
    sector_rate_id UUID NULL REFERENCES public.sector_rates_v3(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT preview_flights_v3_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add comments for table and columns
COMMENT ON TABLE public.preview_flights_v3 IS 'Table to store flight data for preview functionality V3';
COMMENT ON COLUMN public.preview_flights_v3.origin IS 'Origin airport code';
COMMENT ON COLUMN public.preview_flights_v3.destination IS 'Destination airport code';
COMMENT ON COLUMN public.preview_flights_v3.inbound IS 'Inbound flight information';
COMMENT ON COLUMN public.preview_flights_v3.outbound IS 'Outbound flight information';
COMMENT ON COLUMN public.preview_flights_v3.sector_rate_id IS 'Foreign key reference to sector_rates_v3 table';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_origin ON public.preview_flights_v3 USING btree (origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_destination ON public.preview_flights_v3 USING btree (destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_sector_rate_id ON public.preview_flights_v3 USING btree (sector_rate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_v3_created_at ON public.preview_flights_v3 USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_preview_flights_v3_updated_at 
    BEFORE UPDATE ON public.preview_flights_v3 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.preview_flights_v3 ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for authenticated users)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.preview_flights_v3;
CREATE POLICY "Allow all operations for authenticated users" ON public.preview_flights_v3
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.preview_flights_v3 TO authenticated;
GRANT ALL ON public.preview_flights_v3 TO service_role;

-- Insert sample data
INSERT INTO public.preview_flights_v3 (origin, destination, inbound, outbound) VALUES
('USFRAT', 'USRIXT', 'BT234', ''),
('USFRAT', 'USROMT', 'BT234', 'BT633'),
('LTVNOA', 'CLSCLE', 'BT965', 'BT965'),
('FRA', 'RIX', 'BT234', 'BT633'),
('AMS', 'IST', 'BT421', 'BT651');

-- Success message
SELECT 'Preview flights V3 table created successfully!' as message;

