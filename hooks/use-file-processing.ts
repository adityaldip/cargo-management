"use client"

import { useState, useEffect } from "react"
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

interface UseFileProcessingProps {
  dataSource: "upload-excel"
}

export function useFileProcessing({ dataSource }: UseFileProcessingProps) {
  const { 
    addDataset, 
    generateDatasetId, 
    updateCurrentSession, 
    saveUploadSession, 
    getUploadSession, 
    clearUploadSession
  } = useDataStore()
  
  const { clearFilters } = usePageFilters("review-merged-excel")
  const { resetMailAgentRules } = useIgnoreRulesStore()
  const { clearColumnMapping } = useColumnMappingStore()
  const { setIsProcessing: setGlobalProcessing } = useWorkflowStore()
  const { toast } = useToast()
  
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
  useEffect(() => {
    const uploadSession = getUploadSession(dataSource)
    if (uploadSession) {
      const storedFile = FileStorage.retrieveFile(dataSource)
      if (storedFile) {
        setUploadedFile(storedFile)
      }
      
      if (uploadSession.processedData) {
        setProcessedData(uploadSession.processedData)
      }
      
      if (uploadSession.excelColumns) {
        setExcelColumns(uploadSession.excelColumns)
      }
      if (uploadSession.sampleData) {
        setSampleData(uploadSession.sampleData)
      }
    }
  }, [])

  // Save session data whenever relevant state changes
  useEffect(() => {
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
            JSON.stringify({ [dataSource]: sessionData }),
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
  useEffect(() => {
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

  const processFileData = async (file: File, onColumnsExtracted?: (columns: string[], sampleData: Record<string, string[]>) => void) => {
    setIsProcessing(true)
    setError(null)

    try {
      const columns = await getExcelColumns(file)
      const samples = await getExcelSampleData(file, 3)

      if (columns.length === 0) {
        setError("No columns found in file")
        return
      }

      setExcelColumns(columns)
      setSampleData(samples)
      onColumnsExtracted?.(columns, samples)

      setIsFileProcessing(true)
      setShowProgressBar(true)
      setGlobalProcessing(true)
      
      const result = await processFile(file, dataSource, undefined, (progress, message, stats) => {
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
        
        const fileStored = await FileStorage.storeFile(file, dataSource)
        if (!fileStored) {
          console.warn('Could not store file data for persistence')
        }
        
        const rowCount = result.data.data.length
        toast({
          title: "Upload Successful!",
          description: `${rowCount} rows of data uploaded`,
          duration: 3000,
        })
        
        return result.data
      } else {
        setError(result.error || "Processing failed")
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
      return null
    } finally {
      setIsProcessing(false)
      setIsFileProcessing(false)
      setGlobalProcessing(false)
    }
  }

  const handleDrop = async (e: React.DragEvent, onDataProcessed?: (data: ProcessedData | null) => void, onColumnsExtracted?: (columns: string[], sampleData: Record<string, string[]>) => void) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      
      clearFilters()
      resetMailAgentRules()
      clearColumnMapping(dataSource)
      
      const result = await processFileData(file, onColumnsExtracted)
      onDataProcessed?.(result)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, onDataProcessed?: (data: ProcessedData | null) => void, onColumnsExtracted?: (columns: string[], sampleData: Record<string, string[]>) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      clearFilters()
      resetMailAgentRules()
      clearColumnMapping(dataSource)
      
      const result = await processFileData(file, onColumnsExtracted)
      onDataProcessed?.(result)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessedData(null)
    setError(null)
    setExcelColumns([])
    setSampleData({})
    
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
    
    resetMailAgentRules()
    FileStorage.removeFile(dataSource)
    clearUploadSession(dataSource)
  }

  return {
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
  }
}
