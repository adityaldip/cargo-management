"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  MapPin, 
  Plus,
  RefreshCw,
  Edit,
  Trash2
} from "lucide-react"
import { AirportCode } from "./types"
import { AirportCodeModal } from "./AirportCodeModal"
import { useAirportCodeData } from "./hooks"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { SweetAlert } from "@/components/ui/sweet-alert"
import { AirportCodeTable } from "./AirportCodeTable"


export function AirportCodes() {
  const { toast } = useToast()
  const {
    airportCodes,
    loading,
    error,
    setError,
    toggleAirport,
    toggleEU,
    deleteAirport,
    createAirport,
    updateAirport,
    refetch
  } = useAirportCodeData()

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [airportSearchTerm, setAirportSearchTerm] = useState("")
  const [selectedAirport, setSelectedAirport] = useState<AirportCode | null>(null)
  const [isAirportEditorOpen, setIsAirportEditorOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState<Set<string>>(new Set())
  const [togglingEU, setTogglingEU] = useState<Set<string>>(new Set())
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [airportToDelete, setAirportToDelete] = useState<AirportCode | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // New airport form state
  const [newAirportForm, setNewAirportForm] = useState({
    code: "",
    isEU: false
  })

  // Remove the filteredAirportCodes logic as it's now handled in AirportCodeTable

  const handleToggleAirport = async (airportId: string) => {
    // Prevent multiple toggles on the same airport
    if (togglingStatus.has(airportId)) {
      return
    }

    try {
      // Add to toggling set
      setTogglingStatus(prev => new Set(prev).add(airportId))
      setError(null)
      
      const airport = airportCodes.find(a => a.id === airportId)
      await toggleAirport(airportId)
      
      toast({
        title: "Status Updated",
        description: `Airport ${airport?.code} is now ${airport?.is_active ? 'inactive' : 'active'}`,
      })
    } catch (err) {
      const errorMsg = `Failed to toggle airport: ${err instanceof Error ? err.message : 'Unknown error'}`
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
        newSet.delete(airportId)
        return newSet
      })
    }
  }

  const handleEditAirport = (airport: AirportCode) => {
    setSelectedAirport(airport)
    setNewAirportForm({
      code: airport.code,
      isEU: airport.is_eu
    })
    setIsAirportEditorOpen(true)
  }

  const handleToggleEU = async (airportId: string) => {
    // Prevent multiple toggles on the same airport
    if (togglingEU.has(airportId)) {
      return
    }

    try {
      // Add to toggling set
      setTogglingEU(prev => new Set(prev).add(airportId))
      setError(null)
      
      const airport = airportCodes.find(a => a.id === airportId)
      await toggleEU(airportId)
      
      toast({
        title: "EU Status Updated",
        description: `Airport ${airport?.code} is now ${airport?.is_eu ? 'Non-EU' : 'EU'}`,
      })
    } catch (err) {
      const errorMsg = `Failed to toggle EU status: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      // Remove from toggling set
      setTogglingEU(prev => {
        const newSet = new Set(prev)
        newSet.delete(airportId)
        return newSet
      })
    }
  }

  const handleDeleteAirport = (airport: AirportCode) => {
    setAirportToDelete(airport)
    setShowDeleteAlert(true)
  }

  const confirmDeleteAirport = async () => {
    if (!airportToDelete) return

    setIsDeleting(true)
    try {
      await deleteAirport(airportToDelete.id)
      
      toast({
        title: "Airport Deleted",
        description: `Airport ${airportToDelete.code} has been deleted`,
      })
    } catch (err) {
      const errorMsg = `Failed to delete airport: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
      setAirportToDelete(null)
    }
  }

  const handleSaveAirport = async (airportData: any) => {
    if (!airportData.code.trim()) {
      setError('Please fill in airport code')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const isEditing = selectedAirport !== null
      
      if (isEditing) {
        // Update existing airport
        const result = await updateAirport(selectedAirport.id, {
          code: airportData.code.trim(),
          is_eu: airportData.isEU
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Airport Updated",
            description: `Airport ${airportData.code} has been updated successfully`,
          })
        } else {
          setError(result?.error || 'Failed to update airport')
          toast({
            title: "Error",
            description: result?.error || 'Failed to update airport',
            variant: "destructive",
          })
        }
      } else {
        // Create new airport
        const result = await createAirport({
          code: airportData.code.trim(),
          is_eu: airportData.isEU
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Airport Created",
            description: `Airport ${airportData.code} has been created successfully`,
          })
        } else {
          setError(result?.error || 'Failed to create airport')
          toast({
            title: "Error",
            description: result?.error || 'Failed to create airport',
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error('Error saving airport:', err)
      setError('Failed to save airport')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateNewAirport = () => {
    setSelectedAirport(null)
    setNewAirportForm({
      code: "",
      isEU: false
    })
    setIsAirportEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewAirportForm({
      code: "",
      isEU: false
    })
    setSelectedAirport(null)
    setIsAirportEditorOpen(false)
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

      {/* Airport Codes Management */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-black flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Airport Codes Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNewAirport}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Airport Code
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

          
          {/* Airport Codes Table */}
          <AirportCodeTable
            airportCodes={airportCodes}
            loading={loading}
            airportSearchTerm={airportSearchTerm}
            setAirportSearchTerm={setAirportSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            togglingStatus={togglingStatus}
            togglingEU={togglingEU}
            onToggleAirport={handleToggleAirport}
            onToggleEU={handleToggleEU}
            onEditAirport={handleEditAirport}
            onDeleteAirport={handleDeleteAirport}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </CardContent>
      </Card>

      {/* Airport Modal */}
      <AirportCodeModal
        isOpen={isAirportEditorOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAirport}
        selectedAirport={selectedAirport}
        airportForm={newAirportForm}
        setAirportForm={setNewAirportForm}
        isCreating={isCreating}
        error={error}
      />

      {/* Sweet Alert for Delete Confirmation */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Delete Airport Code"
        text={`Are you sure you want to delete airport code "${airportToDelete?.code}"? This action cannot be undone.`}
        type="warning"
        showCancelButton={true}
        confirmButtonText="Yes, Delete!"
        cancelButtonText="Cancel"
        onConfirm={confirmDeleteAirport}
        onCancel={() => {
          setShowDeleteAlert(false)
          setAirportToDelete(null)
        }}
        onClose={() => {
          setShowDeleteAlert(false)
          setAirportToDelete(null)
        }}
        disabled={isDeleting}
      />
    </div>
  )
}
