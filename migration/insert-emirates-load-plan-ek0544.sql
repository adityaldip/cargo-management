-- Insert Emirates Load Plan Sample Data - EK0544
-- This script inserts sample data for EK0544 flight on 01Mar 2024

-- Insert Load Plan: Sector DXBMAA
WITH dxbmaa_plan AS (
    INSERT INTO public.load_plans (
        flight_number,
        flight_date,
        aircraft_type,
        aircraft_registration,
        header_version,
        route_origin,
        route_destination,
        route_full,
        std_time,
        prepared_by,
        total_planned_uld,
        uld_version,
        prepared_on,
        sector
    ) VALUES (
        'EK0544',
        '2024-03-01',
        '77WER',
        'A6-ENT',
        1,
        'DXB',
        'MAA',
        'DXB/MAA/0/23/251',
        '02:50:00',
        'PRINCE',
        '06PMC/07AKE',
        '06/26',
        '2024-02-29 12:44:05+00',
        'DXBMAA'
    ) RETURNING id
)
-- Insert Load Plan Items for DXBMAA
INSERT INTO public.load_plan_items (
    load_plan_id,
    serial_number,
    awb_number,
    origin_destination,
    pieces,
    weight,
    volume,
    load_volume,
    special_handling_code,
    manual_description,
    product_code_pc,
    total_handling_charge,
    additional_total_handling_charge,
    booking_status,
    priority_indicator,
    flight_in,
    arrival_date_time,
    quantity_aqnn,
    payment_terms,
    warehouse_code,
    special_instructions
)
SELECT 
    dxbmaa_plan.id,
    items.serial_number,
    items.awb_number,
    items.origin_destination,
    items.pieces,
    items.weight,
    items.volume,
    items.load_volume,
    items.special_handling_code,
    items.manual_description,
    items.product_code_pc,
    items.total_handling_charge::DECIMAL(10, 2),
    items.additional_total_handling_charge::DECIMAL(10, 2),
    items.booking_status,
    items.priority_indicator,
    items.flight_in,
    items.arrival_date_time,
    items.quantity_aqnn,
    items.payment_terms,
    items.warehouse_code,
    items.special_instructions
FROM dxbmaa_plan
CROSS JOIN (VALUES
    (1, '176-92065120', 'FRAMAA', 31, 1640.2, 18.9, 20.0, 'PIL-CRT-EAP', 'CONSOLIDATION A', 'AXD', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9903', '2024-02-29 04:18:00+00'::TIMESTAMP WITH TIME ZONE, '13:40/22:31', 'N', NULL, NULL),
    (2, '176-98208961', 'DXBMAA', 1, 10.0, 0.1, 0.1, 'VAL', 'GOLD JEWELLERY.', 'VAL', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', NULL, NULL::TIMESTAMP WITH TIME ZONE, NULL, 'N', NULL, NULL),
    (3, '176-93627586', 'MNLMAA', 13, 2690.0, 18.5, 18.5, 'HEA-CGO', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0333', '2024-02-27 23:34:00+00'::TIMESTAMP WITH TIME ZONE, '51:16/', 'N', NULL, NULL),
    (4, '176-99699530', 'PEKMAA', 9, 643.0, 1.3, 1.3, 'VUN', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9307', '2024-02-29 02:16:00+00'::TIMESTAMP WITH TIME ZONE, '19:20/24:33', 'N', NULL, NULL),
    (5, '176-95418503', 'MXPMAA', 3, 356.0, 2.8, 2.8, 'SPX', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9918', '2024-02-29 03:15:00+00'::TIMESTAMP WITH TIME ZONE, '19:20/23:35', 'N', NULL, NULL),
    (6, '176-92921581', 'MXPMAA', 1, 227.0, 0.3, 0.3, 'HEA-SPX', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9918', '2024-02-29 03:15:00+00'::TIMESTAMP WITH TIME ZONE, '19:20/23:35', 'N', NULL, NULL),
    (7, '176-92082874', 'FRAMAA', 15, 242.5, 1.9, 1.9, 'EAP-SPX', 'CONSOLIDATION A', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9903', '2024-02-29 04:18:00+00'::TIMESTAMP WITH TIME ZONE, '13:30/22:31', 'N', NULL, NULL),
    (8, '176-93270542', 'FRAMAA', 11, 145.5, 0.9, 0.9, 'EAP', 'CONSOLIDATION A', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9903', '2024-02-29 04:18:00+00'::TIMESTAMP WITH TIME ZONE, '13:30/22:31', 'N', NULL, NULL),
    (9, '176-92388321', 'MIAMAA', 57, 1499.0, 8.6, 8.6, 'PES-CRT', 'SHRIMP', 'PXS', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0214', '2024-02-29 19:15:00+00'::TIMESTAMP WITH TIME ZONE, '07:25/', 'N', NULL, NULL),
    (10, '176-92388332', 'MIAMAA', 57, 1499.0, 8.6, 8.6, 'PES-CRT', 'LIVE SHRIMP', 'PXS', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0214', '2024-02-29 19:15:00+00'::TIMESTAMP WITH TIME ZONE, '07:25/', 'N', NULL, NULL),
    (11, '176-91628773', 'DARMAA', 1, 20.0, 0.1, 0.1, 'VAL', 'GOLD', 'VAL', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0726', '2024-02-29 21:45:00+00'::TIMESTAMP WITH TIME ZONE, '05:05/', 'N', NULL, NULL),
    (12, '176-91629020', 'DARMAA', 1, 20.0, 0.1, 0.1, 'VAL', 'GOLD', 'VAL', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0726', '2024-02-29 21:45:00+00'::TIMESTAMP WITH TIME ZONE, '05:05/', 'N', NULL, NULL),
    (13, '176-91073931', 'KRKMAA', 1, 363.0, 0.6, 4.0, 'SPX-EAP-HEA', 'CONSOLIDATION A', 'AXA', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0180', '2024-02-29 22:20:00+00'::TIMESTAMP WITH TIME ZONE, '04:30/', 'N', NULL, NULL)
) AS items(
    serial_number,
    awb_number,
    origin_destination,
    pieces,
    weight,
    volume,
    load_volume,
    special_handling_code,
    manual_description,
    product_code_pc,
    total_handling_charge,
    additional_total_handling_charge,
    booking_status,
    priority_indicator,
    flight_in,
    arrival_date_time,
    quantity_aqnn,
    payment_terms,
    warehouse_code,
    special_instructions
);

-- Success message
SELECT 'Emirates Load Plan EK0544 sample data inserted successfully!' as message;

