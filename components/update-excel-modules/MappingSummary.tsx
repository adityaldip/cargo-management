"use client"

import { AlertTriangle } from "lucide-react"

interface MappingSummaryProps {
  mappedCount: number
  totalCount: number
  conflictCount: number
  hasConflicts: boolean
  totalRows?: number
}

export function MappingSummary({ mappedCount, totalCount, conflictCount, hasConflicts, totalRows }: MappingSummaryProps) {
  return (
    <>
      {/* File Info */}
      {totalRows && (
        <div className="text-xs text-gray-500 pb-1">
          Processing {totalRows.toLocaleString()} rows of data
        </div>
      )}
      
      {/* Mapping Summary */}
      <div className="flex items-center justify-between text-sm pb-1">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">
            Mapped: <strong className="text-green-600">{mappedCount}</strong>
          </span>
          <span className="text-gray-600">
            Unmapped: <strong className="text-gray-500">{totalCount - mappedCount - conflictCount}</strong>
          </span>
          {conflictCount > 0 && (
            <span className="text-gray-600">
              Conflicts: <strong className="text-red-600">{conflictCount}</strong>
            </span>
          )}
        </div>
      </div>
      
      {hasConflicts && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Please resolve mapping conflicts. Multiple Excel columns cannot be mapped to the same final column.
          </p>
        </div>
      )}
    </>
  )
}
