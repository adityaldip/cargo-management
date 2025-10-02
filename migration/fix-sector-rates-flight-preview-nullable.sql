-- Fix sector_rates table to make flight_num_preview nullable
-- This migration fixes the NOT NULL constraint issue

-- Alter the column to allow NULL values
ALTER TABLE public.sector_rates 
ALTER COLUMN flight_num_preview DROP NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN public.sector_rates.flight_num_preview IS 'Flight number preview - can be NULL if no flights exist for the route';
