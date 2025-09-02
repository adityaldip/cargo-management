import type { CargoData } from "@/types/cargo-data"
import type { RateSettings } from "@/types/rate-settings"

export function calculateRate(record: CargoData, settings: RateSettings): number {
  // Find the most specific matching rule
  const applicableRules = settings.rules
    .filter((rule) => rule.active)
    .filter((rule) => {
      // Check route match
      if (rule.route) {
        const [origOE, destOE] = rule.route.split("-")
        if (record.origOE !== origOE || record.destOE !== destOE) return false
      }

      // Check customer match
      if (rule.customer && record.customer !== rule.customer) return false

      // Check mail category match
      if (rule.mailCategory && record.mailCat !== rule.mailCategory) return false

      // Check mail class match
      if (rule.mailClass && record.mailClass !== rule.mailClass) return false

      // Check euromail match
      if (rule.euromail && record.euromail !== rule.euromail) return false

      return true
    })
    .sort((a, b) => {
      // Sort by specificity (more specific rules first)
      let scoreA = 0
      let scoreB = 0

      if (a.route) scoreA += 4
      if (a.customer) scoreA += 3
      if (a.mailCategory) scoreA += 2
      if (a.mailClass) scoreA += 2
      if (a.euromail) scoreA += 1

      if (b.route) scoreB += 4
      if (b.customer) scoreB += 3
      if (b.mailCategory) scoreB += 2
      if (b.mailClass) scoreB += 2
      if (b.euromail) scoreB += 1

      return scoreB - scoreA
    })

  const rule = applicableRules[0]
  if (!rule) return 0

  // Calculate base rate
  const baseRate = Math.max(record.totalKg * rule.ratePerKg, rule.minimumCharge)

  // Apply VAT if enabled
  const finalRate = settings.applyVAT ? baseRate * (1 + settings.vatRate / 100) : baseRate

  // Round to specified precision
  return Math.round(finalRate * Math.pow(10, settings.roundingPrecision)) / Math.pow(10, settings.roundingPrecision)
}

export function applyRatesToData(data: CargoData[], settings: RateSettings): CargoData[] {
  return data.map((record) => {
    const calculatedRate = calculateRate(record, settings)
    const vatAmount = settings.applyVAT ? calculatedRate - calculatedRate / (1 + settings.vatRate / 100) : 0

    return {
      ...record,
      totalEur: calculatedRate,
      vatEur: vatAmount,
    }
  })
}
