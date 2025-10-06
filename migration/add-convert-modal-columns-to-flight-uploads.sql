-- Add columns for ConvertModal data to flight_uploads table
-- This migration adds the necessary columns to store ConvertModal form data

-- Add new columns to flight_uploads table
ALTER TABLE public.flight_uploads 
ADD COLUMN IF NOT EXISTS converted_origin CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS converted_destination CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS before_bt_from CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS before_bt_to CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS after_bt_from CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS after_bt_to CHARACTER VARYING(10) NULL,
ADD COLUMN IF NOT EXISTS applied_rate TEXT NULL,
ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.flight_uploads.converted_origin IS 'Converted origin airport code from ConvertModal';
COMMENT ON COLUMN public.flight_uploads.converted_destination IS 'Converted destination airport code from ConvertModal';
COMMENT ON COLUMN public.flight_uploads.before_bt_from IS 'Before BT origin airport code';
COMMENT ON COLUMN public.flight_uploads.before_bt_to IS 'Before BT destination airport code';
COMMENT ON COLUMN public.flight_uploads.after_bt_from IS 'After BT origin airport code';
COMMENT ON COLUMN public.flight_uploads.after_bt_to IS 'After BT destination airport code';
COMMENT ON COLUMN public.flight_uploads.applied_rate IS 'Applied rate information from sector rates';
COMMENT ON COLUMN public.flight_uploads.is_converted IS 'Whether this record has been converted using ConvertModal';

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_flight_uploads_converted_origin ON public.flight_uploads USING btree (converted_origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_converted_destination ON public.flight_uploads USING btree (converted_destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_before_bt_from ON public.flight_uploads USING btree (before_bt_from) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_before_bt_to ON public.flight_uploads USING btree (before_bt_to) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_after_bt_from ON public.flight_uploads USING btree (after_bt_from) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_after_bt_to ON public.flight_uploads USING btree (after_bt_to) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_is_converted ON public.flight_uploads USING btree (is_converted) TABLESPACE pg_default;

-- Add check constraints to ensure data integrity (only if they don't exist)
DO $$
BEGIN
    -- Add converted origin/destination constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_converted_origin_destination_different' 
        AND conrelid = 'public.flight_uploads'::regclass
    ) THEN
        ALTER TABLE public.flight_uploads 
        ADD CONSTRAINT check_converted_origin_destination_different 
        CHECK (converted_origin IS NULL OR converted_destination IS NULL OR converted_origin != converted_destination);
    END IF;

    -- Add before BT constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_before_bt_different' 
        AND conrelid = 'public.flight_uploads'::regclass
    ) THEN
        ALTER TABLE public.flight_uploads 
        ADD CONSTRAINT check_before_bt_different 
        CHECK (before_bt_from IS NULL OR before_bt_to IS NULL OR before_bt_from != before_bt_to);
    END IF;

    -- Add after BT constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_after_bt_different' 
        AND conrelid = 'public.flight_uploads'::regclass
    ) THEN
        ALTER TABLE public.flight_uploads 
        ADD CONSTRAINT check_after_bt_different 
        CHECK (after_bt_from IS NULL OR after_bt_to IS NULL OR after_bt_from != after_bt_to);
    END IF;
END $$;

-- Update the updated_at trigger to handle the new columns
-- (The existing trigger should already handle this, but we'll ensure it's working)
DROP TRIGGER IF EXISTS update_flight_uploads_updated_at ON public.flight_uploads;
CREATE TRIGGER update_flight_uploads_updated_at 
    BEFORE UPDATE ON public.flight_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
