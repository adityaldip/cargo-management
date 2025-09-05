import { FilterCondition } from "@/components/ui/filter-popup"

/**
 * Shared filter utility functions to ensure consistency across all components
 */

/**
 * Apply filters to any array of data with consistent logic
 * @param data - Array of records to filter
 * @param conditions - Filter conditions to apply
 * @param logic - AND/OR logic for multiple conditions
 * @param formatValue - Optional function to format values before comparison
 */
export function applyFilters<T = any>(
  data: T[], 
  conditions: FilterCondition[], 
  logic: "AND" | "OR" = "AND",
  formatValue?: (record: T, field: string) => string
): T[] {
  if (conditions.length === 0) return data

  return data.filter(record => {
    const conditionResults = conditions.map(condition => {
      // Use custom formatter if provided, otherwise convert to string
      const value = formatValue 
        ? formatValue(record, condition.field).toLowerCase()
        : String((record as any)[condition.field] || '').toLowerCase()
      
      const filterValue = condition.value.toLowerCase()

      switch (condition.operator) {
        case "equals":
          return value === filterValue
        case "contains":
          return value.includes(filterValue)
        case "starts_with":
          return value.startsWith(filterValue)
        case "ends_with":
          return value.endsWith(filterValue)
        case "greater_than":
          return parseFloat(value) > parseFloat(filterValue)
        case "less_than":
          return parseFloat(value) < parseFloat(filterValue)
        case "not_empty":
          return value.trim() !== ""
        case "is_empty":
          return value.trim() === ""
        default:
          return false
      }
    })

    return logic === "OR" 
      ? conditionResults.some(result => result)
      : conditionResults.every(result => result)
  })
}

/**
 * Standard filter field definitions for cargo data
 */
export const CARGO_FILTER_FIELDS = [
  { key: 'inb_flight_date', label: 'Inb. Flight Date', type: 'date' as const },
  { key: 'outb_flight_date', label: 'Outb. Flight Date', type: 'date' as const },
  { key: 'rec_id', label: 'Rec. ID', type: 'text' as const },
  { key: 'des_no', label: 'Des. No.', type: 'text' as const },
  { key: 'rec_numb', label: 'Rec. Number', type: 'text' as const },
  { key: 'orig_oe', label: 'Orig. OE', type: 'text' as const },
  { key: 'dest_oe', label: 'Dest. OE', type: 'text' as const },
  { key: 'inb_flight_no', label: 'Inb. Flight No.', type: 'text' as const },
  { key: 'outb_flight_no', label: 'Outb. Flight No.', type: 'text' as const },
  { key: 'mail_cat', label: 'Mail Category', type: 'text' as const },
  { key: 'mail_class', label: 'Mail Class', type: 'text' as const },
  { key: 'total_kg', label: 'Total Weight (kg)', type: 'number' as const },
  { key: 'invoice', label: 'Invoice', type: 'text' as const }
]

/**
 * Rate-specific filter fields (extends cargo fields)
 */
export const RATE_FILTER_FIELDS = [
  ...CARGO_FILTER_FIELDS,
  { key: 'applied_rule', label: 'Applied Rule', type: 'text' as const },
  { key: 'rate', label: 'Rate', type: 'text' as const }
]

/**
 * Customer-specific filter fields (extends cargo fields)
 */
export const CUSTOMER_FILTER_FIELDS = [
  ...CARGO_FILTER_FIELDS,
  { key: 'customer', label: 'Customer', type: 'text' as const }
]
