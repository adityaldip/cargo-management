-- Migration: Update sector_rates_v2 to use array columns for airbaltic_origin and airbaltic_destination
-- This migration changes the column types from VARCHAR to TEXT[] to support multiple selections

-- First, let's backup existing data by creating a temporary table
CREATE TEMP TABLE sector_rates_v2_backup AS 
SELECT * FROM public.sector_rates_v2;

-- Add new array columns
ALTER TABLE public.sector_rates_v2 
ADD COLUMN airbaltic_origin_array TEXT[],
ADD COLUMN airbaltic_destination_array TEXT[];

-- Migrate existing data from string to array
-- Convert comma-separated strings to arrays, handle "ALL" case
UPDATE public.sector_rates_v2 
SET 
  airbaltic_origin_array = CASE 
    WHEN airbaltic_origin = 'ALL' THEN ARRAY['ALL']
    WHEN airbaltic_origin IS NULL OR airbaltic_origin = '' THEN ARRAY[]::TEXT[]
    ELSE string_to_array(airbaltic_origin, ', ')
  END,
  airbaltic_destination_array = CASE 
    WHEN airbaltic_destination = 'ALL' THEN ARRAY['ALL']
    WHEN airbaltic_destination IS NULL OR airbaltic_destination = '' THEN ARRAY[]::TEXT[]
    ELSE string_to_array(airbaltic_destination, ', ')
  END;

-- Drop old columns
ALTER TABLE public.sector_rates_v2 
DROP COLUMN airbaltic_origin,
DROP COLUMN airbaltic_destination;

-- Rename new columns to original names
ALTER TABLE public.sector_rates_v2 
RENAME COLUMN airbaltic_origin_array TO airbaltic_origin;

ALTER TABLE public.sector_rates_v2 
RENAME COLUMN airbaltic_destination_array TO airbaltic_destination;

-- Update indexes for array columns
DROP INDEX IF EXISTS idx_sector_rates_v2_airbaltic_origin;
DROP INDEX IF EXISTS idx_sector_rates_v2_airbaltic_destination;

-- Create GIN indexes for array columns (better for array operations)
CREATE INDEX idx_sector_rates_v2_airbaltic_origin ON public.sector_rates_v2 USING GIN (airbaltic_origin);
CREATE INDEX idx_sector_rates_v2_airbaltic_destination ON public.sector_rates_v2 USING GIN (airbaltic_destination);

-- Add comments for array columns
COMMENT ON COLUMN public.sector_rates_v2.airbaltic_origin IS 'AirBaltic origin airport codes as array (e.g., ["AMS", "FRA"] or ["ALL"])';
COMMENT ON COLUMN public.sector_rates_v2.airbaltic_destination IS 'AirBaltic destination airport codes as array (e.g., ["IST", "RIX"] or ["ALL"])';

-- Update sample data to use arrays
UPDATE public.sector_rates_v2 
SET 
  airbaltic_origin = ARRAY['AMS'],
  airbaltic_destination = ARRAY['IST']
WHERE text_label = 'NL Post (AMS → IST)';

UPDATE public.sector_rates_v2 
SET 
  airbaltic_origin = ARRAY['AMS'],
  airbaltic_destination = ARRAY['IST']
WHERE text_label = 'NL Post (AMS → IST)' AND id != (SELECT id FROM public.sector_rates_v2 WHERE text_label = 'NL Post (AMS → IST)' LIMIT 1);

UPDATE public.sector_rates_v2 
SET 
  airbaltic_origin = ARRAY['AMS'],
  airbaltic_destination = ARRAY['IST']
WHERE text_label = 'NL Post (AMS → IST) → APAC';

UPDATE public.sector_rates_v2 
SET 
  airbaltic_origin = ARRAY['FRA'],
  airbaltic_destination = ARRAY['RIX']
WHERE text_label = 'DHL (FRA → RIX)';

-- Success message
SELECT 'SectorRatesV2 array columns updated successfully!' as message;
