import type { CargoData } from "@/types/cargo-data"

export interface IgnoreRule {
  id: string
  name: string
  is_active: boolean
  priority: number
  field: string
  operator: string
  value: string
  description?: string
}

/**
 * Apply ignore rules to filter out cargo data records
 * @param data Array of cargo data records
 * @param rules Array of ignore rules to apply
 * @returns Filtered array with ignored records removed
 */
export function applyIgnoreRules(data: CargoData[], rules: IgnoreRule[]): CargoData[] {
  if (!rules || rules.length === 0) {
    return data
  }

  // Only apply active rules, sorted by priority
  const activeRules = rules
    .filter(rule => rule.is_active)
    .sort((a, b) => a.priority - b.priority)

  if (activeRules.length === 0) {
    return data
  }

  return data.filter(record => {
    // If any rule matches (should ignore), exclude this record
    const shouldIgnore = activeRules.some(rule => {
      return matchesIgnoreRule(record, rule)
    })
    
    return !shouldIgnore
  })
}

/**
 * Check if a cargo data record matches an ignore rule
 * @param record The cargo data record to check
 * @param rule The ignore rule to apply
 * @returns true if the record matches the rule (should be ignored)
 */
function matchesIgnoreRule(record: CargoData, rule: IgnoreRule): boolean {
  const fieldValue = getFieldValue(record, rule.field)
  
  if (fieldValue === undefined || fieldValue === null) {
    return false
  }

  const recordValue = String(fieldValue).toLowerCase().trim()
  const ruleValues = rule.value.toLowerCase().split(',').map(v => v.trim()).filter(v => v)

  // Apply operator logic for each rule value
  return ruleValues.some(ruleValue => {
    switch (rule.operator) {
      case "equals":
        return recordValue === ruleValue
      case "contains":
        return recordValue.includes(ruleValue)
      case "starts_with":
        return recordValue.startsWith(ruleValue)
      case "ends_with":
        return recordValue.endsWith(ruleValue)
      default:
        return false
    }
  })
}

/**
 * Get the value of a field from a cargo data record
 * @param record The cargo data record
 * @param fieldKey The field key to retrieve
 * @returns The field value or undefined if not found
 */
function getFieldValue(record: CargoData, fieldKey: string): any {
  // Map field keys to actual CargoData properties
  const fieldMap: Record<string, keyof CargoData> = {
    'inb_flight_no': 'inbFlightNo',
    'outb_flight_no': 'outbFlightNo', 
    'rec_numb': 'recNumb',
    'rec_id': 'recordId',
    'des_no': 'desNo',
    'orig_oe': 'origOE',
    'dest_oe': 'destOE',
    'mail_cat': 'mailCat',
    'mail_class': 'mailClass',
    'total_kg': 'totalKg',
    'invoice': 'invoiceExtend',
    'customer': 'customer',
    'date': 'date'
  }

  const mappedField = fieldMap[fieldKey] || fieldKey
  return (record as any)[mappedField]
}

/**
 * Get statistics about how many records were ignored
 * @param originalCount Original number of records
 * @param filteredCount Number of records after applying rules
 * @param rules The ignore rules that were applied
 * @returns Statistics object
 */
export function getIgnoreRuleStats(originalCount: number, filteredCount: number, rules: IgnoreRule[]) {
  const ignoredCount = originalCount - filteredCount
  const activeRulesCount = rules.filter(r => r.is_active).length
  
  return {
    originalCount,
    filteredCount,
    ignoredCount,
    ignoredPercentage: originalCount > 0 ? Math.round((ignoredCount / originalCount) * 100) : 0,
    activeRulesCount,
    hasIgnoredRecords: ignoredCount > 0
  }
}

/**
 * Apply ignore rules with multiple conditions from localStorage
 * @param data Array of CargoData records
 * @param rules Array of IgnoreRule objects
 * @param persistedConditions Array of conditions from localStorage
 * @returns Filtered array of CargoData records
 */
export function applyIgnoreRulesWithConditions(
  data: CargoData[], 
  rules: IgnoreRule[], 
  persistedConditions: Array<{field: string, operator: string, value: string}> = []
): CargoData[] {
  if (!data || data.length === 0) return data
  
  // If we have persisted conditions, use them instead of the rules
  if (persistedConditions.length > 0) {
    return data.filter(record => {
      // Check if record matches any of the persisted conditions
      return !persistedConditions.some(condition => {
        const recordValue = getFieldValue(record, condition.field)
        const conditionValues = condition.value.split(',').map(v => v.trim())
        
        switch (condition.operator) {
          case 'equals':
            return conditionValues.includes(String(recordValue))
          case 'contains':
            return conditionValues.some(v => String(recordValue).includes(v))
          case 'starts_with':
            return conditionValues.some(v => String(recordValue).startsWith(v))
          case 'ends_with':
            return conditionValues.some(v => String(recordValue).endsWith(v))
          default:
            return false
        }
      })
    })
  }
  
  // Fallback to original rules logic
  return applyIgnoreRules(data, rules)
}
