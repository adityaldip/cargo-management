-- Migration: Create preview_price_assignment_v3 table for Price Assignment 3.0
-- Created: 2025-01-13

CREATE TABLE IF NOT EXISTS public.preview_price_assignment_v3 (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    sector_rate_id UUID NULL REFERENCES public.sector_rates_v3(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT preview_price_assignment_v3_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_price_assignment_v3_sector_rate_id ON public.preview_price_assignment_v3 USING btree (sector_rate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_preview_price_assignment_v3_created_at ON public.preview_price_assignment_v3 USING btree (created_at) TABLESPACE pg_default;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_preview_price_assignment_v3_updated_at 
    BEFORE UPDATE ON public.preview_price_assignment_v3 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.preview_price_assignment_v3 ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.preview_price_assignment_v3;
CREATE POLICY "Allow all operations for authenticated users" ON public.preview_price_assignment_v3
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.preview_price_assignment_v3 TO authenticated;
GRANT ALL ON public.preview_price_assignment_v3 TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.preview_price_assignment_v3 IS 'Table to store preview data for price assignment with sector rates V3';
COMMENT ON COLUMN public.preview_price_assignment_v3.sector_rate_id IS 'Reference to selected sector rate from sector_rates_v3 table';

-- Success message
SELECT 'preview_price_assignment_v3 table created successfully!' as message;

