import { RateRule, RateConfig } from './types'

// Sample airBaltic rate automation rules
export const SAMPLE_RATE_RULES: RateRule[] = [
  {
    id: "1",
    name: "EU Zone Standard Rate",
    description: "Standard rate for EU destinations under 25kg",
    isActive: true,
    priority: 1,
    conditions: [
      { field: "route", operator: "contains", value: "FRANK,DEBER,CZPRG,ITFCO" },
      { field: "weight", operator: "less_than", value: "25" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 4.50,
      multiplier: 1.0,
      currency: "EUR",
      tags: ["EU", "Standard", "Light"]
    },
    matchCount: 234,
    lastRun: "2025-01-28T12:00:00Z"
  },
  {
    id: "2", 
    name: "Nordic Express Premium",
    description: "Premium rates for Nordic routes with priority handling",
    isActive: true,
    priority: 2,
    conditions: [
      { field: "route", operator: "contains", value: "SEARNK,NOKRS,DKAAR,FICPH" },
      { field: "mail_category", operator: "equals", value: "A" },
      { field: "weight", operator: "greater_than", value: "10" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 6.75,
      multiplier: 1.25,
      currency: "EUR",
      tags: ["Nordic", "Premium", "Express"]
    },
    matchCount: 89,
    lastRun: "2025-01-28T09:15:00Z"
  },
  {
    id: "3",
    name: "Heavy Cargo Discount",
    description: "Discounted rates for heavy shipments over 50kg",
    isActive: true,
    priority: 3,
    conditions: [
      { field: "weight", operator: "greater_than", value: "50" },
      { field: "mail_category", operator: "equals", value: "B" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 3.25,
      multiplier: 0.85,
      currency: "EUR",
      tags: ["Heavy", "Discount", "Bulk"]
    },
    matchCount: 45,
    lastRun: "2025-01-28T10:30:00Z"
  },
  {
    id: "4",
    name: "Intercontinental Fixed Rate",
    description: "Fixed rate structure for intercontinental routes",
    isActive: true,
    priority: 4,
    conditions: [
      { field: "route", operator: "contains", value: "USNYC,USLAX,CAYVR,JPNRT" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "fixed",
      baseRate: 125.00,
      currency: "EUR",
      tags: ["Intercontinental", "Fixed", "Long-haul"]
    },
    matchCount: 34,
    lastRun: "2025-01-28T11:45:00Z"
  },
  {
    id: "5",
    name: "Distance-Based Calculation",
    description: "Calculate rates based on flight distance for efficiency",
    isActive: true,
    priority: 5,
    conditions: [
      { field: "distance", operator: "between", value: "500", value2: "2000" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "distance_based",
      baseRate: 0.08,
      multiplier: 1.0,
      currency: "EUR",
      tags: ["Distance", "Efficiency", "Calculated"]
    },
    matchCount: 156,
    lastRun: "2025-01-28T08:20:00Z"
  },
  {
    id: "6",
    name: "Zone-Based Regional",
    description: "Zone-based pricing for regional European routes",
    isActive: true,
    priority: 6,
    conditions: [
      { field: "route", operator: "contains", value: "DEBER,FRANK,NLAMR,BEGRU" },
      { field: "weight", operator: "between", value: "5", value2: "30" }
    ],
    actions: {
      rateType: "zone_based",
      baseRate: 35.00,
      multiplier: 1.15,
      currency: "EUR",
      tags: ["Zone", "Regional", "Europe"]
    },
    matchCount: 67,
    lastRun: "2025-01-28T07:30:00Z"
  }
]

export const DEFAULT_RATE_CONFIGS: RateConfig[] = [
  { key: 'eu_zone_standard', label: 'EU Zone Standard Rate', visible: true, order: 1 },
  { key: 'nordic_express_premium', label: 'Nordic Express Premium', visible: true, order: 2 },
  { key: 'heavy_cargo_discount', label: 'Heavy Cargo Discount', visible: true, order: 3 },
  { key: 'intercontinental_fixed', label: 'Intercontinental Fixed Rate', visible: true, order: 4 },
  { key: 'distance_based_calculation', label: 'Distance-Based Calculation', visible: true, order: 5 },
  { key: 'zone_based_regional', label: 'Zone-Based Regional', visible: true, order: 6 },
]
