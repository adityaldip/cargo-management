-- Add selected_sector_rate_ids column to flight_uploads table
-- This migration adds support for multi-select sector rates functionality

-- Add the new column
ALTER TABLE public.flight_uploads 
ADD COLUMN selected_sector_rate_ids UUID[] DEFAULT '{}';

-- Add comment for the new column
COMMENT ON COLUMN public.flight_uploads.selected_sector_rate_ids IS 'Array of selected sector rate IDs for multi-select functionality';

-- Create GIN index for efficient querying of the array
CREATE INDEX IF NOT EXISTS idx_flight_uploads_selected_sector_rate_ids 
ON public.flight_uploads USING gin (selected_sector_rate_ids) 
TABLESPACE pg_default;

-- Update existing records to have empty array instead of NULL
UPDATE public.flight_uploads 
SET selected_sector_rate_ids = '{}' 
WHERE selected_sector_rate_ids IS NULL;

-- Success message
SELECT 'Successfully added selected_sector_rate_ids column to flight_uploads table!' as message;
