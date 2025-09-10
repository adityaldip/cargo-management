import type { ProcessedData } from "./cargo-data"

export interface ImportMailAgentProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export interface ImportMailSystemProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export type ImportStep = "upload" | "map" | "ignore" | "ignored"

export interface ProgressStats {
  currentRow: number
  totalRows: number
  processedRows: number
}
