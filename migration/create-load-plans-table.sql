-- Create load_plans table
-- This migration creates tables for Emirates Load Plan data management

-- Create load_plans table (header information)
CREATE TABLE IF NOT EXISTS public.load_plans (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    flight_number CHARACTER VARYING(50) NOT NULL,
    flight_date DATE NOT NULL,
    aircraft_type CHARACTER VARYING(20),
    aircraft_registration CHARACTER VARYING(20),
    header_version INTEGER DEFAULT 1,
    route_origin CHARACTER VARYING(10),
    route_destination CHARACTER VARYING(10),
    route_full CHARACTER VARYING(20), -- e.g., "DXB/MXP"
    std_time TIME, -- Scheduled Time of Departure
    prepared_by CHARACTER VARYING(50),
    total_planned_uld CHARACTER VARYING(100), -- e.g., "05PMC/10AKE"
    uld_version CHARACTER VARYING(100), -- e.g., "05PMC/26"
    prepared_on TIMESTAMP WITH TIME ZONE,
    sector CHARACTER VARYING(20), -- e.g., "DXBMXP"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT load_plans_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create load_plan_items table (cargo details)
CREATE TABLE IF NOT EXISTS public.load_plan_items (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    load_plan_id UUID NOT NULL REFERENCES public.load_plans(id) ON DELETE CASCADE,
    serial_number INTEGER,
    awb_number CHARACTER VARYING(50),
    origin_destination CHARACTER VARYING(20), -- ORG/DES
    pieces INTEGER,
    weight DECIMAL(10, 2), -- WGT
    volume DECIMAL(10, 2), -- VOL
    load_volume DECIMAL(10, 2), -- LVOL
    special_handling_code CHARACTER VARYING(50), -- SHC
    manual_description TEXT, -- MAN.DESC
    product_code_pc CHARACTER VARYING(50), -- PCODE PC
    total_handling_charge DECIMAL(10, 2), -- THC
    additional_total_handling_charge DECIMAL(10, 2), -- ATHC
    booking_status CHARACTER VARYING(20), -- BS
    priority_indicator CHARACTER VARYING(20), -- PI
    flight_in CHARACTER VARYING(50), -- FLTIN
    arrival_date_time TIMESTAMP WITH TIME ZONE, -- ARRDT.TIME
    quantity_aqnn CHARACTER VARYING(50), -- QNN/AQNN
    payment_terms CHARACTER VARYING(50), -- PT
    warehouse_code CHARACTER VARYING(50), -- WH.CODE
    special_instructions TEXT, -- SI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT load_plan_items_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_load_plans_flight_number ON public.load_plans USING btree (flight_number) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_load_plans_flight_date ON public.load_plans USING btree (flight_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_load_plans_sector ON public.load_plans USING btree (sector) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_load_plan_items_load_plan_id ON public.load_plan_items USING btree (load_plan_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_load_plan_items_awb_number ON public.load_plan_items USING btree (awb_number) TABLESPACE pg_default;

-- Create trigger function for updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at column
CREATE TRIGGER update_load_plans_updated_at 
    BEFORE UPDATE ON public.load_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_load_plan_items_updated_at 
    BEFORE UPDATE ON public.load_plan_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.load_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plan_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users on load_plans" ON public.load_plans
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on load_plan_items" ON public.load_plan_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.load_plans TO authenticated;
GRANT ALL ON public.load_plans TO service_role;
GRANT ALL ON public.load_plan_items TO authenticated;
GRANT ALL ON public.load_plan_items TO service_role;

-- Success message
SELECT 'Load plans tables created successfully!' as message;

