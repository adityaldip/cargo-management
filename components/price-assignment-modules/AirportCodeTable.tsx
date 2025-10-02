"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Edit, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AirportCode } from "./types"

interface AirportCodeTableProps {
  airportCodes: AirportCode[]
  loading: boolean
  airportSearchTerm: string
  setAirportSearchTerm: (term: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void
  togglingStatus: Set<string>
  togglingEU: Set<string>
  onToggleAirport: (airportId: string) => void
  onToggleEU: (airportId: string) => void
  onEditAirport: (airport: AirportCode) => void
  onDeleteAirport: (airport: AirportCode) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function AirportCodeTable({
  airportCodes,
  loading,
  airportSearchTerm,
  setAirportSearchTerm,
  statusFilter,
  setStatusFilter,
  togglingStatus,
  togglingEU,
  onToggleAirport,
  onToggleEU,
  onEditAirport,
  onDeleteAirport,
  onRefresh,
  isRefreshing
}: AirportCodeTableProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortField, setSortField] = useState<'code' | 'is_eu'>('code')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showAll, setShowAll] = useState(false)

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(airportSearchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [airportSearchTerm])

  // Memoized filtered airport codes for better performance
  const filteredAirportCodes = useMemo(() => {
    return airportCodes
      .filter(airport => {
        // Search filter
        const matchesSearch = airport.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'active' && airport.is_active) ||
          (statusFilter === 'inactive' && !airport.is_active)
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0
        
        switch (sortField) {
          case 'code':
            comparison = a.code.localeCompare(b.code)
            break
          case 'is_eu':
            comparison = a.is_eu === b.is_eu ? 0 : (a.is_eu ? 1 : -1)
            break
          default:
            comparison = a.code.localeCompare(b.code)
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [airportCodes, debouncedSearchTerm, statusFilter, sortOrder, sortField])

  // Pagination logic with performance optimization
  const totalItems = filteredAirportCodes.length
  const displayItems = showAll ? filteredAirportCodes : filteredAirportCodes.slice(0, itemsPerPage)
  const hasMoreItems = filteredAirportCodes.length > itemsPerPage

  const handleSortToggle = (field: 'code' | 'is_eu') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search airport codes..."
            value={airportSearchTerm}
            onChange={(e) => setAirportSearchTerm(e.target.value)}
            className="w-full pr-8"
          />
          {airportSearchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results Summary */}
      {filteredAirportCodes.length > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          Showing {filteredAirportCodes.length} airport code{filteredAirportCodes.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` (${statusFilter} only)`}
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 py-1 text-xs">Status</TableHead>
              <TableHead className="h-8 py-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSortToggle('code')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Code
                  {sortField === 'code' && (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 ml-1" />
                    )
                  )}
                </Button>
              </TableHead>
              <TableHead className="h-8 py-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSortToggle('is_eu')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  EU/Non EU
                  {sortField === 'is_eu' && (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 ml-1" />
                    )
                  )}
                </Button>
              </TableHead>
              <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((airport) => (
              <TableRow key={airport.id} className="">
                <TableCell className="py-1 px-1">
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <Switch
                        checked={airport.is_active}
                        onCheckedChange={() => onToggleAirport(airport.id)}
                        disabled={togglingStatus.has(airport.id)}
                        className="scale-75"
                      />
                      {togglingStatus.has(airport.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      airport.is_active ? "text-green-600" : "text-gray-400"
                    )}>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {airport.code}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={airport.is_eu}
                      onCheckedChange={() => onToggleEU(airport.id)}
                      disabled={togglingEU.has(airport.id)}
                      className="scale-75"
                    />
                    {togglingEU.has(airport.id) && (
                      <div className="ml-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <Badge className={airport.is_eu ? "bg-blue-100 text-blue-800 text-xs" : "bg-gray-100 text-gray-800 text-xs"}>
                      {airport.is_eu ? "EU" : "NON EU"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="flex gap-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditAirport(airport)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteAirport(airport)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Performance Controls */}
      {filteredAirportCodes.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setShowAll(false)
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {showAll ? `Showing all ${totalItems} entries` : `Showing ${displayItems.length} of ${totalItems} entries`}
            </span>
            
            {hasMoreItems && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
              >
                Show All
              </Button>
            )}
            
            {showAll && hasMoreItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </div>
        </div>
      )}

      {filteredAirportCodes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No airport codes found matching your search criteria</p>
        </div>
      )}
    </div>
  )
}
