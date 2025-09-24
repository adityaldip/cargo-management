"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFileProcessing } from "@/hooks/use-file-processing"
import { StorageMonitor } from "../ui/storage-monitor"

interface UploadExcelProps {
  onDataProcessed: (data: any) => void
  onColumnsExtracted?: (columns: string[], sampleData: Record<string, string[]>) => void
  onContinue?: () => void
}

export function UploadExcel({ onDataProcessed, onColumnsExtracted, onContinue }: UploadExcelProps) {
  const {
    uploadedFile,
    isProcessing,
    processedData,
    isDragOver,
    error,
    excelColumns,
    sampleData,
    uploadProgress,
    progressMessage,
    isFileProcessing,
    showProgressBar,
    progressStats,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    processFileData
  } = useFileProcessing({ dataSource: "upload-excel" })

  const handleProcessFile = async () => {
    if (uploadedFile && !processedData) {
      const result = await processFileData(uploadedFile, onColumnsExtracted)
      onDataProcessed(result)
    }
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
            onDrop={(e) => handleDrop(e, onDataProcessed, onColumnsExtracted)}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-700 mb-2">Click to upload or drag and drop</p>
            <p className="text-gray-500 text-sm mb-4">.xlsx, .xls, .csv - Maximum file size 50 MB</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileSelect(e, onDataProcessed, onColumnsExtracted)}
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
                  onClick={handleProcessFile}
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
