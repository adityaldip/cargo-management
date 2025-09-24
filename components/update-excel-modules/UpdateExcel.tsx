"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile, getExcelColumns, getExcelSampleData, processFileWithMappings, type ColumnMappingRule } from "@/lib/file-processor"
import { useDataStore } from "@/store/data-store"
import { usePageFilters } from "@/store/filter-store"
import { useIgnoreRulesStore } from "@/store/ignore-rules-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useColumnMappingStore } from "@/store/column-mapping-store"
import { useToast } from "@/hooks/use-toast"
import type { ProcessedData } from "@/types/cargo-data"
import type { ProgressStats } from "@/types/import-components"
import { FileStorage } from "@/lib/file-storage"
import { StorageMonitor } from "../ui/storage-monitor"

interface UploadExcelProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onColumnsExtracted?: (columns: string[], sampleData: Record<string, string[]>) => void
  onContinue?: () => void
}

export function UploadExcel({ onDataProcessed, onColumnsExtracted, onContinue }: UploadExcelProps) {
  const { 
    addDataset, 
    generateDatasetId, 
    updateCurrentSession, 
    saveUploadSession, 
    getUploadSession, 
    clearUploadSession,
    shouldTriggerSupabaseSave,
    saveMergedDataToSupabase
  } = useDataStore()
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [isFileProcessing, setIsFileProcessing] = useState(false)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    currentRow: 0,
    totalRows: 0,
    processedRows: 0
  })
  
  // Load persisted data on component mount
  React.useEffect(() => {
    const uploadSession = getUploadSession("upload-excel")
    if (uploadSession) {
      // Try to restore the actual file from storage
      const storedFile = FileStorage.retrieveFile("upload-excel")
      if (storedFile) {
        setUploadedFile(storedFile)
      }
      
      // Restore processed data
      if (uploadSession.processedData) {
        setProcessedData(uploadSession.processedData)
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
  
  // Filter store for resetting filters on new upload
  const { clearFilters } = usePageFilters("review-merged-excel")
  
  // Ignore rules store for targeted reset
  const { resetMailAgentRules } = useIgnoreRulesStore()
  
  // Column mapping store for persistence
  const { clearColumnMapping } = useColumnMappingStore()
  
  // Workflow store for global processing state
  const { setIsProcessing: setGlobalProcessing } = useWorkflowStore()
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Save session data whenever relevant state changes
  React.useEffect(() => {
    if (uploadedFile || processedData || excelColumns.length > 0) {
      const saveSessionAsync = async () => {
        try {
          const { safeLocalStorageSetItem } = await import('@/lib/storage-utils')
          const sessionData = {
            fileName: uploadedFile?.name || null,
            processedData,
            excelColumns,
            sampleData,
            timestamp: Date.now()
          }
          
          const result = await safeLocalStorageSetItem(
            'cargo-upload-sessions',
            JSON.stringify({ "upload-excel": sessionData }),
            (strategy, description, itemsRemoved) => {
              console.log(`Storage cleanup: ${description} - ${itemsRemoved} items removed`)
            }
          )
          
          if (!result.success) {
            toast({
              title: "Storage Warning",
              description: result.error || "Unable to save session data. Your work will continue but may not persist if you refresh the page.",
              variant: "destructive",
              duration: 7000,
            })
            
            if (result.cleanupPerformed) {
              toast({
                title: "Storage Cleanup Performed",
                description: "Old data was automatically cleaned up to make space for your current session.",
                duration: 5000,
              })
            }
          }
        } catch (error) {
          console.error('Error in session save:', error)
          toast({
            title: "Storage Warning",
            description: "Local storage is experiencing issues. Some session data may not be saved, but your work will continue normally.",
            variant: "destructive",
            duration: 5000,
          })
        }
      }
      
      saveSessionAsync()
    }
  }, [uploadedFile, processedData, excelColumns, sampleData, toast])

  // Auto-hide progress bar when reaching 100%
  React.useEffect(() => {
    if (uploadProgress === 100 && isFileProcessing) {
      const timer = setTimeout(() => {
        setShowProgressBar(false)
        setUploadProgress(0)
        setProgressMessage("")
        setProgressStats({
          currentRow: 0,
          totalRows: 0,
          processedRows: 0
        })
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [uploadProgress, isFileProcessing])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      
      // Reset filters when new file is uploaded
      clearFilters()
      
      // Reset ignore rules for update excel only (targeted reset)
      resetMailAgentRules()
      
      // Clear column mapping for upload excel
      clearColumnMapping("upload-excel")
      
      // Automatically process the file
      setIsProcessing(true)
      setError(null)

      try {
        // Get columns and sample data first
        const columns = await getExcelColumns(file)
        const samples = await getExcelSampleData(file, 3)

        if (columns.length === 0) {
          setError("No columns found in file")
          return
        }

        setExcelColumns(columns)
        setSampleData(samples)
        
        // Notify parent component about extracted columns
        onColumnsExtracted?.(columns, samples)

        // Process the file for data validation
        setIsFileProcessing(true)
        setShowProgressBar(true)
        setGlobalProcessing(true)
        const result = await processFile(file, "upload-excel", undefined, (progress, message, stats) => {
          setUploadProgress(progress)
          setProgressMessage(message)
          if (stats) {
            setProgressStats({
              currentRow: stats.currentRow,
              totalRows: stats.totalRows,
              processedRows: stats.processedRows
            })
          } else if (progress > 0) {
            const estimatedTotal = 1000
            setProgressStats({
              currentRow: Math.round((progress / 100) * estimatedTotal),
              totalRows: estimatedTotal,
              processedRows: Math.round((progress / 100) * estimatedTotal)
            })
          }
        })
        if (result.success && result.data) {
          setProcessedData(result.data)
          
          // Store file data immediately after successful upload for persistence
          const fileStored = await FileStorage.storeFile(file, "upload-excel")
          if (!fileStored) {
            console.warn('Could not store file data for persistence')
          }
          
          // Show success toast with row count
          const rowCount = result.data.data.length
          toast({
            title: "Upload Successful!",
            description: `${rowCount} rows of data uploaded`,
            duration: 3000,
          })
          
          // Notify parent component
          onDataProcessed(result.data)
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
        setIsFileProcessing(false)
        setGlobalProcessing(false)
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      // Reset filters when new file is uploaded
      clearFilters()
      
      // Reset ignore rules for upload excel only (targeted reset)
      resetMailAgentRules()
      
      // Clear column mapping for upload excel
      clearColumnMapping("upload-excel")
      
      // Automatically process the file and go to map headers
      setIsProcessing(true)
      setError(null)

      try {
        // Get columns and sample data first
        const columns = await getExcelColumns(file)
        const samples = await getExcelSampleData(file, 3)

        if (columns.length === 0) {
          setError("No columns found in file")
          return
        }

        setExcelColumns(columns)
        setSampleData(samples)
        
        // Notify parent component about extracted columns
        onColumnsExtracted?.(columns, samples)

        // Process the file for data validation
        setIsFileProcessing(true)
        setShowProgressBar(true)
        setGlobalProcessing(true)
        const result = await processFile(file, "upload-excel", undefined, (progress, message, stats) => {
          setUploadProgress(progress)
          setProgressMessage(message)
          if (stats) {
            setProgressStats({
              currentRow: stats.currentRow,
              totalRows: stats.totalRows,
              processedRows: stats.processedRows
            })
          } else if (progress > 0) {
            const estimatedTotal = 1000
            setProgressStats({
              currentRow: Math.round((progress / 100) * estimatedTotal),
              totalRows: estimatedTotal,
              processedRows: Math.round((progress / 100) * estimatedTotal)
            })
          }
        })
        if (result.success && result.data) {
          setProcessedData(result.data)
          
          // Store file data immediately after successful upload for persistence
          const fileStored = await FileStorage.storeFile(file, "upload-excel")
          if (!fileStored) {
            console.warn('Could not store file data for persistence')
          }
          
          // Show success toast with row count
          const rowCount = result.data.data.length
          toast({
            title: "Upload Successful!",
            description: `${rowCount} rows of data uploaded`,
            duration: 3000,
          })
          
          // Notify parent component
          onDataProcessed(result.data)
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
        setIsFileProcessing(false)
        setGlobalProcessing(false)
      }
    }
  }

  const handleMappingComplete = async (mappings: ColumnMappingRule[]) => {
    if (!uploadedFile) {
      toast({
        title: "File Required",
        description: "Please upload a file to continue processing.",
        variant: "destructive",
      })
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Process file with user's column mappings
      setIsFileProcessing(true)
      setShowProgressBar(true)
      setGlobalProcessing(true)
      const result = await processFileWithMappings(uploadedFile, "upload-excel", mappings, undefined, (progress, message, stats) => {
        setUploadProgress(progress)
        setProgressMessage(message)
        
        if (stats) {
          setProgressStats({
            currentRow: stats.currentRow,
            totalRows: stats.totalRows,
            processedRows: stats.processedRows
          })
        } else if (progress > 0) {
          const estimatedTotal = 1000
          setProgressStats({
            currentRow: Math.round((progress / 100) * estimatedTotal),
            totalRows: estimatedTotal,
            processedRows: Math.round((progress / 100) * estimatedTotal)
          })
        }
      })
      
      if (result.success && result.data) {
        // Create dataset to save
        const dataset = {
          id: generateDatasetId(),
          name: uploadedFile.name,
          type: "upload-excel" as const,
          data: result.data,
          mappings,
          timestamp: Date.now(),
          fileName: uploadedFile.name
        }
        
        // Save to data store
        addDataset(dataset)
        
        // Update current session
        updateCurrentSession({ uploadExcel: dataset })
        
        // Don't save to Supabase here - let UpdateMapping handle the final save
        console.log('File processed successfully, ready for mapping step')
        
        // Update component state
        setProcessedData(result.data)
        onDataProcessed(result.data)
        
        // Show success toast
        toast({
          title: "Processing Complete",
          description: "File processed successfully with column mappings.",
          variant: "default",
        })
      } else {
        const errorMessage = result.error || "Failed to process file with mappings"
        setError(errorMessage)
        toast({
          title: "Processing Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process mapped data"
      setError(errorMessage)
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setGlobalProcessing(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    setExcelColumns([])
    setSampleData({})
    onDataProcessed(null)
    
    // Reset progress state
    setIsProcessing(false)
    setIsFileProcessing(false)
    setShowProgressBar(false)
    setUploadProgress(0)
    setProgressMessage("")
    setProgressStats({
      currentRow: 0,
      totalRows: 0,
      processedRows: 0
    })
    
    // Reset ignore rules when file is removed
    resetMailAgentRules()
    
    // Clear stored file data
    FileStorage.removeFile("upload-excel")
    
    // Clear upload session
    clearUploadSession("upload-excel")
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Storage Monitor - Hidden component for auto-cleanup */}
      <StorageMonitor />
      
      {/* Upload Step */}
      <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Upload Excel File</CardTitle>
            <p className="text-gray-600 text-sm">
              Upload your Excel file. The system will verify and assess each row of data.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragOver ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-400",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-700 mb-2">Click to upload or drag and drop</p>
              <p className="text-gray-500 text-sm mb-4">.xlsx, .xls, .csv - Maximum file size 50 MB</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="upload-excel-upload"
              />
              <label htmlFor="upload-excel-upload">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {/* Uploaded File */}
            {uploadedFile && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      if (uploadedFile && !processedData) {
                        setIsProcessing(true)
                        setError(null)

                        try {
                          // Get columns and sample data first
                          const columns = await getExcelColumns(uploadedFile)
                          const samples = await getExcelSampleData(uploadedFile, 3)

                          if (columns.length === 0) {
                            setError("No columns found in file")
                            return
                          }

                          setExcelColumns(columns)
                          setSampleData(samples)

                          // Process the file for data validation
                          setIsFileProcessing(true)
                          setShowProgressBar(true)
                          setGlobalProcessing(true)
                          const result = await processFile(uploadedFile, "upload-excel", undefined, (progress, message, stats) => {
                            setUploadProgress(progress)
                            setProgressMessage(message)
                            if (stats) {
                              setProgressStats({
                                currentRow: stats.currentRow,
                                totalRows: stats.totalRows,
                                processedRows: stats.processedRows
                              })
                            } else if (progress > 0) {
                              const estimatedTotal = 1000
                              setProgressStats({
                                currentRow: Math.round((progress / 100) * estimatedTotal),
                                totalRows: estimatedTotal,
                                processedRows: Math.round((progress / 100) * estimatedTotal)
                              })
                            }
                          })
                          if (result.success && result.data) {
                            setProcessedData(result.data)
                            
                            // Store file data immediately after successful upload for persistence
                            const fileStored = await FileStorage.storeFile(uploadedFile, "upload-excel")
                            if (!fileStored) {
                              console.warn('Could not store file data for persistence')
                            }
                            
                            // Show success toast with row count
                            const rowCount = result.data.data.length
                            toast({
                              title: "Upload Successful!",
                              description: `${rowCount} rows of data uploaded`,
                              duration: 3000,
                            })
                            
                            // Notify parent component
                            onDataProcessed(result.data)
                          } else {
                            setError(result.error || "Processing failed")
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Processing failed")
                        } finally {
                          setIsProcessing(false)
                          setIsFileProcessing(false)
                          setGlobalProcessing(false)
                        }
                      }
                    }}
                    disabled={isProcessing || !uploadedFile}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Process File
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeFile} className="text-gray-400 hover:text-red-600">
                    ×
                  </Button>
                </div>

                {/* Processing Status - Under uploaded file */}
                {isFileProcessing && showProgressBar && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {progressMessage || "Processing file..."}
                      </span>
                      <span className="text-sm text-gray-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                      ></div>
                    </div>
                    
                    {/* Progress Details */}
                    {progressStats.totalRows > 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          {progressStats.processedRows.toLocaleString()} / {progressStats.totalRows.toLocaleString()} rows processed
                        </span>
                        <span>
                          Row {progressStats.currentRow.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Processing Status - Under upload input (when no file uploaded yet) */}
            {isFileProcessing && !uploadedFile && showProgressBar && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {progressMessage || "Processing file..."}
                  </span>
                  <span className="text-sm text-gray-600">
                    {uploadProgress}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  ></div>
                </div>
                
                {/* Progress Details */}
                {progressStats.totalRows > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      {progressStats.processedRows.toLocaleString()} / {progressStats.totalRows.toLocaleString()} rows processed
                    </span>
                    <span>
                      Row {progressStats.currentRow.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
