"use client"

import { Button } from "@/components/ui/button"

export interface PaginationProps {
  // Data info
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  startIndex: number
  endIndex: number
  
  // Navigation
  onPageChange: (page: number) => void
  onRecordsPerPageChange?: (recordsPerPage: number) => void
  
  // State
  disabled?: boolean
  hasPrevPage?: boolean
  hasNextPage?: boolean
  
  // Customization
  showRecordsPerPage?: boolean
  showGoToPage?: boolean
  showPageNumbers?: boolean
  recordsPerPageOptions?: number[]
  className?: string
  
  // Labels
  recordsLabel?: string
  showingLabel?: string
  ofLabel?: string
  perPageLabel?: string
  goToPageLabel?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onRecordsPerPageChange,
  disabled = false,
  hasPrevPage = currentPage > 1,
  hasNextPage = currentPage < totalPages,
  showRecordsPerPage = true,
  showGoToPage = true,
  showPageNumbers = true,
  recordsPerPageOptions = [25, 50, 100, 200],
  className = "",
  recordsLabel = "records",
  showingLabel = "Showing",
  ofLabel = "of",
  perPageLabel = "per page",
  goToPageLabel = "Go to page:"
}: PaginationProps) {
  
  if (totalRecords === 0) return null

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {/* Top row - Records info and per page selector */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            {showingLabel} <strong className="text-black">{startIndex + 1}</strong> to <strong className="text-black">{Math.min(endIndex, totalRecords)}</strong> {ofLabel} <strong className="text-black">{totalRecords.toLocaleString()}</strong> {recordsLabel}
          </span>
        </div>
        
        {showRecordsPerPage && onRecordsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select 
              value={recordsPerPage} 
              onChange={(e) => {
                const newLimit = parseInt(e.target.value)
                onRecordsPerPageChange(newLimit)
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
              aria-label="Records per page"
              title="Select number of records to show per page"
            >
              {recordsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">{perPageLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom row - Navigation controls */}
      <div className="flex items-center justify-between">
        {/* Go to page input */}
        {showGoToPage && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{goToPageLabel}</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page)
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
              disabled={disabled}
              aria-label="Go to page number"
              title="Enter page number to jump to"
              placeholder="Page"
            />
            <span className="text-sm text-gray-600">{ofLabel} {totalPages}</span>
          </div>
        )}

        {/* Page navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || disabled}
            className="px-3"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={!hasPrevPage || disabled}
          >
            Previous
          </Button>
          
          {/* Page numbers */}
          {showPageNumbers && (
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                    disabled={disabled}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={!hasNextPage || disabled}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || disabled}
            className="px-3"
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  )
}