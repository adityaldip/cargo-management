-- Migration to update sector_rates_v2 table to support multiple origin airports and final destinations
-- This migration converts single string values to arrays

-- First, let's check if the columns exist and their current types
DO $$
BEGIN
    -- Check if origin_airport column exists and is not already an array
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sector_rates_v2' 
        AND column_name = 'origin_airport' 
        AND data_type != 'ARRAY'
    ) THEN
        -- Convert existing data to arrays
        UPDATE sector_rates_v2 
        SET origin_airport = CASE 
            WHEN origin_airport IS NULL OR origin_airport = '' THEN NULL
            ELSE ARRAY[origin_airport]
        END;
        
        -- Alter column type to text array
        ALTER TABLE sector_rates_v2 
        ALTER COLUMN origin_airport TYPE text[] USING 
            CASE 
                WHEN origin_airport IS NULL THEN NULL
                ELSE ARRAY[origin_airport::text]
            END;
    END IF;
    
    -- Check if final_destination column exists and is not already an array
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sector_rates_v2' 
        AND column_name = 'final_destination' 
        AND data_type != 'ARRAY'
    ) THEN
        -- Convert existing data to arrays
        UPDATE sector_rates_v2 
        SET final_destination = CASE 
            WHEN final_destination IS NULL OR final_destination = '' THEN NULL
            ELSE ARRAY[final_destination]
        END;
        
        -- Alter column type to text array
        ALTER TABLE sector_rates_v2 
        ALTER COLUMN final_destination TYPE text[] USING 
            CASE 
                WHEN final_destination IS NULL THEN NULL
                ELSE ARRAY[final_destination::text]
            END;
    END IF;
END $$;

-- Add comments to document the changes
COMMENT ON COLUMN sector_rates_v2.origin_airport IS 'Array of origin airport codes';
COMMENT ON COLUMN sector_rates_v2.final_destination IS 'Array of final destination airport codes';
