"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  total: number
  startIndex: number
  loading: boolean
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  total,
  startIndex,
  loading,
  onPageChange,
  onItemsPerPageChange
}: PaginationControlsProps) {
  const handlePreviousPage = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }

  const handleNextPage = () => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }

  const handleItemsPerPageChange = (value: string) => {
    onItemsPerPageChange(Number(value))
    onPageChange(1) // Reset to first page when changing items per page
  }

  return (
    <div className="flex items-center justify-between mt-0 pt-2 border-t px-4 pb-0">
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Show</span>
        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={handleItemsPerPageChange}
        >
          <SelectTrigger className="w-16 h-7 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">entries</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, total)} of {total} entries
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="px-2 py-1 text-sm bg-gray-100 rounded">
            {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
