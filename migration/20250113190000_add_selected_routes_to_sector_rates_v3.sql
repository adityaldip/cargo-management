-- Migration: Add selected_routes column to sector_rates_v3 table
-- Created: 2025-01-13

-- Add selected_routes column as TEXT array
ALTER TABLE public.sector_rates_v3
ADD COLUMN IF NOT EXISTS selected_routes TEXT[] NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.sector_rates_v3.selected_routes IS 'Array of selected transit route combinations (e.g., ["HKD -> YVR -> YYZ", "HKD -> HND -> YYZ"])';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sector_rates_v3_selected_routes ON public.sector_rates_v3 USING GIN (selected_routes) TABLESPACE pg_default;

-- Success message
SELECT 'selected_routes column added to sector_rates_v3 table successfully!' as message;

