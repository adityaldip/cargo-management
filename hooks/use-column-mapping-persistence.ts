"use client"

import { useEffect, useState } from 'react'
import type { ColumnMappingRule } from "@/lib/file-processor"

interface ColumnMappingState {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  mappings: ColumnMappingRule[]
  timestamp: number
}

export function useColumnMappingPersistence(dataSource: "mail-agent" | "mail-system" | "upload-excel") {
  const [isLoaded, setIsLoaded] = useState(false)
  const [storedMapping, setStoredMapping] = useState<ColumnMappingState | null>(null)

  const storageKey = 'column-mapping-storage'
  const mappingKey = dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                    dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping'

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        const mapping = parsed.state?.[mappingKey]
        if (mapping) {
          setStoredMapping(mapping)
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoaded(true)
    }
  }, [dataSource])

  // Save to localStorage
  const saveMapping = (excelColumns: string[], sampleData: Record<string, string[]>, mappings: ColumnMappingRule[]) => {
    try {
      const mappingState: ColumnMappingState = {
        excelColumns,
        sampleData,
        mappings,
        timestamp: Date.now()
      }

      // Get existing data
      const existingData = localStorage.getItem(storageKey)
      let parsedData = existingData ? JSON.parse(existingData) : { state: {} }

      // Update the specific mapping
      parsedData.state[mappingKey] = mappingState

      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(parsedData))
      
      setStoredMapping(mappingState)
    } catch (error) {
      // Silent error handling
    }
  }

  // Clear mapping
  const clearMapping = () => {
    try {
      const existingData = localStorage.getItem(storageKey)
      if (existingData) {
        const parsedData = JSON.parse(existingData)
        delete parsedData.state[mappingKey]
        localStorage.setItem(storageKey, JSON.stringify(parsedData))
      }
      setStoredMapping(null)
    } catch (error) {
      // Silent error handling
    }
  }

  // Check if mapping exists and matches current columns
  const getMatchingMapping = (excelColumns: string[]) => {
    if (!storedMapping || !isLoaded) return null
    
    if (storedMapping.excelColumns.length === excelColumns.length &&
        storedMapping.excelColumns.every((col, index) => col === excelColumns[index])) {
      return storedMapping
    }
    
    return null
  }

  return {
    isLoaded,
    storedMapping,
    saveMapping,
    clearMapping,
    getMatchingMapping
  }
}
