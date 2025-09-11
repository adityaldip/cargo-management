-- Change assigned_rate column to store rate_id (UUID) instead of calculated value
-- Add rate_value column to store the calculated rate amount
-- Run this script in your Supabase SQL Editor

-- First, add the new columns
ALTER TABLE cargo_data 
ADD COLUMN rate_id UUID REFERENCES rates(id) ON DELETE SET NULL,
ADD COLUMN rate_value NUMERIC(10,2);

-- Add indexes for better performance
CREATE INDEX idx_cargo_data_rate_id ON cargo_data(rate_id);
CREATE INDEX idx_cargo_data_rate_value ON cargo_data(rate_value);

-- Add comments to document the column purposes
COMMENT ON COLUMN cargo_data.rate_id IS 'ID of the rate that was assigned to this cargo record';
COMMENT ON COLUMN cargo_data.rate_value IS 'Calculated rate value for this cargo record';
COMMENT ON COLUMN cargo_data.assigned_rate IS 'DEPRECATED: Use rate_id and rate_value instead';

-- Note: You may want to migrate existing data from assigned_rate to rate_value
-- and set rate_id to NULL for existing records, or update them based on your business logic
