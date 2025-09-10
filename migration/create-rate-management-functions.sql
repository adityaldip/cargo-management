-- Rate Management Functions for the new separate tables structure

-- Function to create a new rate
CREATE OR REPLACE FUNCTION create_rate(
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_rate_type VARCHAR(50) DEFAULT 'fixed',
    p_base_rate DECIMAL(10,2) DEFAULT 0,
    p_currency VARCHAR(3) DEFAULT 'EUR',
    p_multiplier DECIMAL(5,2) DEFAULT 1.0,
    p_tags TEXT[] DEFAULT '{}',
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    description TEXT,
    rate_type VARCHAR(50),
    base_rate DECIMAL(10,2),
    currency VARCHAR(3),
    multiplier DECIMAL(5,2),
    tags TEXT[],
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO rates (
        name, description, rate_type, base_rate, currency, 
        multiplier, tags, is_active, created_at, updated_at
    )
    VALUES (
        p_name, p_description, p_rate_type, p_base_rate, p_currency,
        p_multiplier, p_tags, p_is_active, NOW(), NOW()
    )
    RETURNING 
        rates.id, rates.name, rates.description, rates.rate_type,
        rates.base_rate, rates.currency, rates.multiplier, rates.tags,
        rates.is_active, rates.created_at, rates.updated_at;
END;
$$;

-- Function to update a rate
CREATE OR REPLACE FUNCTION update_rate(
    p_id UUID,
    p_name VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_rate_type VARCHAR(50) DEFAULT NULL,
    p_base_rate DECIMAL(10,2) DEFAULT NULL,
    p_currency VARCHAR(3) DEFAULT NULL,
    p_multiplier DECIMAL(5,2) DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    description TEXT,
    rate_type VARCHAR(50),
    base_rate DECIMAL(10,2),
    currency VARCHAR(3),
    multiplier DECIMAL(5,2),
    tags TEXT[],
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE rates SET
        name = COALESCE(p_name, rates.name),
        description = COALESCE(p_description, rates.description),
        rate_type = COALESCE(p_rate_type, rates.rate_type),
        base_rate = COALESCE(p_base_rate, rates.base_rate),
        currency = COALESCE(p_currency, rates.currency),
        multiplier = COALESCE(p_multiplier, rates.multiplier),
        tags = COALESCE(p_tags, rates.tags),
        is_active = COALESCE(p_is_active, rates.is_active),
        updated_at = NOW()
    WHERE rates.id = p_id
    RETURNING 
        rates.id, rates.name, rates.description, rates.rate_type,
        rates.base_rate, rates.currency, rates.multiplier, rates.tags,
        rates.is_active, rates.created_at, rates.updated_at;
END;
$$;

-- Function to create a rate rule with rate reference
CREATE OR REPLACE FUNCTION create_rate_rule(
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_priority INTEGER,
    p_conditions JSONB DEFAULT '[]',
    p_rate_id UUID,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN,
    priority INTEGER,
    conditions JSONB,
    rate_id UUID,
    match_count INTEGER,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rate_name VARCHAR(255),
    rate_type VARCHAR(50),
    base_rate DECIMAL(10,2),
    currency VARCHAR(3),
    multiplier DECIMAL(5,2),
    rate_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_rule_id UUID;
BEGIN
    -- Insert the rate rule
    INSERT INTO rate_rules (
        name, description, priority, conditions, rate_id, 
        is_active, match_count, created_at, updated_at
    )
    VALUES (
        p_name, p_description, p_priority, p_conditions, p_rate_id,
        p_is_active, 0, NOW(), NOW()
    )
    RETURNING rate_rules.id INTO new_rule_id;
    
    -- Return the rule with joined rate information
    RETURN QUERY
    SELECT 
        rr.id, rr.name, rr.description, rr.is_active, rr.priority,
        rr.conditions, rr.rate_id, rr.match_count, rr.last_run,
        rr.created_at, rr.updated_at,
        r.name as rate_name, r.rate_type, r.base_rate, r.currency,
        r.multiplier, r.tags as rate_tags
    FROM rate_rules rr
    JOIN rates r ON rr.rate_id = r.id
    WHERE rr.id = new_rule_id;
END;
$$;

-- Function to get all rate rules with rate information
CREATE OR REPLACE FUNCTION get_rate_rules_with_rates()
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN,
    priority INTEGER,
    conditions JSONB,
    rate_id UUID,
    match_count INTEGER,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rate_name VARCHAR(255),
    rate_type VARCHAR(50),
    base_rate DECIMAL(10,2),
    currency VARCHAR(3),
    multiplier DECIMAL(5,2),
    rate_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rr.id, rr.name, rr.description, rr.is_active, rr.priority,
        rr.conditions, rr.rate_id, rr.match_count, rr.last_run,
        rr.created_at, rr.updated_at,
        r.name as rate_name, r.rate_type, r.base_rate, r.currency,
        r.multiplier, r.tags as rate_tags
    FROM rate_rules rr
    JOIN rates r ON rr.rate_id = r.id
    ORDER BY rr.priority ASC;
END;
$$;

-- Function to delete a rate (with cascade check)
CREATE OR REPLACE FUNCTION delete_rate(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_count INTEGER;
BEGIN
    -- Check if any rate rules are using this rate
    SELECT COUNT(*) INTO rule_count
    FROM rate_rules
    WHERE rate_id = p_id;
    
    IF rule_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete rate: % rate rules are still using this rate', rule_count;
    END IF;
    
    -- Delete the rate
    DELETE FROM rates WHERE id = p_id;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_rate TO authenticated;
GRANT EXECUTE ON FUNCTION create_rate TO service_role;
GRANT EXECUTE ON FUNCTION update_rate TO authenticated;
GRANT EXECUTE ON FUNCTION update_rate TO service_role;
GRANT EXECUTE ON FUNCTION create_rate_rule TO authenticated;
GRANT EXECUTE ON FUNCTION create_rate_rule TO service_role;
GRANT EXECUTE ON FUNCTION get_rate_rules_with_rates TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_rules_with_rates TO service_role;
GRANT EXECUTE ON FUNCTION delete_rate TO authenticated;
GRANT EXECUTE ON FUNCTION delete_rate TO service_role;
