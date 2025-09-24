import type { ColumnMappingRule } from "@/lib/file-processor"

export const FINAL_EXPORT_COLUMNS = [
  "Inb.Flight Date",
  "Outb.Flight Date", 
  "Rec. ID",
  "Des. No.",
  "Rec. Numb.",
  "Orig. OE",
  "Dest. OE",
  "Inb. Flight No. | STA",
  "Outb. Flight No. | STD",
  "Mail Cat.",
  "Mail Class",
  "Total kg",
]

export function createDefaultMappings(
  excelColumns: string[], 
  sampleData: Record<string, string[]>
): ColumnMappingRule[] {
  return excelColumns.map((col, index) => ({
    excelColumn: col,
    mappedTo: index < FINAL_EXPORT_COLUMNS.length ? FINAL_EXPORT_COLUMNS[index] : null,
    finalColumn: FINAL_EXPORT_COLUMNS[index] || "Unmapped",
    status: (index < FINAL_EXPORT_COLUMNS.length ? "mapped" : "unmapped") as "mapped" | "unmapped" | "warning",
    sampleData: sampleData[col] || [],
  }))
}

export function validateMappings(mappings: ColumnMappingRule[]): {
  hasConflicts: boolean
  conflictCount: number
  mappedCount: number
  totalCount: number
} {
  const conflictCount = mappings.filter((m) => m.status === "warning").length
  const mappedCount = mappings.filter((m) => m.status === "mapped").length
  const totalCount = mappings.length
  
  return {
    hasConflicts: conflictCount > 0,
    conflictCount,
    mappedCount,
    totalCount
  }
}

export function getMappingStatus(
  excelColumn: string, 
  finalColumn: string, 
  currentMappings: ColumnMappingRule[]
): "mapped" | "unmapped" | "warning" {
  if (finalColumn === "unmapped") {
    return "unmapped"
  }
  
  const isAlreadyMapped = currentMappings.some(
    (m) => m.excelColumn !== excelColumn && m.mappedTo === finalColumn
  )
  
  return isAlreadyMapped ? "warning" : "mapped"
}
