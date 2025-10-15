-- Add customer column to flight_uploads table
-- This migration adds a customer field to track customer information for each flight upload

-- Add customer column to flight_uploads table
ALTER TABLE public.flight_uploads 
ADD COLUMN customer CHARACTER VARYING(255) NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.flight_uploads.customer IS 'Customer information for the flight upload';

-- Create index for better performance on customer column
CREATE INDEX IF NOT EXISTS idx_flight_uploads_customer ON public.flight_uploads USING btree (customer) TABLESPACE pg_default;

-- Success message
SELECT 'Customer column added to flight_uploads table successfully!' as message;
