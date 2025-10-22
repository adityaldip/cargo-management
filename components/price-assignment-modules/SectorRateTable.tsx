"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUp, ArrowDown, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectorRate, Flight } from "./types"

interface AlternativeRoutesCellProps {
  origin: string
  destination: string
  alternatives: Array<{
    route: string
    rate: number
    isDirect: boolean
  }>
}

function AlternativeRoutesCell({ 
  origin, 
  destination, 
  alternatives
}: AlternativeRoutesCellProps) {
  const [showAll, setShowAll] = useState(false)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (alternatives.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        No alternatives
      </div>
    )
  }

  // Sort alternatives: direct routes first, then by rate (lowest first)
  const sortedAlternatives = alternatives.sort((a, b) => {
    if (a.isDirect && !b.isDirect) return -1
    if (!a.isDirect && b.isDirect) return 1
    return a.rate - b.rate
  })

  // Limit displayed alternatives
  const displayLimit = 8
  const shouldShowMore = sortedAlternatives.length > displayLimit
  const displayedAlternatives = showAll ? sortedAlternatives : sortedAlternatives.slice(0, displayLimit)

  // Create comma-separated route string
  const routeString = displayedAlternatives.map(alt => alt.route).join(', ')
  const totalCount = sortedAlternatives.length

  return (
    <div className="space-y-1 w-48">
      {/* Route display */}
      <div className="text-xs">
        <span className="font-mono text-gray-700 break-words whitespace-normal">
          {routeString}
          {shouldShowMore && !showAll && `, ...`}
        </span>
      </div>

      {/* Show more/less button */}
      {shouldShowMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="h-5 text-xs p-1"
        >
          {showAll ? 'Show Less' : `Show All (${totalCount})`}
        </Button>
      )}

      {/* Rate summary */}
      {/* {sortedAlternatives.length > 0 && (
        <div className="text-xs text-gray-500">
          Best: {formatCurrency(Math.min(...sortedAlternatives.map(a => a.rate)))}
          {sortedAlternatives.filter(a => a.isDirect).length > 0 && (
            <span className="ml-2 text-blue-600">
              • Direct: {sortedAlternatives.filter(a => a.isDirect).length}
            </span>
          )}
        </div>
      )} */}
    </div>
  )
}

