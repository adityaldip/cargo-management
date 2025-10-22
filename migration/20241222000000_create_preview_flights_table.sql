-- Migration to create preview_flights table
-- This table stores flight data for preview functionality

CREATE TABLE public.preview_flights (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    origin CHARACTER VARYING(50) NOT NULL,
    destination CHARACTER VARYING(50) NOT NULL,
    inbound CHARACTER VARYING(50) NULL,
    outbound CHARACTER VARYING(50) NULL,
    sector_rate_id UUID NULL REFERENCES public.sector_rates_v2(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT preview_flights_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add comments for table and columns
COMMENT ON TABLE public.preview_flights IS 'Table to store flight data for preview functionality';
COMMENT ON COLUMN public.preview_flights.origin IS 'Origin airport code';
COMMENT ON COLUMN public.preview_flights.destination IS 'Destination airport code';
COMMENT ON COLUMN public.preview_flights.inbound IS 'Inbound flight information';
COMMENT ON COLUMN public.preview_flights.outbound IS 'Outbound flight information';
COMMENT ON COLUMN public.preview_flights.sector_rate_id IS 'Foreign key reference to sector_rates_v2 table';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_flights_origin ON public.preview_flights USING btree (origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_destination ON public.preview_flights USING btree (destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_sector_rate_id ON public.preview_flights USING btree (sector_rate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_flights_created_at ON public.preview_flights USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_preview_flights_updated_at 
    BEFORE UPDATE ON public.preview_flights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.preview_flights ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.preview_flights
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.preview_flights TO authenticated;
GRANT ALL ON public.preview_flights TO service_role;

-- Insert sample data
INSERT INTO public.preview_flights (origin, destination, inbound, outbound) VALUES
('USFRAT', 'USRIXT', 'BT234', ''),
('USFRAT', 'USROMT', 'BT234', 'BT633'),
('LTVNOA', 'CLSCLE', 'BT965', 'BT965'),
('FRA', 'RIX', 'BT234', 'BT633'),
('AMS', 'IST', 'BT421', 'BT651');

-- Success message
SELECT 'Preview flights table created successfully!' as message;
