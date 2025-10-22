-- Migration: Remove SectorRatesV2 fields from sector_rates table
-- This migration removes the fields that were added for SectorRatesV2 component

-- Drop view first (if it exists)
DROP VIEW IF EXISTS public.sector_rates_v2_view;

-- Drop indexes first (if they exist)
DROP INDEX IF EXISTS idx_sector_rates_text_label;
DROP INDEX IF EXISTS idx_sector_rates_origin_airport;
DROP INDEX IF EXISTS idx_sector_rates_airbaltic_origin;
DROP INDEX IF EXISTS idx_sector_rates_airbaltic_destination;
DROP INDEX IF EXISTS idx_sector_rates_final_destination;

-- Remove columns from sector_rates table
ALTER TABLE public.sector_rates 
DROP COLUMN IF EXISTS text_label,
DROP COLUMN IF EXISTS origin_airport,
DROP COLUMN IF EXISTS airbaltic_origin,
DROP COLUMN IF EXISTS airbaltic_destination,
DROP COLUMN IF EXISTS final_destination;

-- Success message
SELECT 'SectorRatesV2 fields removed from sector_rates table successfully!' as message;
