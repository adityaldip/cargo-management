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
import { Flight } from "./types"

interface FlightTableProps {
  flights: Flight[]
  loading: boolean
  flightSearchTerm: string
  setFlightSearchTerm: (term: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void
  togglingStatus: Set<string>
  onToggleFlight: (flightId: string) => void
  onEditFlight: (flight: Flight) => void
  onDeleteFlight: (flight: Flight) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function FlightTable({
  flights,
  loading,
  flightSearchTerm,
  setFlightSearchTerm,
  statusFilter,
  setStatusFilter,
  togglingStatus,
  onToggleFlight,
  onEditFlight,
  onDeleteFlight,
  onRefresh,
  isRefreshing
}: FlightTableProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortField, setSortField] = useState<'flightNumber' | 'origin' | 'destination' | 'status'>('flightNumber')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showAll, setShowAll] = useState(false)

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(flightSearchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [flightSearchTerm])

  // Memoized filtered flights for better performance
  const filteredFlights = useMemo(() => {
    return flights
      .filter(flight => {
        // Search filter
        const matchesSearch = flight.flightNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          flight.origin.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          flight.destination.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          flight.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'active' && flight.is_active) ||
          (statusFilter === 'inactive' && !flight.is_active)
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0
        
        switch (sortField) {
          case 'flightNumber':
            comparison = a.flightNumber.localeCompare(b.flightNumber)
            break
          case 'origin':
            comparison = a.origin.localeCompare(b.origin)
            break
          case 'destination':
            comparison = a.destination.localeCompare(b.destination)
            break
          case 'status':
            comparison = a.status.localeCompare(b.status)
            break
          default:
            comparison = a.flightNumber.localeCompare(b.flightNumber)
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [flights, debouncedSearchTerm, statusFilter, sortOrder, sortField])

  // Pagination logic with performance optimization
  const totalItems = filteredFlights.length
  const displayItems = showAll ? filteredFlights : filteredFlights.slice(0, itemsPerPage)
  const hasMoreItems = filteredFlights.length > itemsPerPage

  const handleSortToggle = (field: 'flightNumber' | 'origin' | 'destination' | 'status') => {
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
            placeholder="Search flights by number, origin, destination, or status..."
            value={flightSearchTerm}
            onChange={(e) => setFlightSearchTerm(e.target.value)}
            className="w-full pr-8"
          />
          {flightSearchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results Summary */}
      {filteredFlights.length > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          Showing {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''}
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
                  onClick={() => handleSortToggle('flightNumber')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Flight
                  {sortField === 'flightNumber' && (
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
                  onClick={() => handleSortToggle('origin')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Origin
                  {sortField === 'origin' && (
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
                  onClick={() => handleSortToggle('destination')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Destination
                  {sortField === 'destination' && (
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
            {displayItems.map((flight) => (
              <TableRow key={flight.id} className="">
                <TableCell className="py-1 px-1">
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <Switch
                        checked={flight.is_active}
                        onCheckedChange={() => onToggleFlight(flight.id)}
                        disabled={togglingStatus.has(flight.id)}
                        className="scale-75"
                      />
                      {togglingStatus.has(flight.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      flight.is_active ? "text-green-600" : "text-gray-400"
                    )}>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div>
                    <p className="font-medium text-black text-sm leading-tight">{flight.flightNumber}</p>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {flight.origin}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {flight.destination}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="flex gap-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditFlight(flight)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteFlight(flight)}
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
      {filteredFlights.length > 0 && (
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

      {filteredFlights.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No flights found matching your search criteria</p>
        </div>
      )}
    </div>
  )
}
