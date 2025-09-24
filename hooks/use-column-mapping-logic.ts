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
  const [isCleared, setIsCleared] = useState(false)

  // Initialize mappings from store or create default ones
  useEffect(() => {
    console.log('🔍 Initialization useEffect triggered:', {
      isHydrated,
      isLoaded,
      excelColumnsLength: excelColumns.length,
      isCompleted,
      isCleared
    })
    
    if (!isHydrated || !isLoaded || excelColumns.length === 0 || isCompleted || isCleared) {
      console.log('⏭️ Skipping initialization due to conditions')
      return
    }
    
    // If cleared, don't try to load from store
    if (isCleared) {
      console.log('🚫 Component is cleared, not loading from store')
      setMappings([])
      setHasInitialized(false)
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
  }, [excelColumns, sampleData, dataSource, isHydrated, isLoaded, isCompleted, isCleared])

  // Update store and localStorage when mappings change
  useEffect(() => {
    if (mappings.length > 0 && hasInitialized) {
      updateMappings(dataSource, mappings)
      saveMapping(excelColumns, sampleData, mappings)
    }
  }, [mappings, dataSource, hasInitialized])

  // This useEffect is removed to prevent conflicts with clearAllData()

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
    console.log('🧹 Clearing all data...')
    
    // Clear component state FIRST to prevent re-initialization
    setMappings([])
    setHasInitialized(false)
    setIsCompleted(true)
    setIsCleared(true)
    setIsMappingAndSaving(false)
    
    // Clear store states
    clearColumnMapping(dataSource)
    clearMapping()
    clearUploadSession(dataSource)
    
    const { clearAllColumnMappings } = useColumnMappingStore.getState()
    const { clearAllUploadSessions, clearCurrentSession } = useDataStore.getState()
    
    clearAllColumnMappings()
    clearAllUploadSessions()
    clearCurrentSession()
    
    // Clear localStorage
    try {
      localStorage.removeItem('column-mapping-storage')
      localStorage.removeItem('cargo-upload-sessions')
      localStorage.removeItem('cargo-data-storage')
      localStorage.removeItem('file-storage')
      console.log('✅ localStorage cleared')
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error)
    }
    
    // Force multiple re-renders to ensure state is updated
    setTimeout(() => {
      setMappings([])
      console.log('🔄 Forced re-render - mappings cleared')
    }, 0)
    
    setTimeout(() => {
      setMappings([])
      console.log('🔄 Second forced re-render - mappings cleared')
    }, 50)
  }

  const resetClearedState = () => {
    setIsCleared(false)
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
    resetClearedState,
    FINAL_EXPORT_COLUMNS
  }
}
