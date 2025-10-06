-- Add sector_rate_id column to flight_uploads table
-- This migration adds a foreign key reference to sector_rates table

-- Add new column to flight_uploads table
ALTER TABLE public.flight_uploads 
ADD COLUMN IF NOT EXISTS sector_rate_id UUID NULL REFERENCES public.sector_rates(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.flight_uploads.sector_rate_id IS 'Foreign key reference to sector_rates table for applied rate';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_flight_uploads_sector_rate_id ON public.flight_uploads USING btree (sector_rate_id) TABLESPACE pg_default;

-- Update existing applied_rate data to use sector_rate_id where possible
-- This is a data migration to convert existing applied_rate text to sector_rate_id
-- Note: This will only work if the applied_rate text matches the format in sector_rates
UPDATE public.flight_uploads 
SET sector_rate_id = sr.id
FROM public.sector_rates sr
WHERE flight_uploads.applied_rate IS NOT NULL 
  AND flight_uploads.applied_rate LIKE '%' || sr.origin || '%' 
  AND flight_uploads.applied_rate LIKE '%' || sr.destination || '%'
  AND sr.is_active = true;
