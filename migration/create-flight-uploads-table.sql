-- Create flight_uploads table
-- This table stores uploaded flight data from the UploadTable component

CREATE TABLE public.flight_uploads (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    origin CHARACTER VARYING(50) NOT NULL,
    destination CHARACTER VARYING(50) NOT NULL,
    inbound CHARACTER VARYING(50) NULL,
    outbound CHARACTER VARYING(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT flight_uploads_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flight_uploads_origin ON public.flight_uploads USING btree (origin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_destination ON public.flight_uploads USING btree (destination) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_inbound ON public.flight_uploads USING btree (inbound) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_outbound ON public.flight_uploads USING btree (outbound) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_flight_uploads_created_at ON public.flight_uploads USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_flight_uploads_updated_at 
    BEFORE UPDATE ON public.flight_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.flight_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.flight_uploads
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.flight_uploads TO authenticated;
GRANT ALL ON public.flight_uploads TO service_role;
