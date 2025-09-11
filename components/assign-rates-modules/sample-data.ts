import { RateRule, RateConfig } from '@/types/rate-management'

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
    rate: 4.50,
    currency: "EUR",
    multiplier: 1.0,
    matchCount: 234,
    createdAt: "2025-01-28T12:00:00Z",
    updatedAt: "2025-01-28T12:00:00Z"
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
    rate: 6.75,
    currency: "EUR",
    multiplier: 1.25,
    matchCount: 89,
    createdAt: "2025-01-28T09:15:00Z",
    updatedAt: "2025-01-28T09:15:00Z"
  },
  {
    id: "3",
    name: "Heavy Cargo Discount",
    description: "Discounted rates for heavy shipments over 50kg",
    isActive: true,
    priority: 3,
    conditions: [
      { field: "weight", operator: "greater_than", value: "50" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    rate: 3.20,
    currency: "EUR",
    multiplier: 0.85,
    matchCount: 45,
    createdAt: "2025-01-28T14:30:00Z",
    updatedAt: "2025-01-28T14:30:00Z"
  },
  {
    id: "4",
    name: "Express Priority Zone",
    description: "Express rates for priority destinations",
    isActive: true,
    priority: 4,
    conditions: [
      { field: "route", operator: "contains", value: "GBLHR,USNYC,CAYVR" },
      { field: "mail_class", operator: "equals", value: "Express" }
    ],
    rate: 25.00,
    currency: "EUR",
    multiplier: 1.0,
    matchCount: 156,
    createdAt: "2025-01-28T11:45:00Z",
    updatedAt: "2025-01-28T11:45:00Z"
  },
  {
    id: "5",
    name: "Regional Economy",
    description: "Economy rates for regional Baltic destinations",
    isActive: true,
    priority: 5,
    conditions: [
      { field: "route", operator: "contains", value: "LVRIX,LTVIE,EEALL" },
      { field: "weight", operator: "less_than", value: "15" },
      { field: "mail_category", operator: "equals", value: "B" }
    ],
    rate: 2.80,
    currency: "EUR",
    multiplier: 0.9,
    matchCount: 312,
    createdAt: "2025-01-28T16:20:00Z",
    updatedAt: "2025-01-28T16:20:00Z"
  },
  {
    id: "6",
    name: "Business Class Premium",
    description: "Premium rates for business class mail",
    isActive: false,
    priority: 6,
    conditions: [
      { field: "mail_class", operator: "equals", value: "Business" },
      { field: "weight", operator: "between", value: "5", value2: "30" }
    ],
    rate: 8.50,
    currency: "EUR",
    multiplier: 1.5,
    matchCount: 67,
    createdAt: "2025-01-27T10:00:00Z",
    updatedAt: "2025-01-27T10:00:00Z"
  }
]

// Sample rate configuration for column management
export const SAMPLE_RATE_CONFIGS: RateConfig[] = [
  { key: "name", label: "Rule Name", visible: true, order: 1 },
  { key: "description", label: "Description", visible: true, order: 2 },
  { key: "conditions", label: "Conditions", visible: true, order: 3 },
  { key: "rate", label: "Rate", visible: true, order: 4 },
  { key: "currency", label: "Currency", visible: true, order: 5 },
  { key: "isActive", label: "Status", visible: true, order: 6 },
  { key: "matchCount", label: "Matches", visible: true, order: 7 },
  { key: "priority", label: "Priority", visible: false, order: 8 },
  { key: "createdAt", label: "Created", visible: false, order: 9 },
  { key: "updatedAt", label: "Updated", visible: false, order: 10 }
]