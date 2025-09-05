"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, Settings, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile, getExcelColumns, getExcelSampleData, processFileWithMappings, type ColumnMappingRule } from "@/lib/file-processor"
import { saveDataset, generateDatasetId, saveCurrentSession, getCurrentSession } from "@/lib/storage-utils"
import type { ProcessedData } from "@/types/cargo-data"
import { ColumnMapping } from "./column-mapping"

interface ImportMailAgentProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}


export function ImportMailAgent({ onDataProcessed, onContinue }: ImportMailAgentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})
  const [activeStep, setActiveStep] = useState<"upload" | "map">("upload")

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
      
      // Automatically process the file and go to map headers
      setIsProcessing(true)
      setError(null)

      try {
        // Get columns and sample data first
        const columns = await getExcelColumns(file)
        const samples = await getExcelSampleData(file, 3)

        if (columns.length === 0) {
          setError("No columns found in Excel file")
          return
        }

        setExcelColumns(columns)
        setSampleData(samples)
        setShowColumnMapping(true)
        setActiveStep("map")

        // Process the file for data validation
        const result = await processFile(file, "mail-agent")
        if (result.success && result.data) {
          setProcessedData(result.data)
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      // Automatically process the file and go to map headers
      setIsProcessing(true)
      setError(null)

      try {
        // Get columns and sample data first
        const columns = await getExcelColumns(file)
        const samples = await getExcelSampleData(file, 3)

        if (columns.length === 0) {
          setError("No columns found in Excel file")
          return
        }

        setExcelColumns(columns)
        setSampleData(samples)
        setShowColumnMapping(true)
        setActiveStep("map")

        // Process the file for data validation
        const result = await processFile(file, "mail-agent")
        if (result.success && result.data) {
          setProcessedData(result.data)
        } else {
          setError(result.error || "Processing failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleProcess = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await processFile(uploadedFile, "mail-agent")

      if (result.success && result.data) {
        const columns = Object.keys(result.data.data[0] || {})
        const samples: Record<string, string[]> = {}

        columns.forEach((col) => {
          samples[col] = result.data!.data.slice(0, 3).map((row) => String((row as any)[col] || ""))
        })

        setExcelColumns(columns)
        setSampleData(samples)
        setShowColumnMapping(true)
        setProcessedData(result.data)
        setActiveStep("map")
      } else {
        setError(result.error || "Processing failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingComplete = async (mappings: ColumnMappingRule[]) => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Process file with user's column mappings
      const result = await processFileWithMappings(uploadedFile, "mail-agent", mappings)
      
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
        
        // Save to local storage
        saveDataset(dataset)
        
        // Update current session
        const currentSession = getCurrentSession() || {}
        currentSession.mailAgent = dataset
        saveCurrentSession(currentSession)
        
        // Update component state
        setProcessedData(result.data)
        setShowColumnMapping(false)
        onDataProcessed(result.data)
        onContinue?.()
      } else {
        setError(result.error || "Failed to process file with mappings")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process mapped data")
    } finally {
      setIsProcessing(false)
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
            <p className="text-gray-500 text-sm mb-4">.xlsx, .xls - Maximum file size 50 MB</p>
            <input
              type="file"
              accept=".xlsx,.xls"
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

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-sm text-blue-700">Processing file...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
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
          onCancel={() => setActiveStep("upload")}
        />
      )}


    </div>
  )
}
