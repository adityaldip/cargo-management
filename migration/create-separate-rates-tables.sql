-- Create separate tables for rates and rate rules
-- This provides better separation of concerns similar to customer rules

-- Create rates table (similar to customers table)
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rate_type VARCHAR(50) NOT NULL DEFAULT 'fixed', -- 'fixed', 'per_kg', 'distance_based', 'zone_based'
    base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    multiplier DECIMAL(5,2) DEFAULT 1.0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate_rules table (similar to customer_rules table)
CREATE TABLE rate_rules_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]',
    rate_id UUID REFERENCES rates(id) ON DELETE CASCADE,
    match_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(priority)
);

-- Migrate existing data from old rate_rules table
INSERT INTO rates (id, name, description, rate_type, base_rate, currency, multiplier, tags, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4() as id,
    name,
    description,
    COALESCE((actions->>'rateType'), 'fixed') as rate_type,
    COALESCE((actions->>'baseRate')::DECIMAL, 0) as base_rate,
    COALESCE((actions->>'currency'), 'EUR') as currency,
    COALESCE((actions->>'multiplier')::DECIMAL, 1.0) as multiplier,
    CASE 
        WHEN actions->'tags' IS NOT NULL AND jsonb_typeof(actions->'tags') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(actions->'tags'))
        ELSE '{}'
    END as tags,
    is_active,
    created_at,
    updated_at
FROM rate_rules
WHERE actions IS NOT NULL;

-- Create new rate_rules with references to rates
INSERT INTO rate_rules_new (id, name, description, is_active, priority, conditions, rate_id, match_count, last_run, created_at, updated_at)
SELECT 
    rr.id,
    rr.name,
    rr.description,
    rr.is_active,
    rr.priority,
    rr.conditions,
    r.id as rate_id,
    rr.match_count,
    rr.last_run,
    rr.created_at,
    rr.updated_at
FROM rate_rules rr
LEFT JOIN rates r ON (
    COALESCE((rr.actions->>'baseRate')::DECIMAL, 0) = r.base_rate AND
    COALESCE((rr.actions->>'currency'), 'EUR') = r.currency AND
    COALESCE((rr.actions->>'rateType'), 'fixed') = r.rate_type
);

-- Drop the old rate_rules table
DROP TABLE rate_rules;

-- Rename the new table to rate_rules
ALTER TABLE rate_rules_new RENAME TO rate_rules;

-- Create indexes for better performance
CREATE INDEX idx_rate_rules_rate_id ON rate_rules(rate_id);
CREATE INDEX idx_rate_rules_priority ON rate_rules(priority);
CREATE INDEX idx_rate_rules_is_active ON rate_rules(is_active);
CREATE INDEX idx_rates_is_active ON rates(is_active);

-- Grant permissions
GRANT ALL ON rates TO authenticated;
GRANT ALL ON rate_rules TO authenticated;
GRANT ALL ON rates TO service_role;
GRANT ALL ON rate_rules TO service_role;

-- Update the rate rule priorities function to work with new structure
CREATE OR REPLACE FUNCTION update_rate_rule_priorities(rule_updates JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_record JSONB;
    rule_id UUID;
    new_priority INTEGER;
BEGIN
    -- Validate input
    IF rule_updates IS NULL OR jsonb_array_length(rule_updates) = 0 THEN
        RAISE EXCEPTION 'No rule updates provided';
    END IF;

    -- Start transaction (implicit in function)
    -- Two-phase update to avoid unique constraint violations
    
    -- Phase 1: Set temporary negative priorities
    FOR update_record IN SELECT * FROM jsonb_array_elements(rule_updates)
    LOOP
        rule_id := (update_record->>'id')::UUID;
        new_priority := (update_record->>'priority')::INTEGER;
        
        -- Validate rule exists
        IF NOT EXISTS (SELECT 1 FROM rate_rules WHERE id = rule_id) THEN
            RAISE EXCEPTION 'Rate rule with id % not found', rule_id;
        END IF;
        
        -- Set temporary negative priority
        UPDATE rate_rules 
        SET 
            priority = -1000 - (SELECT row_number() OVER (ORDER BY (update_record->>'priority')::INTEGER) FROM jsonb_array_elements(rule_updates) WHERE (value->>'id')::UUID = rule_id),
            updated_at = NOW()
        WHERE id = rule_id;
    END LOOP;
    
    -- Phase 2: Set final priorities
    FOR update_record IN SELECT * FROM jsonb_array_elements(rule_updates)
    LOOP
        rule_id := (update_record->>'id')::UUID;
        new_priority := (update_record->>'priority')::INTEGER;
        
        UPDATE rate_rules 
        SET 
            priority = new_priority,
            updated_at = NOW()
        WHERE id = rule_id;
    END LOOP;
    
    -- Commit transaction (implicit)
END;
$$;
