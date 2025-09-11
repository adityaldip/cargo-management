-- Simple ALTER TABLE to change assigned_customer from varchar to uuid
-- This assumes your assigned_customer values are already valid UUIDs as strings

-- Step 1: Check current data first (optional)
SELECT 
    assigned_customer,
    COUNT(*) as count
FROM cargo_data 
WHERE assigned_customer IS NOT NULL 
  AND assigned_customer != ''
GROUP BY assigned_customer
LIMIT 10;

-- Step 2: Simple ALTER TABLE command
ALTER TABLE cargo_data 
ALTER COLUMN assigned_customer TYPE uuid 
USING assigned_customer::uuid;

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cargo_data' 
  AND column_name = 'assigned_customer';
