-- Add actions column to rate_rules table for consistency with customer_rules
-- This allows storing additional action metadata alongside the rate_id reference

ALTER TABLE rate_rules 
ADD COLUMN actions JSONB NOT NULL DEFAULT '{}';

-- Update existing rate_rules to have proper actions structure
UPDATE rate_rules 
SET actions = jsonb_build_object('assignRate', rate_id)
WHERE rate_id IS NOT NULL;

-- Create index for actions column for better performance
CREATE INDEX idx_rate_rules_actions ON rate_rules USING GIN (actions);

-- Grant permissions
GRANT ALL ON rate_rules TO authenticated;
GRANT ALL ON rate_rules TO service_role;
