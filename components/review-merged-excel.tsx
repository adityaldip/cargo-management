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
      console.log('Restoring upload session:', uploadSession)
      
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
      console.log('Saved upload session:', sessionData)
    }
  }, [uploadedData, excelColumns, sampleData])

  // Handle clear data
  const handleClearData = async () => {
    console.log('🔍 handleClearData called in review-merged-excel')
    try {
      const result = await clearAllData(undefined, undefined)
      
      if (result.success) {
        console.log(`result`, result)
        console.log(`✅ Successfully cleared all data:`)
        console.log(`- Local storage: ${result.localCleared ? 'cleared' : 'failed'}`)
        console.log(`- Supabase: ${result.supabaseDeletedCount || 0} records deleted`)
        
        // Toast is handled by database-preview component
      } else if (result.cancelled) {
        console.log('❌ Clear data process was cancelled')
        toast({
          title: "Process cancelled",
          description: "Clear data process was cancelled by user",
          variant: "destructive",
          duration: 3000,
        })
      } else {
        console.error('❌ Failed to clear all data:', result.error)
        toast({
          title: "Failed to clear data",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('❌ Error during clear operation:', error)
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
      console.error("Error merging data:", error)
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
            className={activeTab === "update-excel" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button
            variant={activeTab === "update-mapping" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("update-mapping")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "update-mapping" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Mapping
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("configure")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "configure" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            disabled={isClearingData || isExporting || isMappingAndSaving}
            className={activeTab === "preview" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
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
              console.log('Uploaded Excel data:', data)
              setUploadedData(data)
              if (data) {
                setActiveTab("update-mapping")
              }
            }}
            onColumnsExtracted={(columns, sampleData) => {
              console.log('Extracted columns:', columns)
              console.log('Sample data:', sampleData)
              setExcelColumns(columns)
              setSampleData(sampleData)
            }}
            onContinue={() => {
              console.log('Continue from Upload Excel')
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
                console.log('Supabase progress update:', progress)
              }}
              onMappingComplete={async (mappings: any) => {
                console.log('Processing mappings:', mappings)
                
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
                console.log('STEP 1: Processing file with mappings...')
                const result = await processFileWithMappings(
                  uploadedFile, 
                  "upload-excel", 
                  mappings, 
                  undefined, 
                  (progress, message, stats) => {
                    console.log('Mapping processing progress:', progress, message, stats)
                  }
                )
                
                if (result.success && result.data) {
                  console.log('✅ STEP 1 COMPLETE: Mapping processing successful:', result.data)
                  
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
                  
                  console.log('✅ STEP 1 COMPLETE: Dataset created and stored locally')
                  
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
                  console.log('STEP 2: Starting database save process...')
                  
                  // Custom save function with real progress tracking
                  const saveWithProgress = async (dataset: any, onProgress: (progress: any) => void) => {
                    try {
                      console.log('Starting Supabase save process with progress tracking...')
                      
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
                          console.error(`Error converting record ${i}:`, conversionError, dataset.data.data[i])
                          continue
                        }
                      }
                      
                      console.log(`Converted ${supabaseData.length} records for Supabase`)
                      
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
                        
                        console.log(`Saving batch ${currentBatchNum}/${totalBatches} (${batch.length} records)`)
                        
                        const batchResult = await cargoDataOperations.bulkInsert(batch)
                        
                        if (batchResult.error) {
                          console.error('Error saving batch to Supabase:', batchResult.error)
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
                        
                        console.log(`Successfully saved batch. Total saved so far: ${totalSaved}`)
                        
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
                      
                      console.log(`Successfully saved ${totalSaved} records to Supabase`)
                      return { 
                        success: true, 
                        savedCount: totalSaved 
                      }
                    } catch (error) {
                      console.error('Error saving merged data to Supabase:', error)
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
                    console.log('Saving to Supabase...', dataset)
                    console.log(`📊 Saving ${result.data.data.length} records to database...`)
                    
                    const supabaseResult = await saveWithProgress(dataset, (progress) => {
                      // Update the progress in the UpdateMapping component
                      console.log('Supabase save progress:', progress)
                      
                      // Use the progress handler if available
                      if ((window as any).supabaseProgressHandler) {
                        (window as any).supabaseProgressHandler(progress)
                      }
                    })
                    
                    if (supabaseResult.success) {
                      console.log('✅ Data saved to Supabase successfully:', supabaseResult)
                      console.log(`📊 Successfully saved ${supabaseResult.savedCount || result.data.data.length} records to database`)
                      
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
                      console.error('❌ Failed to save to Supabase:', supabaseResult.error)
                      throw new Error(`Supabase save failed: ${supabaseResult.error}`)
                    }
                  } catch (supabaseError) {
                    console.error('❌ Supabase save error:', supabaseError)
                    throw new Error(`Failed to save to database: ${supabaseError}`)
                  }
                  
                  // Automatically switch to configure columns tab when mapping is complete
                  setActiveTab("configure")
                } else {
                  throw new Error(result.error || "Failed to process file with mappings")
                }
              }}
              onCancel={() => {
                console.log('Cancel update mapping - clearing all data...')
                
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
                
                console.log('All data cleared, going back to upload tab')
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
