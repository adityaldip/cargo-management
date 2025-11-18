-- Add ULD allocation column to load_plan_items table
-- This column stores ULD information like "XX 02PMC XX", "XX 01AKE XX", "XX BULK XX", etc.

ALTER TABLE public.load_plan_items 
ADD COLUMN IF NOT EXISTS uld_allocation CHARACTER VARYING(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_load_plan_items_uld_allocation 
ON public.load_plan_items USING btree (uld_allocation) 
TABLESPACE pg_default;

-- Success message
SELECT 'ULD allocation column added to load_plan_items table successfully!' as message;

