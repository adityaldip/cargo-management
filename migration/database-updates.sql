-- Create customer_codes table for multiple customer codes
CREATE TABLE customer_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  accounting_label VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, code)
);

-- Create index for better performance
CREATE INDEX idx_customer_codes_customer_id ON customer_codes(customer_id);
CREATE INDEX idx_customer_codes_code ON customer_codes(code);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_codes_updated_at 
    BEFORE UPDATE ON customer_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing customer codes to the new table
INSERT INTO customer_codes (customer_id, code, accounting_label, is_active)
SELECT 
    id as customer_id,
    code,
    '' as accounting_label,
    is_active
FROM customers;

-- Optional: Remove the old code column from customers table after migration
-- ALTER TABLE customers DROP COLUMN code;
