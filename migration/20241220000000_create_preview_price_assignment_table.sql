-- Migration: Create preview_price_assignment table
-- Created: 2024-12-20

CREATE TABLE IF NOT EXISTS preview_price_assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_rate_id UUID REFERENCES sector_rates_v2(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_price_assignment_sector_rate_id ON preview_price_assignment(sector_rate_id);
CREATE INDEX IF NOT EXISTS idx_preview_price_assignment_created_at ON preview_price_assignment(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_preview_price_assignment_updated_at 
    BEFORE UPDATE ON preview_price_assignment 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE preview_price_assignment IS 'Table to store preview data for price assignment with sector rates';
COMMENT ON COLUMN preview_price_assignment.sector_rate_id IS 'Reference to selected sector rate';
