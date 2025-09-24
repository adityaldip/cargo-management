"use client"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import type { ColumnMappingRule } from "@/lib/file-processor"
import { useColumnMappingLogic } from "@/hooks/use-column-mapping-logic"
import { useProgressTracking } from "@/hooks/use-progress-tracking"
import { useStoreManagement } from "@/hooks/use-store-management"
import { useMappingProgressHandler } from "@/hooks/use-mapping-progress-handler"
import { useToast } from "@/hooks/use-toast"
import { MappingTable } from "./MappingTable"
import { ProgressDisplay } from "./ProgressDisplay"
import { MappingSummary } from "./MappingSummary"

interface UpdateMappingProps {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  onMappingComplete: (mappings: ColumnMappingRule[]) => Promise<void>
  onCancel?: () => void
  dataSource: "upload-excel"
  totalRows?: number
  onSupabaseProgress?: (progress: any) => void
}

export function UpdateMapping({ excelColumns, sampleData, onMappingComplete, onCancel, dataSource, totalRows, onSupabaseProgress }: UpdateMappingProps) {
  console.log('🔄 UpdateMapping component rendered/remounted')
  const { toast } = useToast()
  
  // Custom hooks for modular functionality
  const {
    mappings,
    hasInitialized,
    isCompleted,
    setIsCompleted,
    handleMappingChange,
    getMappedCount,
    getTotalCount,
    getConflictCount,
    hasConflicts,
    clearAllData,
    resetClearedState
  } = useColumnMappingLogic({ excelColumns, sampleData, dataSource })
  
  const {
    isProcessing,
    processingProgress,
    supabaseProgress,
    showProcessingProgress,
    updateSupabaseProgress,
    resetProgress,
    setProcessing
  } = useProgressTracking()
  
  const { clearAllStores, setMappingAndSaving } = useStoreManagement()
  
  // Reset cleared state only when component mounts with new data (not on every change)
  useEffect(() => {
    // Only reset if we have new data and we're not in a cleared state
    if (excelColumns.length > 0 && !isCompleted) {
      resetClearedState()
    }
  }, [excelColumns.length, isCompleted])
  
  // Progress handler for mapping completion
  const { setupProgressHandler, cleanupProgressHandler } = useMappingProgressHandler({
    dataSource,
    onSupabaseProgress: (progress: any) => {
      // Update internal progress state
      updateSupabaseProgress(progress)
      // Also call external callback if provided
      if (onSupabaseProgress) {
        onSupabaseProgress(progress)
      }
    },
    onComplete: () => {
      console.log('🎯 onComplete called - starting clearing process')
      
      // Clear all data first (same as cancel button)
      clearAllData()
      cleanupProgressHandler()
      setMappingAndSaving(false)
      
      console.log('✅ onComplete finished - all clearing done')
      
      // Don't call setIsCompleted(true) here as it might trigger re-initialization
      // The clearAllData() already sets isCompleted to true internally
    },
    onError: () => {
      resetProgress()
      setProcessing(false)
    }
  })
  
  // Handle continue button click
  const handleContinue = async () => {
    if (hasConflicts()) {
      toast({
        title: "Mapping Conflicts Detected",
        description: "Please resolve mapping conflicts before continuing. Multiple Excel columns cannot be mapped to the same final column.",
        variant: "destructive",
      })
      return
    }
    
    if (mappings.length === 0) {
      toast({
        title: "No Mappings Available",
        description: "Upload Excel file first.",
        variant: "destructive",
      })
      return
    }
    
    setProcessing(true)
    updateSupabaseProgress({
      percentage: 0,
      currentCount: 0,
      totalCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      status: 'preparing'
    })
    
    // Set global mapping and saving state
    setMappingAndSaving(true)
    
    // Setup progress handler
    setupProgressHandler()
    
    try {
      // Show initial progress for "Preparing data..." step
      updateSupabaseProgress({
        status: 'preparing',
        percentage: 0
      })
      
      // Process mapping first, then database save (sequential, not concurrent)
      const mappingPromise = onMappingComplete(mappings)
      const progressPromise = showProcessingProgress(mappingPromise)
      
      // Wait for mapping to complete first
      await progressPromise
      
      // Add a small delay to show the 100% completion
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Update Supabase progress to show saving
      updateSupabaseProgress({
        status: 'saving',
        percentage: 0
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process column mappings"
      updateSupabaseProgress({
        status: 'error'
      })
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      cleanupProgressHandler()
      setMappingAndSaving(false)
      setIsCompleted(true)
    } finally {
      setProcessing(false)
      
      // Reset Supabase progress after a delay
      setTimeout(() => {
        resetProgress()
      }, 2000)
    }
  }

  const handleCancel = () => {
    console.log('🚫 Cancel button clicked - starting clearing process')
    clearAllData()
    cleanupProgressHandler()
    setMappingAndSaving(false)
    console.log('✅ Cancel button - all clearing done')
    onCancel?.()
  }

  return (
    <div className="space-y-1 pt-1 max-w-xl mx-auto">
      {/* Single Card with All Components */}
      <Card className="bg-white border-gray-200 shadow-sm" style={{ paddingBottom: "8px", paddingTop: "8px" }}>
        <CardContent className="space-y-1">
          <CardTitle className="text-lg">Update Column Mapping</CardTitle>
          
          {/* Mapping Summary */}
          <MappingSummary
            mappedCount={getMappedCount()}
            totalCount={getTotalCount()}
            conflictCount={getConflictCount()}
            hasConflicts={hasConflicts()}
            totalRows={totalRows}
          />

          {/* Progress Display */}
          <ProgressDisplay
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            supabaseProgress={supabaseProgress}
          />
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pb-2">
            <div>
              {onCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isProcessing}>
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Column Mapping?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel? This will reset the upload and return to the upload step. All mapping progress will be lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Continue Mapping</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                        Yes, Cancel and Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={handleContinue}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Continue to Next Step'}
            </Button>
          </div>

          {/* Column Mapping Table */}
          <MappingTable
            mappings={mappings}
            onMappingChange={handleMappingChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
