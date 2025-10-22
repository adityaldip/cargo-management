"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Swal from 'sweetalert2'

interface SectorRateV2 {
  id: string
  text_label: string | null
  origin_airport: string | null
  airbaltic_origin: string[] | null
  sector_rate: string | null
  airbaltic_destination: string[] | null
  final_destination: string | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PreviewData {
  id: string
  origin: string
  destination: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  finalDestination: string
  selectedSectorRate: SectorRateV2 | null
  created_at?: string
  updated_at?: string
}

export function PreviewV2() {
  const { toast } = useToast()
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [sectorRates, setSectorRates] = useState<SectorRateV2[]>([])
  const [loading, setLoading] = useState(false)

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    fetchPreviewData()
  }, [])

  const fetchSectorRates = async () => {
    try {
      setLoading(true)
      
      // Get sector rates first
      const { data: sectorRatesData, error: sectorRatesError } = await (supabase as any)
        .from('sector_rates_v2')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sectorRatesError) throw sectorRatesError

      // Get all customers
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')

      if (customersError) throw customersError

      // Merge the data manually
      const mergedData = sectorRatesData?.map((rate: any) => ({
        ...rate,
        customers: customersData?.find((customer: any) => customer.id === rate.customer_id) || null
      })) || []

      setSectorRates(mergedData)
    } catch (error) {
      console.error('Error fetching sector rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviewData = async () => {
    try {
      const response = await fetch('/api/preview-price-assignment')
      if (!response.ok) throw new Error('Failed to fetch preview data')
      
      const result = await response.json()
      const formattedData = result.data?.map((item: any) => ({
        id: item.id,
        origin: item.origin,
        destination: item.destination,
        beforeBT: item.before_bt || '',
        inbound: item.inbound || '',
        outbound: item.outbound || '',
        afterBT: item.after_bt || '',
        finalDestination: item.final_destination || '',
        selectedSectorRate: item.sector_rates_v2 ? {
          id: item.sector_rates_v2.id,
          text_label: item.sector_rates_v2.text_label,
          sector_rate: item.sector_rates_v2.sector_rate,
          customers: item.sector_rates_v2.customers
        } : null,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []
      
      setPreviewData(formattedData)
    } catch (error) {
      console.error('Error fetching preview data:', error)
    }
  }

  const handleSectorRateChange = (rowId: string, sectorRateId: string) => {
    // Update local state immediately for better UX
    const selectedRate = sectorRates.find(rate => rate.id === sectorRateId)
    setPreviewData(prev => 
      prev.map(row => 
        row.id === rowId 
          ? { ...row, selectedSectorRate: selectedRate || null }
          : row
      )
    )
    
    // Update in database
    handleUpdateSectorRate(rowId, sectorRateId)
  }

  const handleAddNewRow = async () => {
    try {
      const response = await fetch('/api/preview-price-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sector_rate_id: null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create record')
      }

      const result = await response.json()
      
      // Add the new record to local state
      const newRow: PreviewData = {
        id: result.data.id,
        origin: "",
        destination: "",
        beforeBT: "",
        inbound: "",
        outbound: "",
        afterBT: "",
        finalDestination: "",
        selectedSectorRate: null,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at
      }
      
      setPreviewData(prev => [newRow, ...prev])
      
      toast({
        title: "Success",
        description: "New record created successfully",
      })
    } catch (error) {
      console.error('Error creating record:', error)
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSectorRate = async (rowId: string, sectorRateId: string) => {
    try {
      const response = await fetch(`/api/preview-price-assignment/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sector_rate_id: sectorRateId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update record')
      }

      const result = await response.json()
      
      // Update local state
      setPreviewData(prev => 
        prev.map(row => 
          row.id === rowId 
            ? {
                ...row,
                selectedSectorRate: result.data.sector_rates_v2 ? {
                  id: result.data.sector_rates_v2.id,
                  text_label: result.data.sector_rates_v2.text_label,
                  origin_airport: result.data.sector_rates_v2.origin_airport,
                  airbaltic_origin: result.data.sector_rates_v2.airbaltic_origin,
                  sector_rate: result.data.sector_rates_v2.sector_rate,
                  airbaltic_destination: result.data.sector_rates_v2.airbaltic_destination,
                  final_destination: result.data.sector_rates_v2.final_destination,
                  customer_id: result.data.sector_rates_v2.customer_id,
                  customers: result.data.sector_rates_v2.customers,
                  is_active: result.data.sector_rates_v2.is_active,
                  created_at: result.data.sector_rates_v2.created_at,
                  updated_at: result.data.sector_rates_v2.updated_at
                } : null,
                updated_at: result.data.updated_at
              }
            : row
        )
      )
    } catch (error) {
      console.error('Error updating sector rate:', error)
      toast({
        title: "Error",
        description: "Failed to update sector rate",
        variant: "destructive",
      })
    }
  }


  // Skeleton component untuk loading state
  const SkeletonTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-10">
            <TableHead className="text-xs py-1 px-1 w-[200px]">Sector Rates</TableHead>
            <TableHead className="text-xs py-1 px-1 w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="h-10">
              <TableCell className="py-1 px-1 text-xs w-[300px]">
                <Skeleton className="h-10 w-full" />
              </TableCell>
              <TableCell className="py-1 px-1 w-[80px]">
                <div className="flex gap-1 justify-center">
                  <Skeleton className="h-6 w-6" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const handleDeleteWithConfirmation = async (id: string, origin: string, destination: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete this data`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        // Check if it's a temporary row (not saved to database yet)
        if (id.startsWith('temp-')) {
          const newData = previewData.filter(item => item.id !== id)
          setPreviewData(newData)
        } else {
          // Delete from database
          const response = await fetch(`/api/preview-price-assignment/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error('Failed to delete record')
          }

          // Update local state
          const newData = previewData.filter(item => item.id !== id)
          setPreviewData(newData)
        }

        toast({
          title: "Success",
          description: "Record has been deleted successfully",
        })
      } catch (error) {
        console.error('Error deleting record:', error)
        toast({
          title: "Error",
          description: "Failed to delete record",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card>
        <CardContent className="">
        <CardTitle>Flight Data Preview</CardTitle>
          <div className="w-full">
            <div className="flex justify-end items-center mb-1">
              <Button 
                onClick={handleAddNewRow}
                size="sm"
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
            
            {loading ? (
              <SkeletonTable />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-10">
                      <TableHead className="text-xs py-1 px-1 w-[200px]">Sector Rates</TableHead>
                      <TableHead className="text-xs py-1 px-1 w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row) => (
                      <TableRow key={row.id} className="h-10">
                        {/* Column 1: Sector Rates Dropdown */}
                        <TableCell className="py-1 px-1 text-xs w-[300px]">
                          <div className="">
                            <Select 
                              value={row.selectedSectorRate?.id || ""} 
                              onValueChange={(value) => handleSectorRateChange(row.id, value)}
                            >
                              <SelectTrigger className="h-10 text-xs px-3 py-2">
                                {row.selectedSectorRate ? (
                                  <div className="flex flex-col items-start w-full">
                                    <span className="font-medium text-sm">
                                      {row.selectedSectorRate.sector_rate || 'No Rate'} - {row.selectedSectorRate.text_label || 'No Label'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Customer: {row.selectedSectorRate.customers?.name || 'No Customer'}
                                    </span>
                                  </div>
                                ) : (
                                  <SelectValue placeholder="Select sector rate..." />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {sectorRates.map((rate) => (
                                  <SelectItem key={rate.id} value={rate.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">
                                        {rate.sector_rate || 'No Rate'} - {rate.text_label || 'No Label'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Customer: {rate.customers?.name || 'No Customer'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        
                        {/* Column 2: Actions */}
                        <TableCell className="py-1 px-1 w-[80px]">
                          <div className="flex gap-1 justify-center">
                            <Button
                              onClick={() => handleDeleteWithConfirmation(row.id, row.origin || 'Record', row.destination || '')}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
