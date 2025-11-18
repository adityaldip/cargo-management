-- Insert Emirates Load Plan Sample Data
-- This script inserts sample data for EK0205 flight on 12Oct 2025

-- Insert Load Plan 1: Sector DXBMXP
WITH dxbmxp_plan AS (
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
        'EK0205',
        '2025-10-12',
        '388R',
        'A6-EOW',
        1,
        'DXB',
        'MXP',
        'DXB/MXP',
        '09:35:00',
        'S294162',
        '05PMC/10AKE',
        '05PMC/26',
        '2025-10-15 11:08:39+00',
        'DXBMXP'
    ) RETURNING id
)
-- Insert Load Plan Items for DXBMXP
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
    dxbmxp_plan.id,
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
FROM dxbmxp_plan
CROSS JOIN (VALUES
        (1, '176-13820240', 'DXBJFK', 1, 242.0, 0.8064, 0.8064, 'HEA-SVC-CRT', 'CATERING GOOD', 'SVC', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', NULL, NULL::TIMESTAMP WITH TIME ZONE, NULL, 'N', NULL, NULL),
        (2, '176-10603445', 'BNEMXP', 2, 19.4, 0.164407, 0.164407, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0435', '2025-10-11 05:33:00+00'::TIMESTAMP WITH TIME ZONE, '28:34/', 'N', NULL, NULL),
        (3, '176-10603456', 'BNEMXP', 3, 29.9, 0.25339, 0.5, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0435', '2025-10-11 05:33:00+00'::TIMESTAMP WITH TIME ZONE, '28:34/', 'N', NULL, NULL),
        (4, '176-10609454', 'MELMXP', 1, 3.0, 0.025424, 0.025424, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0407', '2025-10-11 05:14:00+00'::TIMESTAMP WITH TIME ZONE, '28:53/', 'N', NULL, NULL),
        (5, '176-10609465', 'MELMXP', 10, 90.9, 0.77034, 1.0, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0407', '2025-10-11 05:14:00+00'::TIMESTAMP WITH TIME ZONE, '28:53/', 'N', NULL, NULL),
        (6, '176-10609476', 'MELMXP', 5, 49.1, 0.416102, 0.7, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0407', '2025-10-11 05:14:00+00'::TIMESTAMP WITH TIME ZONE, '28:53/', 'N', NULL, NULL),
        (7, '176-07700206', 'PERMXP', 1, 0.4, 0.00339, 0.00339, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0421', '2025-10-11 05:04:00+00'::TIMESTAMP WITH TIME ZONE, '29:03/', 'N', NULL, NULL),
        (8, '176-07700210', 'PERMXP', 1, 1.8, 0.015254, 0.015254, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0421', '2025-10-11 05:04:00+00'::TIMESTAMP WITH TIME ZONE, '29:03/', 'N', NULL, NULL),
        (9, '176-07700221', 'PERMXP', 3, 5.2, 0.044068, 0.044068, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0421', '2025-10-11 05:04:00+00'::TIMESTAMP WITH TIME ZONE, '29:03/', 'N', NULL, NULL),
        (10, '176-07700232', 'PERMXP', 1, 12.0, 0.101695, 0.101695, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0421', '2025-10-11 05:04:00+00'::TIMESTAMP WITH TIME ZONE, '29:03/', 'N', NULL, NULL),
        (11, '176-07700243', 'PERMXP', 1, 0.2, 0.001695, 0.001695, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0421', '2025-10-11 05:04:00+00'::TIMESTAMP WITH TIME ZONE, '29:03/', 'N', NULL, NULL),
        (12, '176-16255713', 'IKAMXP', 3, 20.8, 0.176271, 0.176271, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0972', '2025-10-11 13:27:00+00'::TIMESTAMP WITH TIME ZONE, '20:39/', 'N', NULL, NULL),
        (13, '176-18596454', 'SYDMXP', 5, 42.3, 0.358474, 0.7, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0415', '2025-10-11 13:06:00+00'::TIMESTAMP WITH TIME ZONE, '21:00/', 'N', NULL, NULL),
        (14, '176-18596465', 'SYDMXP', 1, 14.0, 0.118644, 0.118644, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0415', '2025-10-11 13:06:00+00'::TIMESTAMP WITH TIME ZONE, '21:00/', 'N', NULL, NULL),
        (15, '176-18596476', 'SYDMXP', 1, 14.2, 0.120339, 0.120339, 'MAL', 'INTL. MAIL', 'MAW', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0415', '2025-10-11 13:06:00+00'::TIMESTAMP WITH TIME ZONE, '21:00/', 'N', NULL, NULL),
        (16, '176-15033524', 'HKGMXP', 105, 2030.0, 11.973886, 11.973886, 'SPX-SBU', 'WOMEN S COTTON', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK9789', '2025-10-11 10:55:00+00'::TIMESTAMP WITH TIME ZONE, '17:11/23:11', 'N', NULL, NULL),
        (17, '176-16505274', 'BOMJFK', 3, 1450.0, 9.1008, 9.1008, 'HEA-CRT-EMD', 'CONSOLIDATED AS', 'AXD', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'Y', 'EK0509', '2025-10-12 00:24:00+00'::TIMESTAMP WITH TIME ZONE, '13:29/', 'N', NULL, NULL),
        (18, '176-12968620', 'DACJFK', 13, 296.4, 1.693114, 1.693114, NULL, 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'Y', 'EK0585', '2025-10-11 04:39:00+00'::TIMESTAMP WITH TIME ZONE, '29:28/', 'N', NULL, NULL),
    (19, '176-20257333', 'DXBMXP', 6, 36.3, 0.03, 0.03, 'VAL', 'CONSOLIDATION', 'VAL', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', NULL, NULL::TIMESTAMP WITH TIME ZONE, NULL, 'N', NULL, NULL)
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

-- Insert Load Plan 2: Sector DXBJFK
WITH dxbjfk_plan AS (
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
        'EK0205',
        '2025-10-12',
        '388R',
        'A6-EOW',
        1,
        'DXB',
        'JFK',
        'DXB/JFK',
        '09:35:00',
        'S294162',
        '05PMC/10AKE',
        '05PMC/26',
        '2025-10-15 11:08:39+00',
        'DXBJFK'
    ) RETURNING id
)
-- Insert Load Plan Items for DXBJFK
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
    dxbjfk_plan.id,
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
FROM dxbjfk_plan
CROSS JOIN (VALUES
        (1, '176-19890323', 'DWCJFK', 2, 16.5, 0.08448, 0.08448, 'SEA-ECC', 'CONSOLIDATION A', 'SEA', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK7524', '2025-10-09 22:51:00+00'::TIMESTAMP WITH TIME ZONE, '59:16/', 'N', NULL, NULL),
        (2, '176-13926511', 'CMBJFK', 1, 14.0, 0.023562, 0.023562, 'CGO', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0651', '2025-10-11 13:11:00+00'::TIMESTAMP WITH TIME ZONE, '20:56/', 'N', NULL, NULL),
        (3, '176-12620576', 'CMBJFK', 10, 146.5, 0.6344, 0.6344, 'ECC', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0651', '2025-10-10 12:59:00+00'::TIMESTAMP WITH TIME ZONE, '45:08/', 'N', NULL, NULL),
        (4, '176-10878556', 'TUNJFK', 4, 487.0, 3.168, 3.168, 'HEA-ECC', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0748', '2025-10-10 22:43:00+00'::TIMESTAMP WITH TIME ZONE, '35:23/', 'N', NULL, NULL),
        (5, '176-15838513', 'SINJFK', 4, 544.0, 4.068, 4.068, NULL, 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0353', '2025-10-11 03:59:00+00'::TIMESTAMP WITH TIME ZONE, '30:08/', 'N', NULL, NULL),
        (6, '176-16890241', 'HYDPHL', 1, 148.0, 1.04754, 1.04754, 'ECC-TSE', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0527', '2025-10-11 12:12:00+00'::TIMESTAMP WITH TIME ZONE, '21:55/', 'N', NULL, NULL),
        (7, '176-04616581', 'LHEJFK', 45, 1320.0, 7.91, 7.91, 'COU-XPS-FCE', 'COURIER ON AWB', 'COU', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'N', 'EK0623', '2025-10-12 06:05:00+00'::TIMESTAMP WITH TIME ZONE, '04:02/', 'N', NULL, NULL),
        (8, '176-19897102', 'KTIJFK', 60, 140.979, 1.2581118, 1.2581118, NULL, 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'Y', 'EK0349', '2025-10-11 05:00:00+00'::TIMESTAMP WITH TIME ZONE, '29:07/', 'N', NULL, NULL),
    (9, '176-98261704', 'DXBJFK', 5, 2941.0, 7.70625, 7.70625, 'HEA-RMD-EAW', 'CONSOLIDATION', 'GCR', NULL::DECIMAL(10, 2), NULL::DECIMAL(10, 2), 'SS', 'Y', NULL, NULL::TIMESTAMP WITH TIME ZONE, NULL, 'N', NULL, NULL)
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
SELECT 'Emirates Load Plan sample data inserted successfully!' as message;

