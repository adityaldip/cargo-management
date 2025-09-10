-- Add assigned_at column to cargo_data table
-- Run this script in your Supabase SQL Editor

ALTER TABLE cargo_data 
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when querying by assignment date
CREATE INDEX idx_cargo_data_assigned_at ON cargo_data(assigned_at);

-- Add comment to document the column purpose
COMMENT ON COLUMN cargo_data.assigned_at IS 'Timestamp when the customer was assigned to this cargo record';
