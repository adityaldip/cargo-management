"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Edit,
  Trash2,
  ChevronDown
} from "lucide-react"
import Swal from 'sweetalert2'

interface SectorRateV3 {
  id: string
  status: boolean
  label: string | null
  airbaltic_origin: string[] | null
  airbaltic_destination: string[] | null
  sector_rate: number | null
  transit_routes: string[] | null
  transit_prices: number[] | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
  created_at: string
  updated_at: string
}

interface SectorRateTableProps {
  sectorRates: SectorRateV3[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  airportCodes: Array<{id: string, code: string, is_active: boolean}>
  updatingStatus?: string | null
}

export function SectorRateTable({ 
  sectorRates, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  airportCodes,
  updatingStatus
}: SectorRateTableProps) {
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(new Set())
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set())

  const toggleOriginExpansion = (id: string) => {
    setExpandedOrigins(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleDestinationExpansion = (id: string) => {
    setExpandedDestinations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleDeleteWithConfirmation = async (id: string, label: string | null) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${label || 'this sector rate'}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      onDelete(id)
      Swal.fire({
        title: 'Deleted!',
        text: 'Sector rate has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    }
  }

  const renderAirportArray = (airports: string[] | null, id: string, type: 'origin' | 'destination') => {
    if (!airports || airports.length === 0) return null
    
    const isExpanded = type === 'origin' ? expandedOrigins.has(id) : expandedDestinations.has(id)
    const toggleFunction = type === 'origin' ? toggleOriginExpansion : toggleDestinationExpansion
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex flex-wrap gap-1">
          {isExpanded ? (
            airports.map((airport, index) => (
              <span key={index} className="inline-block bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs">
                {airport}
              </span>
            ))
          ) : (
            <span className="inline-block bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs">
              {airports.length === 1 ? airports[0] : `${airports[0]} +${airports.length - 1}`}
            </span>
          )}
        </div>
        {airports.length > 1 && (
          <button
            onClick={() => toggleFunction(id)}
            className="ml-1 p-1 hover:bg-gray-200 rounded"
          >
            <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    )
  }

  const renderOriginAirport = (airports: string[] | null, id: string) => {
    if (!airports || airports.length === 0) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">no previous stop</span>
        </div>
      )
    }
    
    return renderAirportArray(airports, id, 'origin')
  }

  const renderFinalDestination = (destinations: string[] | null, id: string) => {
    if (!destinations || destinations.length === 0) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">no additional</span>
        </div>
      )
    }
    
    return renderAirportArray(destinations, id, 'destination')
  }


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
            <TableHead className="h-8 py-1 text-xs">Status</TableHead>
            <TableHead className="h-8 py-1 text-xs">Label</TableHead>
            <TableHead className="h-8 py-1 text-xs">AirBaltic Origin</TableHead>
            <TableHead className="h-8 py-1 text-xs">AirBaltic Destination</TableHead>
            <TableHead className="h-8 py-1 text-xs">Direct Sector Rate</TableHead>
            <TableHead className="h-8 py-1 text-xs">Transit Routes</TableHead>
            <TableHead className="h-8 py-1 text-xs">Transit Prices</TableHead>
            <TableHead className="h-8 py-1 text-xs">Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sectorRates.map((rate) => (
            <TableRow key={rate.id} className="">
              <TableCell className="py-1 px-2">
                <div className="flex gap-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(rate.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteWithConfirmation(rate.id, rate.label)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="py-1 px-1">
                <div className="flex items-center gap-2">
                  {updatingStatus === rate.id ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span className="text-xs text-gray-500">Updating...</span>
                    </div>
                  ) : (
                    <>
                      <Switch
                        checked={rate.status}
                        onCheckedChange={() => onToggleStatus(rate.id)}
                        className="data-[state=checked]:bg-green-500"
                        disabled={updatingStatus === rate.id}
                      />
                      <span className="text-xs text-gray-600">
                        {rate.status ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-1 px-2">
                <span className="text-sm">{rate.label || ""}</span>
              </TableCell>
              <TableCell className="py-1 px-2">
                {renderAirportArray(rate.airbaltic_origin, rate.id, 'origin')}
              </TableCell>
              <TableCell className="py-1 px-2">
                {renderAirportArray(rate.airbaltic_destination, rate.id, 'destination')}
              </TableCell>
              <TableCell className="py-1 px-2">
                <span className="text-sm font-medium">{rate.sector_rate ? `€${rate.sector_rate.toFixed(2)}` : ""}</span>
              </TableCell>
              <TableCell className="py-1 px-2">
                {renderAirportArray(rate.transit_routes, rate.id, 'destination')}
              </TableCell>
              <TableCell className="py-1 px-2">
                {rate.transit_prices && rate.transit_prices.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {rate.transit_prices.map((price, index) => (
                      <span key={index} className="inline-block bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs">
                        €{price.toFixed(2)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell className="py-1 px-2">
                <span className="text-sm">
                  {rate.customers ? rate.customers.name : rate.customer_id ? `Customer ID: ${rate.customer_id}` : "No customer"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