interface SectorRateTableProps {
  sectorRates: SectorRate[]
  flights: Flight[]
  loading: boolean
  sectorRateSearchTerm: string
  setSectorRateSearchTerm: (term: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void
  togglingStatus: Set<string>
  onToggleSectorRate: (id: string) => void
  onEditSectorRate: (sectorRate: SectorRate) => void
  onDeleteSectorRate: (sectorRate: SectorRate) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function SectorRateTable({
  sectorRates,
  flights,
  loading,
  sectorRateSearchTerm,
  setSectorRateSearchTerm,
  statusFilter,
  setStatusFilter,
  togglingStatus,
  onToggleSectorRate,
  onEditSectorRate,
  onDeleteSectorRate,
  onRefresh,
  isRefreshing
}: SectorRateTableProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortField, setSortField] = useState<'origin' | 'destination' | 'sectorRate' | 'flightPreview'>('origin')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Get flights for a specific route
  const getFlightsForRoute = (origin: string, destination: string): Flight[] => {
    return flights.filter(flight => 
      flight.origin === origin && 
      flight.destination === destination && 
      flight.is_active
    )
  }

  // Get flight numbers as a string for display
  const getFlightNumbersForRoute = (origin: string, destination: string): string => {
    const routeFlights = getFlightsForRoute(origin, destination)
    if (routeFlights.length === 0) {
      return 'No flights'
    }
    if (routeFlights.length === 1) {
      return routeFlights[0].flightNumber
    }
    return routeFlights.map(flight => flight.flightNumber).join(', ')
  }

  // Find alternative routes for a given origin and destination
  const getAlternativeRoutes = (origin: string, destination: string): Array<{
    route: string
    rate: number
    isDirect: boolean
  }> => {
    const alternatives: Array<{
      route: string
      rate: number
      isDirect: boolean
    }> = []

    // First, check if there's a direct route with a sector rate
    const directSectorRate = sectorRates.find(sr => 
      sr.origin === origin && 
      sr.destination === destination && 
      sr.is_active
    )
    
    if (directSectorRate) {
      alternatives.push({
        route: `${origin} → ${destination}`,
        rate: directSectorRate.sector_rate,
        isDirect: true
      })
    }

    // Find all sector rates that start from the origin (like FRA -> RIX, FRA -> IST)
    const originRates = sectorRates.filter(sr => 
      sr.origin === origin && sr.is_active
    )

    // Find all sector rates that end at the destination (like RMO -> DXB, IST -> DXB)
    const destinationRates = sectorRates.filter(sr => 
      sr.destination === destination && sr.is_active
    )

    // Add all origin rates (excluding the direct route if it exists)
    originRates.forEach(rate => {
      if (!(rate.origin === origin && rate.destination === destination)) {
        alternatives.push({
          route: `${rate.origin} → ${rate.destination}`,
          rate: rate.sector_rate,
          isDirect: false
        })
      }
    })

    // Add all destination rates (excluding the direct route if it exists)
    destinationRates.forEach(rate => {
      if (!(rate.origin === origin && rate.destination === destination)) {
        alternatives.push({
          route: `${rate.origin} → ${rate.destination}`,
          rate: rate.sector_rate,
          isDirect: false
        })
      }
    })

    // Remove duplicates based on route string
    const uniqueAlternatives = alternatives.filter((alternative, index, self) => 
      index === self.findIndex(a => a.route === alternative.route)
    )

    return uniqueAlternatives.sort((a, b) => a.rate - b.rate) // Sort by rate ascending
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(sectorRateSearchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [sectorRateSearchTerm])

  // Memoized filtered sector rates for better performance
  const filteredSectorRates = useMemo(() => {
    return sectorRates
      .filter(sectorRate => {
        // Search filter
        const flightNumbers = getFlightNumbersForRoute(sectorRate.origin, sectorRate.destination)
        const matchesSearch = sectorRate.origin.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          sectorRate.destination.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          flightNumbers.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'active' && sectorRate.is_active) ||
          (statusFilter === 'inactive' && !sectorRate.is_active)
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0
        
        switch (sortField) {
          case 'origin':
            comparison = a.origin.localeCompare(b.origin)
            break
          case 'destination':
            comparison = a.destination.localeCompare(b.destination)
            break
          case 'sectorRate':
            comparison = a.sector_rate - b.sector_rate
            break
          case 'flightPreview':
            const aPreview = getFlightNumbersForRoute(a.origin, a.destination)
            const bPreview = getFlightNumbersForRoute(b.origin, b.destination)
            comparison = aPreview.localeCompare(bPreview)
            break
          default:
            comparison = a.origin.localeCompare(b.origin)
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [sectorRates, debouncedSearchTerm, statusFilter, sortOrder, sortField, flights])

  // Memoized pagination logic
  const paginationData = useMemo(() => {
    const totalItems = filteredSectorRates.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const currentPageData = filteredSectorRates.slice(startIndex, endIndex)
    
    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentPageData
    }
  }, [filteredSectorRates, currentPage, itemsPerPage])

  const handleSortToggle = (field: 'origin' | 'destination' | 'sectorRate' | 'flightPreview') => {
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
      {/* Search Controls - Hidden for now */}
      {/* <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search sector rates by origin, destination, or flight numbers..."
            value={sectorRateSearchTerm}
            onChange={(e) => setSectorRateSearchTerm(e.target.value)}
            className="w-full pr-8"
          />
          {sectorRateSearchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div> */}
      
      {/* Results Summary */}
      {paginationData.totalItems > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          Showing {paginationData.totalItems} sector rate{paginationData.totalItems !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` (${statusFilter} only)`}
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
              <TableHead className="h-8 py-1 text-xs">Status</TableHead>
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
              <TableHead className="h-8 py-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSortToggle('sectorRate')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Rate
                  {sortField === 'sectorRate' && (
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
                  onClick={() => handleSortToggle('flightPreview')}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Flight
                  {sortField === 'flightPreview' && (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 ml-1" />
                    )
                  )}
                </Button>
              </TableHead>
              <TableHead className="h-8 py-1 text-xs">Customer</TableHead>
              <TableHead className="h-8 py-1 text-xs">Origin OE</TableHead>
              <TableHead className="h-8 py-1 text-xs">Destination OE</TableHead>
              <TableHead className="h-8 py-1 text-xs">Alternative Routes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginationData.currentPageData.map((sectorRate) => (
              <TableRow key={sectorRate.id} className="">
                <TableCell className="py-1 px-2">
                  <div className="flex gap-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditSectorRate(sectorRate)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteSectorRate(sectorRate)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-1">
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <Switch
                        checked={sectorRate.is_active}
                        onCheckedChange={() => onToggleSectorRate(sectorRate.id)}
                        disabled={togglingStatus.has(sectorRate.id)}
                        className="scale-75"
                      />
                      {togglingStatus.has(sectorRate.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      sectorRate.is_active ? "text-green-600" : "text-gray-400"
                    )}>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {sectorRate.origin}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {sectorRate.destination}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div>
                    <p className="font-medium text-black text-sm leading-tight">{formatCurrency(sectorRate.sector_rate)}</p>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {getFlightNumbersForRoute(sectorRate.origin, sectorRate.destination)}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="text-xs">
                    {sectorRate.customer ? (
                      <span className="text-blue-600 font-medium">{sectorRate.customer}</span>
                    ) : (
                      <span className="text-gray-400">No customer</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="text-xs">
                    {sectorRate.origin_oe ? (
                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5 text-green-600">
                        {sectorRate.origin_oe}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="text-xs">
                    {sectorRate.destination_oe ? (
                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5 text-green-600">
                        {sectorRate.destination_oe}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <AlternativeRoutesCell 
                    origin={sectorRate.origin}
                    destination={sectorRate.destination}
                    alternatives={getAlternativeRoutes(sectorRate.origin, sectorRate.destination)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {paginationData.totalItems > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
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
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                disabled={currentPage >= paginationData.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
