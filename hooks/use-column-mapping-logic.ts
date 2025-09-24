"use client"

import { useState, useEffect } from "react"
import type { ColumnMappingRule } from "@/lib/file-processor"
import { useColumnMappingStore } from "@/store/column-mapping-store"
import { useDataStore } from "@/store/data-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useHydration } from "@/hooks/use-hydration"
import { useColumnMappingPersistence } from "@/hooks/use-column-mapping-persistence"
import { useToast } from "@/hooks/use-toast"

const FINAL_EXPORT_COLUMNS = [
  "Inb.Flight Date",
  "Outb.Flight Date", 
  "Rec. ID",
  "Des. No.",
  "Rec. Numb.",
  "Orig. OE",
  "Dest. OE",
  "Inb. Flight No. | STA",
  "Outb. Flight No. | STD",
  "Mail Cat.",
  "Mail Class",
  "Total kg",
]

interface UseColumnMappingLogicProps {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  dataSource: "upload-excel"
}

export function useColumnMappingLogic({ excelColumns, sampleData, dataSource }: UseColumnMappingLogicProps) {
  const { 
    getColumnMapping, 
    setColumnMapping, 
    updateMappings, 
    clearColumnMapping
  } = useColumnMappingStore()
  
  const { clearUploadSession } = useDataStore()
  const { setIsMappingAndSaving } = useWorkflowStore()
  const isHydrated = useHydration()
  const { isLoaded, saveMapping, clearMapping, getMatchingMapping } = useColumnMappingPersistence(dataSource)
  const { toast } = useToast()
  
  const [mappings, setMappings] = useState<ColumnMappingRule[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Initialize mappings from store or create default ones
  useEffect(() => {
    if (!isHydrated || !isLoaded || excelColumns.length === 0 || isCompleted) {
      return
    }
    
    const matchingMapping = getMatchingMapping(excelColumns)
    
    if (matchingMapping) {
      setMappings(matchingMapping.mappings)
    } else {
      const defaultMappings = excelColumns.map((col, index) => ({
        excelColumn: col,
        mappedTo: index < FINAL_EXPORT_COLUMNS.length ? FINAL_EXPORT_COLUMNS[index] : null,
        finalColumn: FINAL_EXPORT_COLUMNS[index] || "Unmapped",
        status: (index < FINAL_EXPORT_COLUMNS.length ? "mapped" : "unmapped") as "mapped" | "unmapped" | "warning",
        sampleData: sampleData[col] || [],
      }))
      setMappings(defaultMappings)
      
      setColumnMapping(dataSource, excelColumns, sampleData, defaultMappings)
      saveMapping(excelColumns, sampleData, defaultMappings)
    }
    
    setHasInitialized(true)
  }, [excelColumns, sampleData, dataSource, isHydrated, isLoaded, isCompleted])

  // Update store and localStorage when mappings change
  useEffect(() => {
    if (mappings.length > 0 && hasInitialized) {
      updateMappings(dataSource, mappings)
      saveMapping(excelColumns, sampleData, mappings)
    }
  }, [mappings, dataSource, hasInitialized])

  // Force clear all data when completed
  useEffect(() => {
    if (isCompleted) {
      clearColumnMapping(dataSource)
      clearMapping()
      clearUploadSession(dataSource)
      
      const { clearAllColumnMappings } = useColumnMappingStore.getState()
      const { clearAllUploadSessions, clearCurrentSession } = useDataStore.getState()
      
      clearAllColumnMappings()
      clearAllUploadSessions()
      clearCurrentSession()
      
      try {
        localStorage.removeItem('column-mapping-storage')
        localStorage.removeItem('cargo-upload-sessions')
        localStorage.removeItem('cargo-data-storage')
        localStorage.removeItem('file-storage')
      } catch (error) {
        // Silent error handling
      }
    }
  }, [isCompleted, dataSource])

  const handleMappingChange = (excelColumn: string, finalColumn: string) => {
    setMappings((prev) => {
      const newMappings = prev.map((mapping) => {
        if (mapping.excelColumn === excelColumn) {
          let status: "mapped" | "unmapped" | "warning" = "mapped"
          
          if (finalColumn === "unmapped") {
            status = "unmapped"
          } else {
            const isAlreadyMapped = prev.some(
              (m) => m.excelColumn !== excelColumn && m.mappedTo === finalColumn
            )
            if (isAlreadyMapped) {
              status = "warning"
            }
          }
          
          return {
            ...mapping,
            mappedTo: finalColumn === "unmapped" ? null : finalColumn,
            finalColumn: finalColumn === "unmapped" ? "Unmapped" : finalColumn,
            status,
          }
        }
        
        if (mapping.mappedTo === finalColumn && finalColumn !== "unmapped") {
          return {
            ...mapping,
            status: "warning" as const,
          }
        }
        
        if (mapping.status === "warning" && mapping.mappedTo && finalColumn !== mapping.mappedTo) {
          const stillHasConflict = prev.some(
            (m) => m.excelColumn !== mapping.excelColumn && 
                   m.excelColumn !== excelColumn && 
                   m.mappedTo === mapping.mappedTo
          )
          if (!stillHasConflict) {
            return {
              ...mapping,
              status: "mapped" as const,
            }
          }
        }
        
        return mapping
      })
      
      return newMappings
    })
  }

  const getMappedCount = () => mappings.filter((m) => m.status === "mapped").length
  const getTotalCount = () => mappings.length
  const getConflictCount = () => mappings.filter((m) => m.status === "warning").length
  const hasConflicts = () => getConflictCount() > 0

  const clearAllData = () => {
    clearColumnMapping(dataSource)
    clearMapping()
    clearUploadSession(dataSource)
    
    const { clearAllColumnMappings } = useColumnMappingStore.getState()
    const { clearAllUploadSessions, clearCurrentSession } = useDataStore.getState()
    
    clearAllColumnMappings()
    clearAllUploadSessions()
    clearCurrentSession()
    
    try {
      localStorage.removeItem('column-mapping-storage')
      localStorage.removeItem('cargo-upload-sessions')
      localStorage.removeItem('cargo-data-storage')
      localStorage.removeItem('file-storage')
    } catch (error) {
      // Silent error handling
    }
    
    setMappings([])
    setHasInitialized(false)
    setIsCompleted(true)
    setIsMappingAndSaving(false)
  }

  return {
    mappings,
    setMappings,
    hasInitialized,
    isCompleted,
    setIsCompleted,
    handleMappingChange,
    getMappedCount,
    getTotalCount,
    getConflictCount,
    hasConflicts,
    clearAllData,
    FINAL_EXPORT_COLUMNS
  }
}
