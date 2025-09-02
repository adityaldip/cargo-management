"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, Shuffle, Settings, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile } from "@/lib/file-processor"
import type { ProcessedData } from "@/types/cargo-data"
import { ColumnMapping } from "./column-mapping"

interface ImportMailSystemProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}

const DEMO_EXAMPLES = [
  {
    name: "Mail System - Central Europe Routes.xlsx",
    size: 3.2,
    data: {
      data: [
        {
          "Flight Date": "2025 OCT 10",
          "Record ID": "CZPRGDEBERLA9C71010005600234",
          "Destination": "71010",
          "Record Number": "005",
          "Origin OE": "CZPRG",
          "Destination OE": "DEBER",
          "Flight Number": "BT889",
          "Outbound Flight": "BT445",
          "Mail Category": "A",
          "Mail Classification": "9C",
          "Weight kg": "15.6",
          "Invoice Type": "Priority",
          "Customer Info": "Central Mail / CM2025",
        },
        {
          "Flight Date": "2025 OCT 12",
          "Record ID": "HUBUBDKCOPNHA8C71012003400156",
          "Destination": "71012",
          "Record Number": "003",
          "Origin OE": "HUBUD",
          "Destination OE": "DKCOP",
          "Flight Number": "BT667",
          "Outbound Flight": "BT778",
          "Mail Category": "B",
          "Mail Classification": "8C",
          "Weight kg": "22.3",
          "Invoice Type": "Express",
          "Customer Info": "Nordic Express / NE456",
        },
      ],
      summary: {
        totalRecords: 42,
        totalKg: 892.4,
        euSubtotal: 4567.8,
        nonEuSubtotal: 1234.5,
        total: 5802.3,
      },
      warnings: [],
      missingFields: [],
    },
  },
  {
    name: "System Data - Scandinavian Routes.xlsx",
    size: 2.8,
    data: {
      data: [
        {
          "Flight Date": "2025 NOV 05",
          "Record ID": "SEARNKOSLOGTA7C71105002100087",
          "Destination": "71105",
          "Record Number": "002",
          "Origin OE": "SEARNK",
          "Destination OE": "OSLOG",
          "Flight Number": "BT234",
          "Outbound Flight": "BT889",
          "Mail Category": "A",
          "Mail Classification": "7C",
          "Weight kg": "18.9",
          "Invoice Type": "Standard",
          "Customer Info": "Scan Mail / SM789",
        },
      ],
      summary: {
        totalRecords: 28,
        totalKg: 456.7,
        euSubtotal: 2890.4,
        nonEuSubtotal: 567.8,
        total: 3458.2,
      },
      warnings: [],
      missingFields: [],
    },
  },
]

export function ImportMailSystem({ onDataProcessed, onContinue }: ImportMailSystemProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})
  const [activeStep, setActiveStep] = useState<"upload" | "map" | "review">("upload")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadedFile(files[0])
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
        const result = await processFile(file, "mail-system")

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
  }

  const handleProcess = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await processFile(uploadedFile, "mail-system")

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

  const handleMappingComplete = (mappings: any[]) => {
    setShowColumnMapping(false)
    setActiveStep("review")
    onDataProcessed(processedData)
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

  const loadRandomExample = () => {
    const randomExample = DEMO_EXAMPLES[Math.floor(Math.random() * DEMO_EXAMPLES.length)]

    // Create a mock file object
    const mockFile = new File([""], randomExample.name, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    Object.defineProperty(mockFile, "size", { value: randomExample.size * 1024 * 1024 })

    setUploadedFile(mockFile)

    // Simulate processing delay
    setIsProcessing(true)
    setTimeout(() => {
      const columns = Object.keys(randomExample.data.data[0] || {})
      const samples: Record<string, string[]> = {}

      columns.forEach((col) => {
        samples[col] = randomExample.data.data.slice(0, 3).map((row) => String((row as any)[col] || ""))
      })

      setExcelColumns(columns)
      setSampleData(samples)
      setProcessedData(randomExample.data as unknown as ProcessedData)
      setShowColumnMapping(true)
      setActiveStep("map")
      setIsProcessing(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* <h2 className="text-3xl font-bold text-black mb-2">Import Mail System Data</h2> */}
        {/* <p className="text-gray-600"></p> */}
      </div>

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
            variant={activeStep === "review" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (processedData) {
                setActiveStep("review")
                setShowColumnMapping(false)
              }
            }}
            disabled={!processedData}
            className={
              activeStep === "review"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50 disabled:opacity-50"
            }
          >
            <Eye className="h-4 w-4 mr-2" />
            Review File
          </Button>
        </div>
      </div>

      {/* Upload Step */}
      {activeStep === "upload" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Upload Mail System File</CardTitle>
            <p className="text-gray-600 text-sm">
              Upload your mail system Excel file. The system will verify and assess each row of data.
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
              id="mail-system-upload"
            />
            <label htmlFor="mail-system-upload">
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
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
          onCancel={() => setActiveStep("upload")}
        />
      )}

      {/* Review Step */}
      {activeStep === "review" && processedData && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Data Verification Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-black">{processedData.summary.totalRecords}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold text-black">{processedData.summary.totalKg.toFixed(2)} kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Missing Fields</p>
                <p className="text-2xl font-bold text-red-600">{processedData.missingFields.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-black">€{processedData.summary.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Warnings and Missing Fields */}
            {(processedData.warnings.length > 0 || processedData.missingFields.length > 0) && (
              <div className="space-y-3">
                {processedData.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded"
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">{warning}</p>
                  </div>
                ))}
                {processedData.missingFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{field}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={onContinue}
              >
                Continue to Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
