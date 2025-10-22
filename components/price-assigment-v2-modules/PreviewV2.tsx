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
import { UploadTable } from "@/components/price-assignment-modules/UploadTable"

interface SectorRateV2 {
  id: string
  text_label: string | null
  origin_airport: string[] | null
  airbaltic_origin: string[] | null
  sector_rate: string | null
  airbaltic_destination: string[] | null
  final_destination: string[] | null
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

interface UploadData {
  origin: string
  destination: string
  inbound: string
  outbound: string
}

interface GeneratedData {
  id: string
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  selectedSectorRate: SectorRateV2 | null
  created_at?: string
  updated_at?: string
}

export function PreviewV2() {
  const { toast } = useToast()
  const [uploadData, setUploadData] = useState<UploadData[]>([
    {
      origin: "USFRAT",
      destination: "USRIXT",
      inbound: "BT234",
      outbound: ""
    },
    {
      origin: "USFRAT",
      destination: "USROMT",
      inbound: "BT234",
      outbound: "BT633"
    },
    {
      origin: "LTVNOA",
      destination: "CLSCLE",
      inbound: "BT965",
      outbound: "BT965"
    }
  ])
  const [generatedData, setGeneratedData] = useState<GeneratedData[]>([])
  const [sectorRates, setSectorRates] = useState<SectorRateV2[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(1)

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    generateSystemData()
  }, [uploadData, refreshTrigger])

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

  const generateSystemData = () => {
    // Generate system data based on upload data
    const generated = uploadData.map((item, index) => ({
      id: `generated-${index}`,
      origin: item.origin,
      beforeBT: item.origin === "USFRAT" ? "FRA → DUS" : "n/a",
      inbound: item.inbound ? `${item.inbound}, DUS → RIX` : "n/a",
      outbound: item.outbound || "n/a",
      afterBT: item.destination === "USRIXT" ? "n/a" : "(LGW → CVT)",
      destination: item.destination,
      selectedSectorRate: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    setGeneratedData(generated)
  }


  const handleSectorRateChange = (rowId: string, sectorRateId: string) => {
    // Update local state immediately for better UX
    const selectedRate = sectorRates.find(rate => rate.id === sectorRateId)
    setGeneratedData(prev => 
      prev.map(row => 
        row.id === rowId 
          ? { ...row, selectedSectorRate: selectedRate || null }
          : row
      )
    )
  }

  const handleAddNewRow = () => {
    const newRow: GeneratedData = {
      id: `generated-${Date.now()}`,
      origin: "NEW",
      beforeBT: "n/a",
      inbound: "n/a",
      outbound: "n/a",
      afterBT: "n/a",
      destination: "NEW",
      selectedSectorRate: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setGeneratedData(prev => [newRow, ...prev])
    
    toast({
      title: "Success",
      description: "New record created successfully",
    })
  }

  const handleUploadDataChange = (data: UploadData[]) => {
    setUploadData(data)
    // Trigger system data regeneration
    setRefreshTrigger(prev => prev + 1)
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
        // Update local state
        const newData = generatedData.filter(item => item.id !== id)
        setGeneratedData(newData)

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
                    {generatedData.map((row) => (
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
