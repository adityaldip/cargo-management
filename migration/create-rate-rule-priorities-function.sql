-- Create function for atomic rate rule priority updates
-- This ensures all priority updates happen in a single transaction

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_rate_rule_priorities(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_rate_rule_priorities(JSONB) TO service_role;
