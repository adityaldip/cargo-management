-- Create flights table
-- This migration creates the flights table for the cargo management system

-- Create flights table
CREATE TABLE IF NOT EXISTS public.flights (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    flight_number CHARACTER VARYING(50) NOT NULL,
    origin CHARACTER VARYING(10) NOT NULL,
    destination CHARACTER VARYING(10) NOT NULL,
    status CHARACTER VARYING(20) DEFAULT 'scheduled',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT flights_pkey PRIMARY KEY (id),
    CONSTRAINT flights_flight_number_key UNIQUE (flight_number)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flights_flight_number ON public.flights USING btree (flight_number) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flights_origin ON public.flights USING btree (origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flights_destination ON public.flights USING btree (destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flights_status ON public.flights USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flights_is_active ON public.flights USING btree (is_active) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_flights_updated_at 
    BEFORE UPDATE ON public.flights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.flights
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.flights TO authenticated;
GRANT ALL ON public.flights TO service_role;

-- Insert sample data
INSERT INTO public.flights (flight_number, origin, destination, status, is_active) VALUES
('AA123', 'JFK', 'LAX', 'scheduled', true),
('UA456', 'LAX', 'SFO', 'delayed', true),
('DL789', 'SFO', 'JFK', 'scheduled', false),
('SW234', 'ORD', 'DEN', 'completed', true),
('BA567', 'LHR', 'CDG', 'scheduled', true),
('LH890', 'FRA', 'MAD', 'scheduled', true),
('AF123', 'CDG', 'BCN', 'completed', true),
('KL456', 'AMS', 'FCO', 'scheduled', true),
('IB789', 'MAD', 'LIS', 'scheduled', true),
('TP012', 'LIS', 'OPO', 'scheduled', true)
ON CONFLICT (flight_number) DO NOTHING;

-- Success message
SELECT 'Flights table created successfully with sample data!' as message;
