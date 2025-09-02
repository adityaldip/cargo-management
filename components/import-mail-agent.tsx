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

interface ImportMailAgentProps {
  onDataProcessed: (data: ProcessedData | null) => void
  onContinue?: () => void
}

const DEMO_EXAMPLES = [
  {
    name: "Air Baltic Mail Agent - July 2025.xlsx",
    size: 2.4,
    data: {
      data: [
        {
          "Inb.Flight Date": "2025 JUL 15",
          "Outb.Flight Date": "2025 JUL 16",
          "Rec. ID": "USFRATUSRIXTA7C50708003700079",
          "Des. No.": "50708",
          "Rec. Numb.": "003",
          "Orig. OE": "USFRAT",
          "Dest. OE": "USRIXT",
          "Inb. Flight No.": "BT234",
          "Outb. Flight No.": "BT633",
          "Mail Cat.": "A",
          "Mail Class": "7C",
          "Total kg": "7.9",
          Invoice: "Airmail",
          "Customer name / number": "AirMail Limited / ZZXDA14",
        },
        {
          "Inb.Flight Date": "2025 JUL 08",
          "Outb.Flight Date": "2025 JUL 09",
          "Rec. ID": "USFRATUSRIXTA7C50705002700062",
          "Des. No.": "50705",
          "Rec. Numb.": "002",
          "Orig. OE": "USFRAT",
          "Dest. OE": "USRIXT",
          "Inb. Flight No.": "BT234",
          "Outb. Flight No.": "BT445",
          "Mail Cat.": "A",
          "Mail Class": "7C",
          "Total kg": "6.2",
          Invoice: "Airmail",
          "Customer name / number": "AirMail Limited / ZZXDA14",
        },
      ],
      summary: {
        totalRecords: 25,
        totalWeight: 156.8,
        total: 2847.5,
        missingData: { incompleteRecords: 0 },
      },
      warnings: [],
      missingFields: [],
    },
  },
  {
    name: "European Routes - August 2025.xlsx",
    size: 3.1,
    data: {
      data: [
        {
          "Inb.Flight Date": "2025 AUG 12",
          "Outb.Flight Date": "2025 AUG 13",
          "Rec. ID": "DKCPHAFRANKTA8C60812004500123",
          "Des. No.": "60812",
          "Rec. Numb.": "004",
          "Orig. OE": "DKCPHA",
          "Dest. OE": "FRANK",
          "Inb. Flight No.": "BT445",
          "Outb. Flight No.": "BT778",
          "Mail Cat.": "B",
          "Mail Class": "8C",
          "Total kg": "12.4",
          Invoice: "Express",
          "Customer name / number": "Euro Express / EEX901",
        },
      ],
      summary: {
        totalRecords: 18,
        totalWeight: 234.6,
        total: 4125.75,
        missingData: { incompleteRecords: 0 },
      },
      warnings: [],
      missingFields: [],
    },
  },
  {
    name: "Nordic Mail System - September 2025.xlsx",
    size: 1.8,
    data: {
      data: [
        {
          "Inb.Flight Date": "2025 SEP 05",
          "Outb.Flight Date": "2025 SEP 06",
          "Rec. ID": "SEARNKOSLOTA9C70905001200089",
          "Des. No.": "70905",
          "Rec. Numb.": "001",
          "Orig. OE": "SEARNK",
          "Dest. OE": "OSLO",
          "Inb. Flight No.": "BT667",
          "Outb. Flight No.": "BT889",
          "Mail Cat.": "A",
          "Mail Class": "7C",
          "Total kg": "8.7",
          Invoice: "Standard",
          "Customer name / number": "Nordic Post / NP2025",
        },
      ],
      summary: {
        totalRecords: 32,
        totalWeight: 287.3,
        total: 3456.8,
        missingData: { incompleteRecords: 0 },
      },
      warnings: [],
      missingFields: [],
    },
  },
]

export function ImportMailAgent({ onDataProcessed, onContinue }: ImportMailAgentProps) {
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
        const result = await processFile(file, "mail-agent")

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      // Automatically process the file and go to map headers
      setIsProcessing(true)
      setError(null)

      try {
        const result = await processFile(file, "mail-agent")

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



  // Remove the early return - we'll handle column mapping within the main component structure

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* <h2 className="text-3xl font-bold text-black mb-2">Import Mail Agent Data</h2> */}
        {/* <p className="text-gray-600">Upload and verify mail agent Excel files for processing</p> */}
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
            <CardTitle className="text-black">Upload Mail Agent File</CardTitle>
            <p className="text-gray-600 text-sm">
              Upload your mail agent Excel file. The system will verify and assess each row of data.
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
