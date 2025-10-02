-- Update flights table to use foreign keys to airport_code table
-- This migration adds foreign key relationships for origin and destination

-- First, add new columns for the foreign keys
ALTER TABLE public.flights 
ADD COLUMN origin_airport_id UUID REFERENCES public.airport_code(id) ON DELETE RESTRICT,
ADD COLUMN destination_airport_id UUID REFERENCES public.airport_code(id) ON DELETE RESTRICT;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_flights_origin_airport_id ON public.flights USING btree (origin_airport_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flights_destination_airport_id ON public.flights USING btree (destination_airport_id) TABLESPACE pg_default;

-- Update existing flights to populate the new foreign key columns
-- This assumes existing flights have origin/destination as airport codes
UPDATE public.flights 
SET origin_airport_id = (
    SELECT id FROM public.airport_code 
    WHERE airport_code.code = flights.origin 
    LIMIT 1
)
WHERE origin_airport_id IS NULL;

UPDATE public.flights 
SET destination_airport_id = (
    SELECT id FROM public.airport_code 
    WHERE airport_code.code = flights.destination 
    LIMIT 1
)
WHERE destination_airport_id IS NULL;

-- Add constraints to ensure the foreign keys are not null
ALTER TABLE public.flights 
ALTER COLUMN origin_airport_id SET NOT NULL,
ALTER COLUMN destination_airport_id SET NOT NULL;

-- Add check constraint to prevent origin and destination from being the same
ALTER TABLE public.flights 
ADD CONSTRAINT flights_origin_destination_different 
CHECK (origin_airport_id != destination_airport_id);

-- Create a view for easier querying with airport code details
CREATE OR REPLACE VIEW public.flights_with_airports AS
SELECT 
    f.id,
    f.flight_number,
    f.origin_airport_id,
    f.destination_airport_id,
    f.status,
    f.is_active,
    f.created_at,
    f.updated_at,
    origin.code as origin_code,
    origin.is_eu as origin_is_eu,
    destination.code as destination_code,
    destination.is_eu as destination_is_eu
FROM public.flights f
LEFT JOIN public.airport_code origin ON f.origin_airport_id = origin.id
LEFT JOIN public.airport_code destination ON f.destination_airport_id = destination.id;

-- Grant permissions on the view
GRANT ALL ON public.flights_with_airports TO authenticated;
GRANT ALL ON public.flights_with_airports TO service_role;

-- Add RLS policy for the view
ALTER TABLE public.flights_with_airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.flights_with_airports
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Note: The original origin and destination columns are kept for backward compatibility
-- You may want to remove them in a future migration after updating all code references
