"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  DollarSign, 
  Plus,
  RefreshCw
} from "lucide-react"
import { SectorRate } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { SweetAlert } from "@/components/ui/sweet-alert"
import { useSectorRateData, useAirportCodeData, useFlightData } from "./hooks"
import { SectorRateModal } from "./SectorRateModal"
import { SectorRateTable } from "./SectorRateTable"

export function SectorRates() {
  const { toast } = useToast()
  const {
    sectorRates,
    loading,
    error,
    setError,
    toggleSectorRate,
    deleteSectorRate,
    createSectorRate,
    updateSectorRate,
    refetch
  } = useSectorRateData()
  
  const { airportCodes } = useAirportCodeData()
  const { flights } = useFlightData()
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sectorRateSearchTerm, setSectorRateSearchTerm] = useState("")
  const [selectedSectorRate, setSelectedSectorRate] = useState<SectorRate | null>(null)
  const [isSectorRateEditorOpen, setIsSectorRateEditorOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState<Set<string>>(new Set())
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [sectorRateToDelete, setSectorRateToDelete] = useState<SectorRate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // New sector rate form state
  const [newSectorRateForm, setNewSectorRateForm] = useState({
    origin: "",
    destination: "",
    originAirportId: "",
    destinationAirportId: "",
    sectorRate: "",
    customer: "",
    originOE: "",
    destinationOE: ""
  })

  const handleToggleSectorRate = async (sectorRateId: string) => {
    // Prevent multiple toggles on the same sector rate
    if (togglingStatus.has(sectorRateId)) {
      return
    }

    try {
      // Add to toggling set
      setTogglingStatus(prev => new Set(prev).add(sectorRateId))
      setError(null)
      
      const sectorRate = sectorRates.find(s => s.id === sectorRateId)
      await toggleSectorRate(sectorRateId)
      
      toast({
        title: "Status Updated",
        description: `Sector rate ${sectorRate?.origin} → ${sectorRate?.destination} is now ${sectorRate?.is_active ? 'inactive' : 'active'}`,
      })
    } catch (err) {
      const errorMsg = `Failed to toggle sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      // Remove from toggling set
      setTogglingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(sectorRateId)
        return newSet
      })
    }
  }

  const handleEditSectorRate = (sectorRate: SectorRate) => {
    setSelectedSectorRate(sectorRate)
    setIsSectorRateEditorOpen(true)
  }

  const handleDeleteSectorRate = (sectorRate: SectorRate) => {
    setSectorRateToDelete(sectorRate)
    setShowDeleteAlert(true)
  }


  const confirmDeleteSectorRate = async () => {
    if (!sectorRateToDelete) return

    setIsDeleting(true)
    try {
      await deleteSectorRate(sectorRateToDelete.id)
      
      toast({
        title: "Sector Rate Deleted",
        description: `Sector rate ${sectorRateToDelete.origin} → ${sectorRateToDelete.destination} has been deleted`,
      })
    } catch (err) {
      const errorMsg = `Failed to delete sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
      setSectorRateToDelete(null)
    }
  }

  const handleSaveSectorRate = async (sectorRateData: any) => {
    if (!sectorRateData.originAirportId || !sectorRateData.destinationAirportId || !sectorRateData.sectorRate) {
      setError('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const isEditing = selectedSectorRate !== null
      
      if (isEditing) {
        // Update existing sector rate
        const result = await updateSectorRate(selectedSectorRate.id, {
          origin: sectorRateData.origin,
          destination: sectorRateData.destination,
          origin_airport_id: sectorRateData.originAirportId,
          destination_airport_id: sectorRateData.destinationAirportId,
          sector_rate: sectorRateData.sectorRate,
          customer: sectorRateData.customer,
          origin_oe: sectorRateData.originOE,
          destination_oe: sectorRateData.destinationOE
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Sector Rate Updated",
            description: `Sector rate ${sectorRateData.origin} → ${sectorRateData.destination} has been updated successfully`,
          })
        } else {
          setError(result?.error || 'Failed to update sector rate')
          toast({
            title: "Error",
            description: result?.error || 'Failed to update sector rate',
            variant: "destructive",
          })
        }
      } else {
        // Create new sector rate
        const result = await createSectorRate({
          origin: sectorRateData.origin,
          destination: sectorRateData.destination,
          origin_airport_id: sectorRateData.originAirportId,
          destination_airport_id: sectorRateData.destinationAirportId,
          sector_rate: sectorRateData.sectorRate,
          customer: sectorRateData.customer,
          origin_oe: sectorRateData.originOE,
          destination_oe: sectorRateData.destinationOE
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Sector Rate Created",
            description: `Sector rate ${sectorRateData.origin} → ${sectorRateData.destination} has been created successfully`,
          })
        } else {
          setError(result?.error || 'Failed to create sector rate')
          toast({
            title: "Error",
            description: result?.error || 'Failed to create sector rate',
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error('Error saving sector rate:', err)
      setError('Failed to save sector rate')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateNewSectorRate = () => {
    setSelectedSectorRate(null)
    setNewSectorRateForm({
      origin: "",
      destination: "",
      originAirportId: "",
      destinationAirportId: "",
      sectorRate: "",
      customer: "",
      originOE: "",
      destinationOE: ""
    })
    setIsSectorRateEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewSectorRateForm({
      origin: "",
      destination: "",
      originAirportId: "",
      destinationAirportId: "",
      sectorRate: "",
      customer: "",
      originOE: "",
      destinationOE: ""
    })
    setSelectedSectorRate(null)
    setIsSectorRateEditorOpen(false)
    setError(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent>
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Error Display */}
      {error && (
        <ErrorBanner
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {/* Sector Rate Management */}
      <Card className="bg-white border-gray-200 shadow-sm w-full max-w-7xl">
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-black flex items-center gap-2">
              {/* <DollarSign className="h-5 w-5" /> */}
              Sector Rate Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNewSectorRate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sector Rate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
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

          {/* Sector Rates Table */}
            <SectorRateTable
              sectorRates={sectorRates}
              flights={flights}
              loading={loading}
              sectorRateSearchTerm={sectorRateSearchTerm}
              setSectorRateSearchTerm={setSectorRateSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              togglingStatus={togglingStatus}
              onToggleSectorRate={handleToggleSectorRate}
              onEditSectorRate={handleEditSectorRate}
              onDeleteSectorRate={handleDeleteSectorRate}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
        </CardContent>
      </Card>

      {/* Sector Rate Modal */}
      <SectorRateModal
        isOpen={isSectorRateEditorOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSectorRate}
        selectedSectorRate={selectedSectorRate}
        sectorRateForm={newSectorRateForm}
        setSectorRateForm={setNewSectorRateForm}
        isCreating={isCreating}
        error={error}
        airportCodes={airportCodes}
      />

      {/* Sweet Alert for Delete Confirmation */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Delete Sector Rate"
        text={`Are you sure you want to delete sector rate "${sectorRateToDelete?.origin} → ${sectorRateToDelete?.destination}"? This action cannot be undone.`}
        type="warning"
        showCancelButton={true}
        confirmButtonText="Yes, Delete!"
        cancelButtonText="Cancel"
        onConfirm={confirmDeleteSectorRate}
        onCancel={() => {
          setShowDeleteAlert(false)
          setSectorRateToDelete(null)
        }}
        onClose={() => {
          setShowDeleteAlert(false)
          setSectorRateToDelete(null)
        }}
        disabled={isDeleting}
      />
    </div>
  )
}
