-- Add customer_code_id column to cargo_data table
-- This column will store the specific customer code ID that was assigned to each cargo record

-- First, ensure customer_codes table has a proper primary key constraint
-- Check if primary key already exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customer_codes_pkey' 
        AND conrelid = 'customer_codes'::regclass
    ) THEN
        ALTER TABLE customer_codes ADD CONSTRAINT customer_codes_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Add the new column to cargo_data
ALTER TABLE cargo_data 
ADD COLUMN customer_code_id UUID;

-- Add index for better performance when querying by customer code
CREATE INDEX IF NOT EXISTS idx_cargo_data_customer_code_id ON cargo_data(customer_code_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN cargo_data.customer_code_id IS 'References the specific customer code that was assigned to this cargo record via automation rules';

-- Add foreign key constraint to ensure data integrity
-- This ensures that if a customer_code_id is provided, it must reference a valid customer code
ALTER TABLE cargo_data 
ADD CONSTRAINT fk_cargo_data_customer_code_id 
FOREIGN KEY (customer_code_id) REFERENCES customer_codes(id) ON DELETE SET NULL;
