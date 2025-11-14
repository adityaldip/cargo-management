"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SectorRateModal } from "./SectorRateModal"
import { SectorRateTable } from "./SectorRateTable"
import { 
  Plus, 
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

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

export function SectorRatesV3() {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sectorRates, setSectorRates] = useState<SectorRateV3[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [airportCodes, setAirportCodes] = useState<Array<{id: string, code: string, is_active: boolean}>>([])
  const [loadingAirports, setLoadingAirports] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState<SectorRateV3 | null>(null)

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    fetchAirportCodes()
  }, [])

  const fetchSectorRates = async () => {
    try {
      setLoading(true)
      
      // Get sector rates first
      const { data: sectorRatesData, error: sectorRatesError } = await (supabase as any)
        .from('sector_rates_v3')
        .select('*')
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
      toast({
        title: "Error",
        description: "Failed to fetch sector rates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAirportCodes = async () => {
    try {
      setLoadingAirports(true)
      const { data, error } = await (supabase as any)
        .from('airport_code')
        .select('id, code, is_active')
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (error) throw error
      setAirportCodes(data || [])
    } catch (error) {
      console.error('Error fetching airport codes:', error)
      toast({
        title: "Error",
        description: "Failed to fetch airport codes",
        variant: "destructive",
      })
    } finally {
      setLoadingAirports(false)
    }
  }


  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchSectorRates()
    setIsRefreshing(false)
    toast({
      title: "Data Refreshed",
      description: "Sector rates have been updated successfully",
    })
  }

  const handleToggleStatus = async (id: string) => {
    try {
      setUpdatingStatus(id)
      const rate = sectorRates.find(r => r.id === id)
      if (!rate) return

      const { error } = await (supabase as any)
        .from('sector_rates_v3')
        .update({ status: !rate.status })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setSectorRates(prev => 
        prev.map(r => 
          r.id === id ? { ...r, status: !r.status } : r
        )
      )

      toast({
        title: "Status Updated",
        description: "Sector rate status has been toggled",
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleEdit = (id: string) => {
    const rate = sectorRates.find(r => r.id === id)
    if (rate) {
      setEditingData(rate)
      setIsModalOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('sector_rates_v3')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setSectorRates(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting sector rate:', error)
      toast({
        title: "Error",
        description: "Failed to delete sector rate",
        variant: "destructive",
      })
    }
  }

  const handleAddNew = () => {
    setEditingData(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingData(null)
  }

  const handleSave = async (dataToSave: Partial<SectorRateV3>) => {
    try {
      setIsSaving(true)

      if (editingData) {
        // Update existing record
        const { data, error } = await (supabase as any)
          .from('sector_rates_v3')
          .update(dataToSave)
          .eq('id', editingData.id)
          .select(`
            *,
            customers (
              id,
              name,
              code
            )
          `)

        if (error) throw error

        // Update local state
        if (data && data[0]) {
          setSectorRates(prev => 
            prev.map(r => 
              r.id === editingData.id ? data[0] : r
            )
          )
        }

        toast({
          title: "Sector Rate Updated",
          description: `Sector rate "${dataToSave.label}" has been updated successfully`,
        })
      } else {
        // Insert new record
        const { data, error } = await (supabase as any)
          .from('sector_rates_v3')
          .insert([dataToSave])
          .select(`
            *,
            customers (
              id,
              name,
              code
            )
          `)

        if (error) throw error

        // Update local state
        if (data && data[0]) {
          setSectorRates(prev => [data[0], ...prev])
        }

        toast({
          title: "Sector Rate Created",
          description: `Sector rate "${dataToSave.label}" has been created successfully`,
        })
      }
      
      handleCloseModal()
    } catch (error) {
      console.error('Error saving sector rate:', error)
      toast({
        title: "Error",
        description: "Failed to save sector rate",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }


  // Filter data based on search and status
  const filteredSectorRates = sectorRates.filter(rate => {
    const matchesSearch = !searchTerm || 
      rate.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.customers?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.airbaltic_origin?.some(origin => origin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rate.airbaltic_destination?.some(dest => dest.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rate.transit_routes?.some(route => route.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rate.status) ||
      (statusFilter === 'inactive' && !rate.status)
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="bg-white border-gray-200 shadow-sm w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-black text-2xl font-bold">Sector Rate Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Showing {filteredSectorRates.length} of {sectorRates.length} sector rates</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddNew}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Sector Rate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="h-8 w-auto min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-4 flex gap-4">
            <Input
              placeholder="Search sector rates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <SectorRateTable
            sectorRates={filteredSectorRates}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            airportCodes={airportCodes}
            updatingStatus={updatingStatus}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <SectorRateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingData={editingData}
        isSaving={isSaving}
      />
    </div>
  )
}

