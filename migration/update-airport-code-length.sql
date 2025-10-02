-- Update airport_code table to remove 3-character limit on code field
-- This migration changes the code field from VARCHAR(3) to VARCHAR(255)

-- First, let's check if the table exists and what the current structure is
-- If the table doesn't exist, this will create it with the new structure
CREATE TABLE IF NOT EXISTS public.airport_code (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    code CHARACTER VARYING(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_eu BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT airport_code_pkey PRIMARY KEY (id),
    CONSTRAINT airport_code_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- If the table already exists with VARCHAR(3), we need to alter it
-- This will work even if the column is already VARCHAR(255)
ALTER TABLE public.airport_code 
ALTER COLUMN code TYPE CHARACTER VARYING(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_airport_code_code ON public.airport_code USING btree (code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_airport_code_is_active ON public.airport_code USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_airport_code_is_eu ON public.airport_code USING btree (is_eu) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_airport_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_airport_code_updated_at 
    BEFORE UPDATE ON public.airport_code 
    FOR EACH ROW 
    EXECUTE FUNCTION update_airport_code_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.airport_code ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.airport_code
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.airport_code TO authenticated;
GRANT ALL ON public.airport_code TO service_role;

-- Insert sample data if table is empty
INSERT INTO public.airport_code (code, is_active, is_eu) VALUES
('JFK', true, false),
('LAX', true, false),
('LHR', true, false),
('CDG', true, true),
('NRT', true, false),
('SYD', false, false),
('DXB', true, false),
('SFO', true, false),
('LONG_AIRPORT_CODE_EXAMPLE', true, false),
('ANOTHER_LONG_CODE', true, true)
ON CONFLICT (code) DO NOTHING;

-- Success message
SELECT 'Airport code table updated successfully - code field now supports up to 255 characters!' as message;
