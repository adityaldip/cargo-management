import type { CargoData, ProcessedData } from "@/types/cargo-data"

export interface FilterOptions {
  customer?: string
  route?: string
  dateFrom?: string
  dateTo?: string
  mailCategory?: string
  euromail?: string
}

export function applyFilters(data: ProcessedData, filters: FilterOptions): ProcessedData {
  let filteredData = [...data.data]

  // Apply customer filter
  if (filters.customer && filters.customer !== "all") {
    filteredData = filteredData.filter((record) =>
      record.customer?.toLowerCase().includes(filters.customer!.toLowerCase()),
    )
  }

  // Apply route filter
  if (filters.route && filters.route !== "all") {
    const [origin, destination] = filters.route.split("-")
    filteredData = filteredData.filter((record) => record.origOE === origin && record.destOE === destination)
  }

  // Apply date range filter
  if (filters.dateFrom || filters.dateTo) {
    filteredData = filteredData.filter((record) => {
      if (!record.date) return false
      const recordDate = new Date(record.date)

      if (filters.dateFrom && recordDate < new Date(filters.dateFrom)) return false
      if (filters.dateTo && recordDate > new Date(filters.dateTo)) return false

      return true
    })
  }

  // Apply mail category filter
  if (filters.mailCategory && filters.mailCategory !== "all") {
    filteredData = filteredData.filter((record) => record.mailCat === filters.mailCategory)
  }

  // Apply euromail filter
  if (filters.euromail && filters.euromail !== "all") {
    filteredData = filteredData.filter((record) => record.euromail === filters.euromail)
  }

  // Recalculate summary for filtered data
  const totalKg = filteredData.reduce((sum, record) => sum + record.totalKg, 0)
  const euRecords = filteredData.filter((r) => r.euromail === "EU")
  const nonEuRecords = filteredData.filter((r) => r.euromail === "NONEU")

  const euSubtotal = euRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)
  const nonEuSubtotal = nonEuRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)

  return {
    data: filteredData,
    missingFields: data.missingFields,
    warnings: data.warnings,
    summary: {
      totalRecords: filteredData.length,
      euSubtotal,
      nonEuSubtotal,
      total: euSubtotal + nonEuSubtotal,
      totalKg,
    },
  }
}

export function getUniqueValues(data: CargoData[], field: keyof CargoData): string[] {
  const values = data
    .map((record) => record[field])
    .filter((value): value is string => typeof value === "string" && value.length > 0)

  return [...new Set(values)].sort()
}

export function getRouteOptions(data: CargoData[]): Array<{ value: string; label: string }> {
  const routes = data
    .filter((record) => record.origOE && record.destOE)
    .map((record) => ({
      value: `${record.origOE}-${record.destOE}`,
      label: `${record.origOE} → ${record.destOE}`,
    }))

  const uniqueRoutes = routes.filter((route, index, self) => index === self.findIndex((r) => r.value === route.value))

  return uniqueRoutes.sort((a, b) => a.label.localeCompare(b.label))
}
