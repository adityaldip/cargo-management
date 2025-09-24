"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ColumnMappingRule } from "@/lib/file-processor"

// Types
export interface ColumnMappingState {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  mappings: ColumnMappingRule[]
  timestamp: number
}

// Store State Interface
interface ColumnMappingStoreState {
  // Independent storage for each data source
  mailAgentMapping: ColumnMappingState | null
  mailSystemMapping: ColumnMappingState | null
  uploadExcelMapping: ColumnMappingState | null
  
  // Actions
  setColumnMapping: (
    dataSource: "mail-agent" | "mail-system" | "upload-excel",
    excelColumns: string[],
    sampleData: Record<string, string[]>,
    mappings: ColumnMappingRule[]
  ) => void
  
  getColumnMapping: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => ColumnMappingState | null
  
  updateMappings: (
    dataSource: "mail-agent" | "mail-system" | "upload-excel",
    mappings: ColumnMappingRule[]
  ) => void
  
  clearColumnMapping: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => void
  
  clearAllColumnMappings: () => void
  
  // Utility to check if mapping exists for a data source
  hasMapping: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => boolean
  
  // Utility to get mapping timestamp
  getMappingTimestamp: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => number | null
}

// Create the store
export const useColumnMappingStore = create<ColumnMappingStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      mailAgentMapping: null,
      mailSystemMapping: null,
      uploadExcelMapping: null,
      
      // Set complete column mapping state
      setColumnMapping: (dataSource, excelColumns, sampleData, mappings) => {
        const mappingState: ColumnMappingState = {
          excelColumns,
          sampleData,
          mappings,
          timestamp: Date.now()
        }
        
        
        set((state) => ({
          ...state,
          [dataSource === 'mail-agent' ? 'mailAgentMapping' : 
           dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping']: mappingState
        }))
      },
      
      // Get column mapping state
      getColumnMapping: (dataSource) => {
        const state = get()
        let mapping = state[dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                           dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping'] || null
        
        // Fallback: If store is empty, try localStorage directly
        if (!mapping && typeof window !== 'undefined') {
          try {
            const localStorageData = localStorage.getItem('column-mapping-storage')
            if (localStorageData) {
              const parsed = JSON.parse(localStorageData)
              const mappingKey = dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                                dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping'
              const directMapping = parsed.state?.[mappingKey]
              if (directMapping) {
                mapping = directMapping
              }
            }
          } catch (error) {
            // Silent fallback
          }
        }
        return mapping
      },
      
      // Update only the mappings (preserve excelColumns and sampleData)
      updateMappings: (dataSource, mappings) => {
        set((state) => {
          const currentMapping = state[dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                                       dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping']
          if (!currentMapping) {
            return state
          }
          
          const updatedMapping = {
            ...currentMapping,
            mappings,
            timestamp: Date.now()
          }
          
          return {
            ...state,
            [dataSource === 'mail-agent' ? 'mailAgentMapping' : 
             dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping']: updatedMapping
          }
        })
      },
      
      // Clear mapping for specific data source
      clearColumnMapping: (dataSource) => {
        set((state) => ({
          ...state,
          [dataSource === 'mail-agent' ? 'mailAgentMapping' : 
           dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping']: null
        }))
      },
      
      // Clear all mappings
      clearAllColumnMappings: () => {
        set({
          mailAgentMapping: null,
          mailSystemMapping: null,
          uploadExcelMapping: null
        })
      },
      
      // Check if mapping exists
      hasMapping: (dataSource) => {
        const state = get()
        return state[dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                    dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping'] !== null
      },
      
      // Get mapping timestamp
      getMappingTimestamp: (dataSource) => {
        const state = get()
        const mapping = state[dataSource === 'mail-agent' ? 'mailAgentMapping' : 
                             dataSource === 'mail-system' ? 'mailSystemMapping' : 'uploadExcelMapping']
        return mapping?.timestamp || null
      }
    }),
    {
      name: 'column-mapping-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist all state
      partialize: (state) => {
        return {
          mailAgentMapping: state.mailAgentMapping,
          mailSystemMapping: state.mailSystemMapping,
          uploadExcelMapping: state.uploadExcelMapping
        }
      }
    }
  )
)
