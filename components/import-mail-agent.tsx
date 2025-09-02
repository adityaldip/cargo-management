"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile } from "@/lib/file-processor"
import type { ProcessedData } from "@/types/cargo-data"
import { ColumnMapping } from "./column-mapping"

interface ImportMailAgentProps {
  onDataProcessed: (data: ProcessedData | null) => void
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

export function ImportMailAgent({ onDataProcessed }: ImportMailAgentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({})

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
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
          samples[col] = result.data!.data.slice(0, 3).map((row) => String(row[col] || ""))
        })

        setExcelColumns(columns)
        setSampleData(samples)
        setShowColumnMapping(true)
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

  const handleMappingComplete = (mappings: any[]) => {
    setShowColumnMapping(false)
    onDataProcessed(processedData)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    setShowColumnMapping(false)
    setExcelColumns([])
    setSampleData({})
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
        samples[col] = randomExample.data.data.slice(0, 3).map((row) => String(row[col] || ""))
      })

      setExcelColumns(columns)
      setSampleData(samples)
      setProcessedData(randomExample.data as ProcessedData)
      setShowColumnMapping(true)
      setIsProcessing(false)
    }, 1500)
  }

  if (showColumnMapping) {
    return (
      <ColumnMapping excelColumns={excelColumns} sampleData={sampleData} onMappingComplete={handleMappingComplete} />
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">Import Mail Agent Data</h2>
        <p className="text-gray-600">Upload and verify mail agent Excel files for processing</p>
      </div>

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
            <div className="flex gap-3 justify-center">
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
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                onClick={loadRandomExample}
                disabled={isProcessing}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Try Demo Example
              </Button>
            </div>
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

      {/* Processing Results */}
      {processedData && (
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
                <p className="text-2xl font-bold text-black">{processedData.summary.totalWeight} kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Missing Data</p>
                <p className="text-2xl font-bold text-red-600">{processedData.summary.missingData.incompleteRecords}</p>
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
              <Button className="bg-black hover:bg-gray-800 text-white">Continue to Next Step</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
