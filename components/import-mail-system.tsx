"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { processFile } from "@/lib/file-processor"
import type { ProcessedData } from "@/types/cargo-data"

interface ImportMailSystemProps {
  onDataProcessed: (data: ProcessedData | null) => void
}

export function ImportMailSystem({ onDataProcessed }: ImportMailSystemProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const result = await processFile(uploadedFile, "mail-system")

      if (result.success && result.data) {
        setProcessedData(result.data)
        onDataProcessed(result.data)
      } else {
        setError(result.error || "Processing failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    onDataProcessed(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">Import Mail System Data</h2>
        <p className="text-gray-600">Upload and verify mail system Excel files for processing</p>
      </div>

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
