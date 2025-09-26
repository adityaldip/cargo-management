"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Eye } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { useDataStore } from "@/store/data-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useReviewTabStore } from "@/store/review-tab-store"
import { useColumnMappingStore } from "@/store/column-mapping-store"
import { useToast } from "@/hooks/use-toast"
import type { ProcessedData } from "@/types/cargo-data"
import { ConfigureColumns, DatabasePreview } from "./assign-custom-modules"
import { UploadExcel, UpdateMapping } from "./update-excel-modules"

interface ReviewMergedExcelProps {
  mailAgentData: ProcessedData | null
  mailSystemData: ProcessedData | null
  onMergedData: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  // Review tab store for persistence
  const { activeTab, setActiveTab } = useReviewTabStore()
  
  // Data store
  const { clearAllData } = useDataStore()
  
  // Workflow store
  const { isClearingData, isExporting, isBulkDeleting, isMappingAndSaving } = useWorkflowStore()
  
  // Toast for notifications
  const { toast } = useToast()
  
  // State for uploaded data
  const [uploadedData, setUploadedData] = useState<ProcessedData | null>(null)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})
  
  // Load persisted data on component mount
  useEffect(() => {
    const { getUploadSession } = useDataStore.getState()
    const uploadSession = getUploadSession("upload-excel")
    if (uploadSession) {
      // Restore processed data
      if (uploadSession.processedData) {
        setUploadedData(uploadSession.processedData)
      }
      
      // Restore column mapping data
      if (uploadSession.excelColumns) {
        setExcelColumns(uploadSession.excelColumns)
      }
      if (uploadSession.sampleData) {
        setSampleData(uploadSession.sampleData)
      }
    }
  }, [])
  
  // Save data when it changes
  useEffect(() => {
    if (uploadedData || excelColumns.length > 0) {
      const { saveUploadSession } = useDataStore.getState()
      const sessionData = {
        fileName: "uploaded-file.xlsx", // This should come from the actual file
        processedData: uploadedData,
        excelColumns,
        sampleData,
        activeStep: "upload" as const,
        ignoreRules: [],
        timestamp: Date.now()
      }
      saveUploadSession("upload-excel", sessionData)
    }
  }, [uploadedData, excelColumns, sampleData])

  // Handle clear data
  const handleClearData = async () => {
    try {
      const result = await clearAllData(undefined, undefined)
      
      if (result.success) {
        // Toast is handled by database-preview component
      } else if (result.cancelled) {
        toast({
          title: "Process cancelled",
          description: "Clear data process was cancelled by user",
          variant: "destructive",
          duration: 3000,
        })
      } else {
        toast({
          title: "Failed to clear data",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: "Error clearing data",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  useEffect(() => {
    if (mailAgentData || mailSystemData) {
      handleMergeData()
    }
  }, [mailAgentData, mailSystemData])

  const handleMergeData = async () => {
    if (!mailAgentData && !mailSystemData) return

    try {
      let combined: ProcessedData
      if (mailAgentData && mailSystemData) {
        combined = combineProcessedData([mailAgentData, mailSystemData])
      } else if (mailAgentData) {
        combined = mailAgentData
      } else {
        combined = mailSystemData!
      }

      onMergedData(combined)
    } catch (error) {
      // Error merging data
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header Navigation */}
      <div className="flex justify-between items-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "update-excel" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("update-excel")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "update-excel" ? "bg-black text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button
            variant={activeTab === "update-mapping" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("update-mapping")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "update-mapping" ? "bg-black text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Mapping
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("configure")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "configure" ? "bg-black text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "preview" ? "bg-black text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        {/* Continue Button */}
        {onContinue && (
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
            disabled={isClearingData || isExporting || isBulkDeleting || isMappingAndSaving}
          >
            Continue to Assign Customers
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* Upload Excel section */}
        {activeTab === "update-excel" && (
          <UploadExcel 
            onDataProcessed={(data) => {
              setUploadedData(data)
              if (data) {
                setActiveTab("update-mapping")
              }
            }}
            onColumnsExtracted={(columns, sampleData) => {
              setExcelColumns(columns)
              setSampleData(sampleData)
            }}
            onContinue={() => {
              // Continue from Upload Excel
            }}
          />
        )}

        {/* Update Mapping section */}
        {activeTab === "update-mapping" && (
          <div className="space-y-4">
            <UpdateMapping 
              excelColumns={excelColumns} 
              sampleData={sampleData} 
              onSupabaseProgress={(progress: any) => {
                // Supabase progress update
              }}
              onMappingComplete={async (mappings: any) => {
                
                // Import the necessary functions for processing
                const { processFileWithMappings } = await import('@/lib/file-processor')
                const { useDataStore } = await import('@/store/data-store')
                const { FileStorage } = await import('@/lib/file-storage')
                const { cargoDataOperations } = await import('@/lib/supabase-operations')
                const { combineProcessedData } = await import('@/lib/file-processor')
                
                // Get the uploaded file
                const uploadedFile = FileStorage.retrieveFile("upload-excel")
                if (!uploadedFile) {
                  throw new Error("Uploaded file not found")
                }
                
                // STEP 1: Process file with mappings ONLY (no database save yet)
                const result = await processFileWithMappings(
                  uploadedFile, 
                  "upload-excel", 
                  mappings, 
                  undefined, 
                  (progress, message, stats) => {
                    // Mapping processing progress
                  }
                )
                
                if (result.success && result.data) {
                  
                  // Create dataset to save
                  const dataset = {
                    id: `upload-excel-${Date.now()}`,
                    name: uploadedFile.name,
                    type: "upload-excel" as const,
                    data: result.data,
                    mappings,
                    timestamp: Date.now(),
                    fileName: uploadedFile.name
                  }
                  
                  // Save to data store
                  const { addDataset, updateCurrentSession } = useDataStore.getState()
                  addDataset(dataset)
                  updateCurrentSession({ uploadExcel: dataset })
                  
                  // Dataset created and stored locally
                  
                  // Notify UpdateMapping that mapping is complete
                  if ((window as any).supabaseProgressHandler) {
                    (window as any).supabaseProgressHandler({
                      percentage: 100,
                      currentCount: result.data.data.length,
                      totalCount: result.data.data.length,
                      currentBatch: 1,
                      totalBatches: 1,
                      status: 'mapping-complete' // New status to indicate mapping is done
                    })
                  }
                  
                  // Small delay to ensure mapping completion is processed
                  await new Promise(resolve => setTimeout(resolve, 500))
                  
                  // STEP 2: Now start database saving (after mapping is completely done)
                  
                  // Custom save function with real progress tracking
                  const saveWithProgress = async (dataset: any, onProgress: (progress: any) => void) => {
                    try {
                      
                      if (!dataset) {
                        return { success: false, error: "No dataset provided" }
                      }
                      
                      // Convert to Supabase format with error handling
                      const supabaseData = []
                      for (let i = 0; i < dataset.data.data.length; i++) {
                        try {
                          const converted = {
                            rec_id: String(dataset.data.data[i].recordId || dataset.data.data[i].id || '').substring(0, 100),
                            inb_flight_date: String(dataset.data.data[i].date || '').substring(0, 50),
                            outb_flight_date: String(dataset.data.data[i].outbDate || '').substring(0, 50),
                            des_no: String(dataset.data.data[i].desNo || '').substring(0, 20),
                            rec_numb: String(dataset.data.data[i].recNumb || '').substring(0, 10),
                            orig_oe: String(dataset.data.data[i].origOE || '').substring(0, 10),
                            dest_oe: String(dataset.data.data[i].destOE || '').substring(0, 10),
                            inb_flight_no: String(dataset.data.data[i].inbFlightNo || '').substring(0, 20),
                            outb_flight_no: String(dataset.data.data[i].outbFlightNo || '').substring(0, 20),
                            mail_cat: String(dataset.data.data[i].mailCat || '').substring(0, 5),
                            mail_class: String(dataset.data.data[i].mailClass || '').substring(0, 10),
                            total_kg: Number(dataset.data.data[i].totalKg) || 0,
                            invoice: String(dataset.data.data[i].invoiceExtend || '').substring(0, 50),
                            customer_name_number: dataset.data.data[i].customer ? String(dataset.data.data[i].customer).substring(0, 200) : null,
                            assigned_customer: null,
                            assigned_rate: dataset.data.data[i].totalEur ? Number(dataset.data.data[i].totalEur) : null,
                            rate_currency: dataset.data.data[i].totalEur ? 'EUR' : null,
                            processed_at: new Date().toISOString(),
                          }
                          supabaseData.push(converted)
                        } catch (conversionError) {
                          continue
                        }
                      }
                      
                      // Converted records for Supabase
                      
                      if (supabaseData.length === 0) {
                        return { success: false, error: "No valid records to save after conversion" }
                      }
                      
                      // Calculate batch information
                      const batchSize = 2000
                      const totalBatches = Math.ceil(supabaseData.length / batchSize)
                      
                      // Update progress with batch info
                      onProgress({
                        percentage: 0,
                        currentCount: 0,
                        totalCount: supabaseData.length,
                        currentBatch: 0,
                        totalBatches: totalBatches,
                        status: 'saving'
                      })
                      
                      // Save to Supabase in batches with progress updates
                      let totalSaved = 0
                      
                      for (let i = 0; i < supabaseData.length; i += batchSize) {
                        const batch = supabaseData.slice(i, i + batchSize)
                        const currentBatchNum = Math.floor(i/batchSize) + 1
                        
                        const batchResult = await cargoDataOperations.bulkInsert(batch)
                        
                        if (batchResult.error) {
                          onProgress({
                            percentage: Math.round((totalSaved / supabaseData.length) * 100),
                            currentCount: totalSaved,
                            totalCount: supabaseData.length,
                            currentBatch: currentBatchNum,
                            totalBatches: totalBatches,
                            status: 'error'
                          })
                          return { 
                            success: false, 
                            error: `Failed to save batch ${currentBatchNum}: ${batchResult.error}`,
                            savedCount: totalSaved 
                          }
                        }
                        
                        totalSaved += batch.length
                        
                        // Update progress
                        const percentage = Math.round((totalSaved / supabaseData.length) * 100)
                        onProgress({
                          percentage: percentage,
                          currentCount: totalSaved,
                          totalCount: supabaseData.length,
                          currentBatch: currentBatchNum,
                          totalBatches: totalBatches,
                          status: 'saving'
                        })
                        
                        // Small delay to allow UI updates
                        await new Promise(resolve => setTimeout(resolve, 100))
                      }
                      
                      // Mark as completed
                      onProgress({
                        percentage: 100,
                        currentCount: totalSaved,
                        totalCount: supabaseData.length,
                        currentBatch: totalBatches,
                        totalBatches: totalBatches,
                        status: 'completed'
                      })
                      
                      // Successfully saved records to Supabase
                      return { 
                        success: true, 
                        savedCount: totalSaved 
                      }
                    } catch (error) {
                      onProgress({
                        percentage: 0,
                        currentCount: 0,
                        totalCount: 0,
                        currentBatch: 0,
                        totalBatches: 0,
                        status: 'error'
                      })
                      return { 
                        success: false, 
                        error: error instanceof Error ? error.message : 'Unknown error occurred' 
                      }
                    }
                  }
                  
                  // Save to Supabase with progress tracking
                  try {
                    
                    const supabaseResult = await saveWithProgress(dataset, (progress) => {
                      // Update the progress in the UpdateMapping component
                      
                      // Use the progress handler if available
                      if ((window as any).supabaseProgressHandler) {
                        (window as any).supabaseProgressHandler(progress)
                      }
                    })
                    
                    if (supabaseResult.success) {
                      
                      // Update the progress with final success and record count
                      if ((window as any).supabaseProgressHandler) {
                        (window as any).supabaseProgressHandler({
                          percentage: 100,
                          currentCount: supabaseResult.savedCount || result.data.data.length,
                          totalCount: result.data.data.length,
                          currentBatch: 1,
                          totalBatches: 1,
                          status: 'completed'
                        })
                      }
                    } else {
                      throw new Error(`Supabase save failed: ${supabaseResult.error}`)
                    }
                  } catch (supabaseError) {
                    throw new Error(`Failed to save to database: ${supabaseError}`)
                  }
                  
                  // Automatically switch to configure columns tab when mapping is complete
                  setActiveTab("configure")
                } else {
                  throw new Error(result.error || "Failed to process file with mappings")
                }
              }}
              onCancel={() => {
                
                // Clear all store data when canceling
                const { clearAllColumnMappings } = useColumnMappingStore.getState()
                const { clearAllUploadSessions, clearCurrentSession, clearUploadSession } = useDataStore.getState()
                
                // Clear all column mappings
                clearAllColumnMappings()
                
                // Clear all upload sessions
                clearAllUploadSessions()
                
                // Clear current session
                clearCurrentSession()
                
                // Clear specific upload-excel session
                clearUploadSession("upload-excel")
                
                // Clear file storage
                const { FileStorage } = require('@/lib/file-storage')
                FileStorage.removeFile("upload-excel")
                
                // Reset component state
                setUploadedData(null)
                setExcelColumns([])
                setSampleData({})
                
                // All data cleared, going back to upload tab
                // Go back to upload tab
                setActiveTab("update-excel")
              }}
              dataSource="upload-excel"
              totalRows={uploadedData?.data.length}
            />
          </div>
        )}

        {/* Configure Columns section */}
        {activeTab === "configure" && (
          <ConfigureColumns 
            onSwitchToPreview={() => setActiveTab("preview")} 
            isImportMergeFlow={true}
          />
        )}

        {/* Database Preview section */}
        {activeTab === "preview" && (
          <DatabasePreview 
            key={`preview-${activeTab}`}
            onClearData={handleClearData}
          />
        )}
      </div>
    </div>
  )
}
