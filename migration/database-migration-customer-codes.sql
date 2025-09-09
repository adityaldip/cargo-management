-- Migration to add is_active field to customer_codes table
-- This allows individual customer codes to be activated/deactivated

-- Add is_active column to customer_codes table
ALTER TABLE customer_codes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE customer_codes 
SET is_active = true 
WHERE is_active IS NULL;

-- Add index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_customer_codes_is_active 
ON customer_codes(is_active);

-- Add index for combined customer_id and is_active queries
CREATE INDEX IF NOT EXISTS idx_customer_codes_customer_active 
ON customer_codes(customer_id, is_active);

-- Add comment to document the new field
COMMENT ON COLUMN customer_codes.is_active IS 'Indicates whether this customer code is active and can be used for assignments';
