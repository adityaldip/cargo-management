-- Create sector_rates table
CREATE TABLE IF NOT EXISTS sector_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    origin_airport_id UUID NOT NULL REFERENCES airport_code(id) ON DELETE CASCADE,
    destination_airport_id UUID NOT NULL REFERENCES airport_code(id) ON DELETE CASCADE,
    sector_rate DECIMAL(10,2) NOT NULL CHECK (sector_rate > 0),
    flight_num_preview VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure origin and destination are different
    CONSTRAINT check_different_airports CHECK (origin_airport_id != destination_airport_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sector_rates_origin ON sector_rates(origin);
CREATE INDEX IF NOT EXISTS idx_sector_rates_destination ON sector_rates(destination);
CREATE INDEX IF NOT EXISTS idx_sector_rates_origin_airport_id ON sector_rates(origin_airport_id);
CREATE INDEX IF NOT EXISTS idx_sector_rates_destination_airport_id ON sector_rates(destination_airport_id);
CREATE INDEX IF NOT EXISTS idx_sector_rates_is_active ON sector_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_sector_rates_route ON sector_rates(origin, destination);

-- Create a unique constraint to prevent duplicate routes
CREATE UNIQUE INDEX IF NOT EXISTS idx_sector_rates_unique_route 
ON sector_rates(origin_airport_id, destination_airport_id) 
WHERE is_active = true;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_sector_rates_updated_at ON sector_rates;
CREATE TRIGGER trigger_update_sector_rates_updated_at
    BEFORE UPDATE ON sector_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sector_rates IS 'Stores sector rates for different airport routes';
COMMENT ON COLUMN sector_rates.origin IS 'Origin airport code (e.g., JFK, LAX)';
COMMENT ON COLUMN sector_rates.destination IS 'Destination airport code (e.g., LAX, SFO)';
COMMENT ON COLUMN sector_rates.origin_airport_id IS 'Foreign key reference to airport_code table for origin';
COMMENT ON COLUMN sector_rates.destination_airport_id IS 'Foreign key reference to airport_code table for destination';
COMMENT ON COLUMN sector_rates.sector_rate IS 'Rate for this sector route in USD';
COMMENT ON COLUMN sector_rates.flight_num_preview IS 'Preview of flight number format (e.g., AA123, BA456)';
COMMENT ON COLUMN sector_rates.is_active IS 'Whether this sector rate is currently active';
