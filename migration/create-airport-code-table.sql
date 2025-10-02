-- Create airport_code table
CREATE TABLE IF NOT EXISTS airport_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    is_eu BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_airport_code_code ON airport_code(code);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_airport_code_is_active ON airport_code(is_active);

-- Create index on is_eu for filtering
CREATE INDEX IF NOT EXISTS idx_airport_code_is_eu ON airport_code(is_eu);


-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_airport_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_airport_code_updated_at
    BEFORE UPDATE ON airport_code
    FOR EACH ROW
    EXECUTE FUNCTION update_airport_code_updated_at();

-- Insert sample data
INSERT INTO airport_code (code, is_active, is_eu) VALUES
('JFK', true, false),
('LAX', true, false),
('LHR', true, false),
('CDG', true, true),
('NRT', true, false),
('SYD', false, false),
('DXB', true, false),
('SFO', true, false)
ON CONFLICT (code) DO NOTHING;
