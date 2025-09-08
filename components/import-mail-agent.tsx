"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, Settings, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile, getExcelColumns, getExcelSampleData, processFileWithMappings, type ColumnMappingRule } from "@/lib/file-processor"
import { useDataStore } from "@/store/data-store"
import { usePageFilters } from "@/store/filter-store"
import { useIgnoreRulesStore } from "@/store/ignore-rules-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useToast } from "@/hooks/use-toast"
import type { ProcessedData } from "@/types/cargo-data"
import { ColumnMapping } from "./column-mapping"
import { IgnoreTrackingRules } from "./ignore-tracking-rules"
import { IgnoredDataTable } from "./ignored-data-table"
import type { IgnoreRule } from "@/lib/ignore-rules-utils"

interface ImportMailAgentProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}


export function ImportMailAgent({ onDataProcessed, onContinue }: ImportMailAgentProps) {
  const { 
    addDataset, 
    generateDatasetId, 
    updateCurrentSession, 
    saveUploadSession, 
    getUploadSession, 
    clearUploadSession 
  } = useDataStore()
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})
  const [activeStep, setActiveStep] = useState<"upload" | "map" | "ignore" | "ignored">("upload")
  const [ignoreRules, setIgnoreRules] = useState<IgnoreRule[]>([])
  const [showIgnoreRules, setShowIgnoreRules] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [isFileProcessing, setIsFileProcessing] = useState(false)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressStats, setProgressStats] = useState({
    currentRow: 0,
    totalRows: 0,
    processedRows: 0
  })
  
  // Load persisted data on component mount
  React.useEffect(() => {
    const uploadSession = getUploadSession("mail-agent")
    if (uploadSession) {
      // Restore file info (we can't restore the actual File object, but we can restore the state)
      if (uploadSession.fileName) {
        // Create a mock file object for display purposes
        const mockFile = new File([], uploadSession.fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        setUploadedFile(mockFile)
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
      
      // Restore active step
      if (uploadSession.activeStep) {
        setActiveStep(uploadSession.activeStep)
        if (uploadSession.activeStep === "map") {
          setShowColumnMapping(true)
        } else if (uploadSession.activeStep === "ignore") {
          setShowIgnoreRules(true)
        }
      }
      
      // Restore ignore rules
      if (uploadSession.ignoreRules) {
        setIgnoreRules(uploadSession.ignoreRules)
      }
    }
  }, [])
  
  // Filter store for resetting filters on new upload
  const { clearFilters } = usePageFilters("review-merged-excel")
  
  // Ignore rules store for targeted reset
  const { resetMailAgentRules } = useIgnoreRulesStore()
  
  // Workflow store for global processing state
  const { setIsProcessing: setGlobalProcessing } = useWorkflowStore()
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Save upload session data
  const saveUploadSessionData = () => {
    const sessionData = {
      fileName: uploadedFile?.name || null,
      processedData,
      excelColumns,
      sampleData,
      activeStep,
      ignoreRules,
      timestamp: Date.now()
    }
    saveUploadSession("mail-agent", sessionData)
  }
  
  // Save session data whenever relevant state changes
  React.useEffect(() => {
    if (uploadedFile || processedData || excelColumns.length > 0) {
      try {
        saveUploadSessionData()
      } catch (error) {
        if (error instanceof Error && error.message.includes('quota')) {
          toast({
            title: "Storage Warning",
            description: "Local storage is full. Some session data may not be saved, but your work will continue normally.",
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    }
  }, [uploadedFile, processedData, excelColumns, sampleData, activeStep, ignoreRules])

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
      }, 1500) // Hide after 1.5 seconds
      
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
      
      // Reset ignore rules for mail agent only (targeted reset)
      resetMailAgentRules()
      
      // Reset ignore rules state
      setIgnoreRules([])
      setShowIgnoreRules(false)
      
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

        // Process the file for data validation
        setIsFileProcessing(true)
        setShowProgressBar(true)
        setGlobalProcessing(true)
        const result = await processFile(file, "mail-agent", undefined, (progress, message, stats) => {
          setUploadProgress(progress)
          setProgressMessage(message)
          // Use real stats from file processor if available, otherwise simulate
          if (stats) {
            setProgressStats({
              currentRow: stats.currentRow,
              totalRows: stats.totalRows,
              processedRows: stats.processedRows
            })
          } else if (progress > 0) {
            // Fallback simulation for backward compatibility
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
          
          // Show success toast with row count
          const rowCount = result.data.data.length
          toast({
            title: "Upload Successful!",
            description: `${rowCount} rows of data uploaded`,
            duration: 3000,
          })
          
          // Move to mapping tab only after 100% completion
          setShowColumnMapping(true)
          setActiveStep("map")
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
        setIsFileProcessing(false)
        setGlobalProcessing(false)
        // Don't reset progress here - let auto-hide handle it
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      // Reset filters when new file is uploaded
      clearFilters()
      
      // Reset ignore rules for mail agent only (targeted reset)
      resetMailAgentRules()
      
      // Reset ignore rules state
      setIgnoreRules([])
      setShowIgnoreRules(false)
      
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

        // Process the file for data validation
        setIsFileProcessing(true)
        setShowProgressBar(true)
        setGlobalProcessing(true)
        const result = await processFile(file, "mail-agent", undefined, (progress, message, stats) => {
          setUploadProgress(progress)
          setProgressMessage(message)
          // Use real stats from file processor if available, otherwise simulate
          if (stats) {
            setProgressStats({
              currentRow: stats.currentRow,
              totalRows: stats.totalRows,
              processedRows: stats.processedRows
            })
          } else if (progress > 0) {
            // Fallback simulation for backward compatibility
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
          
          // Show success toast with row count
          const rowCount = result.data.data.length
          toast({
            title: "Upload Successful!",
            description: `${rowCount} rows of data uploaded`,
            duration: 3000,
          })
          
          // Move to mapping tab only after 100% completion
          setShowColumnMapping(true)
          setActiveStep("map")
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
        setIsFileProcessing(false)
        setGlobalProcessing(false)
        // Don't reset progress here - let auto-hide handle it
      }
    }
  }

  const handleProcess = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      setIsFileProcessing(true)
      setGlobalProcessing(true)
      const result = await processFile(uploadedFile, "mail-agent", undefined, (progress, message) => {
        setUploadProgress(progress)
        setProgressMessage(message)
      })

      if (result.success && result.data) {
        const columns = Object.keys(result.data.data[0] || {})
        const samples: Record<string, string[]> = {}

        columns.forEach((col) => {
          samples[col] = result.data!.data.slice(0, 3).map((row) => String((row as any)[col] || ""))
        })

        setExcelColumns(columns)
        setSampleData(samples)
        setProcessedData(result.data)
        
        // Show success toast with row count
        const rowCount = result.data.data.length
        toast({
          title: "Upload Successful!",
          description: `${rowCount} rows of data uploaded`,
          duration: 3000,
        })
        
        // Move to mapping tab only after 100% completion
        setShowColumnMapping(true)
        setActiveStep("map")
      } else {
        setError(result.error || "Processing failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
      setGlobalProcessing(false)
    }
  }

  const handleMappingComplete = async (mappings: ColumnMappingRule[]) => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Process file with user's column mappings
      setIsFileProcessing(true)
      setShowProgressBar(true)
      setGlobalProcessing(true)
      const result = await processFileWithMappings(uploadedFile, "mail-agent", mappings, undefined, (progress, message, stats) => {
        setUploadProgress(progress)
        setProgressMessage(message)
        
        // Use real stats from file processor if available, otherwise simulate
        if (stats) {
          setProgressStats({
            currentRow: stats.currentRow,
            totalRows: stats.totalRows,
            processedRows: stats.processedRows
          })
        } else if (progress > 0) {
          // Fallback simulation for backward compatibility
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
          type: "mail-agent" as const,
          data: result.data,
          mappings,
          timestamp: Date.now(),
          fileName: uploadedFile.name
        }
        
        // Save to data store
        addDataset(dataset)
        
        // Update current session
        updateCurrentSession({ mailAgent: dataset })
        
        // Clear upload session after successful save
        clearUploadSession("mail-agent")
        
        // Update component state
        setProcessedData(result.data)
        setShowColumnMapping(false)
        onDataProcessed(result.data)
        
        // Go to Ignore Rules step instead of continuing directly
        setActiveStep("ignore")
        setShowIgnoreRules(true)
      } else {
        setError(result.error || "Failed to process file with mappings")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process mapped data")
    } finally {
      setIsProcessing(false)
      setGlobalProcessing(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    setShowColumnMapping(false)
    setExcelColumns([])
    setSampleData({})
    setActiveStep("upload")
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
    
    // Reset ignore rules when file is removed (targeted reset)
    setIgnoreRules([])
    setShowIgnoreRules(false)
    resetMailAgentRules()
    
    // Clear upload session
    clearUploadSession("mail-agent")
  }

  const handleCancelMapping = () => {
    // Reset all upload state and go back to upload tab
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    setShowColumnMapping(false)
    setExcelColumns([])
    setSampleData({})
    setActiveStep("upload")
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
    
    // Reset ignore rules (targeted reset)
    setIgnoreRules([])
    setShowIgnoreRules(false)
    resetMailAgentRules()
    
    // Clear upload session
    clearUploadSession("mail-agent")
  }



  // Remove the early return - we'll handle column mapping within the main component structure

  return (
    <div className="space-y-4 pt-2">
      {/* Header Navigation */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeStep === "upload" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("upload")}
            className={
              activeStep === "upload"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={activeStep === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (uploadedFile && excelColumns.length > 0) {
                setActiveStep("map")
                setShowColumnMapping(true)
              }
            }}
            disabled={!uploadedFile || excelColumns.length === 0}
            className={
              activeStep === "map"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-50"
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Map Headers
          </Button>
          <Button
            variant={activeStep === "ignore" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (processedData) {
                setActiveStep("ignore")
                setShowIgnoreRules(true)
              }
            }}
            disabled={!processedData}
            className={
              activeStep === "ignore"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-50"
            }
          >
            <Eye className="h-4 w-4 mr-2" />
            Rules
          </Button>
          <Button
            variant={activeStep === "ignored" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (processedData) {
                setActiveStep("ignored")
                setShowIgnoreRules(false)
              }
            }}
            disabled={!processedData}
            className={
              activeStep === "ignored"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-50"
            }
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Ignored
          </Button>

        </div>
      </div>

      {/* Upload Step */}
      {activeStep === "upload" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Upload Mail Agent File</CardTitle>
            <p className="text-gray-600 text-sm">
              Upload your Mail Agent Excel file. The system will verify and assess each row of data.
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
              id="mail-agent-upload"
            />
            <label htmlFor="mail-agent-upload">
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
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Process File
                </Button>
                <Button variant="ghost" size="sm" onClick={removeFile} className="text-gray-400 hover:text-black">
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
                      style={{ width: `${uploadProgress}%` }}
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
                  style={{ width: `${uploadProgress}%` }}
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
      )}

      {/* Map Headers Step */}
      {activeStep === "map" && showColumnMapping && (
        <ColumnMapping 
          excelColumns={excelColumns} 
          sampleData={sampleData} 
          onMappingComplete={handleMappingComplete}
          onCancel={handleCancelMapping}
        />
      )}

      {/* Ignore Rules Step */}
      {activeStep === "ignore" && showIgnoreRules && (
        <IgnoreTrackingRules 
          onRulesChange={setIgnoreRules}
          uploadedData={processedData}
          onRulesApplied={() => {
            // Force re-calculation of ignored data when rules are applied
            setIgnoreRules([...ignoreRules])
          }}
          onViewIgnored={() => {
            setActiveStep("ignored")
            setShowIgnoreRules(false)
          }}
          dataSource="mail-agent"
        />
      )}

      {/* Ignored Data Step */}
      {activeStep === "ignored" && (
        <IgnoredDataTable 
          originalData={processedData}
          ignoreRules={ignoreRules}
          onRefresh={() => {
            // Force re-calculation of ignored data
            setIgnoreRules([...ignoreRules])
          }}
          onContinue={() => {
            onContinue?.()
          }}
          dataSource="mail-agent"
        />
      )}

    </div>
  )
}
