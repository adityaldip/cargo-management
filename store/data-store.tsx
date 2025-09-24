"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProcessedData, CargoData } from "@/types/cargo-data"
import { cargoDataOperations } from "@/lib/supabase-operations"
import { combineProcessedData } from "@/lib/file-processor"
import { clearSupabaseData, clearFilteredSupabaseData } from "@/lib/storage-utils"

// Types
export interface StoredDataset {
  id: string
  name: string
  type: "mail-agent" | "mail-system" | "upload-excel"
  data: ProcessedData
  mappings: ColumnMapping[]
  timestamp: number
  fileName: string
}

export interface ColumnMapping {
  excelColumn: string
  mappedTo: string | null
  finalColumn: string
  status: "mapped" | "unmapped" | "warning"
  sampleData: string[]
}

export interface CurrentSession {
  mailAgent?: StoredDataset
  mailSystem?: StoredDataset
  uploadExcel?: StoredDataset
  combined?: ProcessedData
  supabaseSaved?: {
    timestamp: number
    recordCount: number
    mailAgent?: string
    mailSystem?: string
    uploadExcel?: string
  }
}

export interface UploadSession {
  fileName: string | null
  processedData: ProcessedData | null
  excelColumns: string[]
  sampleData: Record<string, string[]>
  activeStep: "upload" | "map" | "ignore" | "ignored"
  ignoreRules: any[]
  timestamp: number
}

// Store State Interface
interface DataState {
  // Datasets
  datasets: StoredDataset[]
  currentSession: CurrentSession | null
  uploadSessions: Record<string, UploadSession>
  
  // Actions - Datasets
  addDataset: (dataset: StoredDataset) => void
  updateDataset: (id: string, dataset: Partial<StoredDataset>) => void
  deleteDataset: (id: string) => void
  getDatasetById: (id: string) => StoredDataset | null
  
  // Actions - Session
  setCurrentSession: (session: CurrentSession) => void
  updateCurrentSession: (updates: Partial<CurrentSession>) => void
  clearCurrentSession: () => void
  
  // Actions - Upload Sessions
  saveUploadSession: (dataSource: "mail-agent" | "mail-system" | "upload-excel", sessionData: UploadSession) => void
  getUploadSession: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => UploadSession | null
  clearUploadSession: (dataSource: "mail-agent" | "mail-system" | "upload-excel") => void
  clearAllUploadSessions: () => void
  
  // Actions - Supabase Operations
  saveMergedDataToSupabase: (
    mailAgentDataset?: StoredDataset,
    mailSystemDataset?: StoredDataset
  ) => Promise<{ success: boolean; error?: string; savedCount?: number }>
  
  clearSupabaseData: (
    onProgress?: (progress: number, currentStep: string, stepIndex: number, totalSteps: number) => void,
    shouldStop?: () => boolean
  ) => Promise<{ success: boolean; error?: string; deletedCount?: number; cancelled?: boolean }>
  
  clearFilteredSupabaseData: (
    filters?: string,
    filterLogic?: string,
    onProgress?: (progress: number, currentStep: string, stepIndex: number, totalSteps: number) => void,
    shouldStop?: () => boolean
  ) => Promise<{ success: boolean; error?: string; deletedCount?: number; cancelled?: boolean }>
  
  clearAllData: (
    onProgress?: (progress: number, currentStep: string, stepIndex: number, totalSteps: number) => void,
    shouldStop?: () => boolean
  ) => Promise<{ 
    success: boolean
    error?: string
    localCleared: boolean
    supabaseCleared: boolean
    supabaseDeletedCount?: number
    cancelled?: boolean
  }>
  
  // Utility Actions
  generateDatasetId: () => string
  shouldTriggerSupabaseSave: () => boolean
  getSupabaseSaveStatus: () => {
    isSaved: boolean
    timestamp?: number
    recordCount?: number
    sources?: string[]
  }
  
  // Cleanup Actions
  cleanOldDatasets: () => void
  emergencyCleanup: () => void
}

// Helper function to create lightweight dataset (avoid quota issues)
const createLightweightDataset = (dataset: StoredDataset): StoredDataset => ({
  ...dataset,
  data: {
    data: [], // Empty data array to save space
    summary: dataset.data.summary, // Keep summary for reference
    missingFields: dataset.data.missingFields?.slice(0, 10) || [], // Limit missing fields
    warnings: dataset.data.warnings?.slice(0, 10) || [] // Limit warnings
  }
})

// Helper function to create ultra-lightweight dataset for extreme quota situations
const createUltraLightweightDataset = (dataset: StoredDataset): StoredDataset => ({
  id: dataset.id,
  name: dataset.name,
  type: dataset.type,
  timestamp: dataset.timestamp,
  fileName: dataset.fileName,
  data: {
    data: [],
    summary: {
      totalRows: dataset.data.summary.totalRows,
      validRows: dataset.data.summary.validRows,
      invalidRows: dataset.data.summary.invalidRows
    },
    missingFields: [],
    warnings: []
  },
  mappings: dataset.mappings.map(m => ({
    excelColumn: m.excelColumn,
    mappedTo: m.mappedTo,
    finalColumn: m.finalColumn,
    status: m.status,
    sampleData: [] // Remove sample data to save space
  }))
})

// Helper function to estimate dataset size in localStorage
const estimateDatasetSize = (dataset: StoredDataset): number => {
  try {
    return JSON.stringify(dataset).length * 2 // Rough estimate (UTF-16)
  } catch {
    return 0
  }
}

// Helper function to convert CargoData to Supabase format
const convertCargoDataToSupabase = (cargoData: CargoData) => {
  try {
    return {
      rec_id: String(cargoData.recordId || cargoData.id || '').substring(0, 100),
      inb_flight_date: String(cargoData.date || '').substring(0, 50),
      outb_flight_date: String(cargoData.outbDate || '').substring(0, 50),
      des_no: String(cargoData.desNo || '').substring(0, 20),
      rec_numb: String(cargoData.recNumb || '').substring(0, 10),
      orig_oe: String(cargoData.origOE || '').substring(0, 10),
      dest_oe: String(cargoData.destOE || '').substring(0, 10),
      inb_flight_no: String(cargoData.inbFlightNo || '').substring(0, 20),
      outb_flight_no: String(cargoData.outbFlightNo || '').substring(0, 20),
      mail_cat: String(cargoData.mailCat || '').substring(0, 5),
      mail_class: String(cargoData.mailClass || '').substring(0, 10),
      total_kg: Number(cargoData.totalKg) || 0,
      invoice: String(cargoData.invoiceExtend || '').substring(0, 50),
      customer_name_number: cargoData.customer ? String(cargoData.customer).substring(0, 200) : null,
      assigned_customer: null,
      assigned_rate: cargoData.totalEur ? Number(cargoData.totalEur) : null,
      rate_currency: cargoData.totalEur ? 'EUR' : null,
      processed_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error converting cargo data to Supabase format:', error, cargoData)
    throw error
  }
}

// Create the store
export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Initial state
      datasets: [],
      currentSession: null,
      uploadSessions: {},
      
      // Dataset actions
      addDataset: (dataset) => set((state) => ({
        datasets: [...state.datasets.filter(d => d.id !== dataset.id), dataset]
      })),
      
      updateDataset: (id, updates) => set((state) => ({
        datasets: state.datasets.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      
      deleteDataset: (id) => set((state) => ({
        datasets: state.datasets.filter(d => d.id !== id)
      })),
      
      getDatasetById: (id) => {
        const state = get()
        return state.datasets.find(d => d.id === id) || null
      },
      
      // Session actions
      setCurrentSession: (session) => set({ currentSession: session }),
      
      updateCurrentSession: (updates) => set((state) => ({
        currentSession: state.currentSession ? { ...state.currentSession, ...updates } : updates
      })),
      
      clearCurrentSession: () => set({ currentSession: null }),
      
      // Upload session actions
      saveUploadSession: (dataSource, sessionData) => {
        // Use the safe localStorage function from storage-utils
        const { saveUploadSession: safeSaveUploadSession } = require('@/lib/storage-utils')
        
        try {
          safeSaveUploadSession(dataSource, sessionData)
          
          // Update the state as well
          set((state) => ({
            uploadSessions: {
              ...state.uploadSessions,
              [dataSource]: sessionData
            }
          }))
        } catch (error) {
          console.error('Error saving upload session:', error)
          // Continue without throwing to prevent UI breaks
        }
      },
      
      getUploadSession: (dataSource) => {
        const state = get()
        return state.uploadSessions[dataSource] || null
      },
      
      clearUploadSession: (dataSource) => set((state) => {
        const newSessions = { ...state.uploadSessions }
        delete newSessions[dataSource]
        return { uploadSessions: newSessions }
      }),
      
      clearAllUploadSessions: () => set({ uploadSessions: {} }),
      
      // Supabase operations
      saveMergedDataToSupabase: async (mailAgentDataset, mailSystemDataset) => {
        try {
          console.log('Starting Supabase save process...', { 
            hasMailAgent: !!mailAgentDataset, 
            hasMailSystem: !!mailSystemDataset 
          })

          if (!mailAgentDataset && !mailSystemDataset) {
            return { success: false, error: "No datasets provided" }
          }

          // Combine the datasets
          const datasets = []
          if (mailAgentDataset) {
            console.log('Adding mail agent data:', mailAgentDataset.data.summary)
            datasets.push(mailAgentDataset.data)
          }
          if (mailSystemDataset) {
            console.log('Adding mail system data:', mailSystemDataset.data.summary)
            datasets.push(mailSystemDataset.data)
          }
          
          // Handle upload-excel type datasets
          if (mailAgentDataset && mailAgentDataset.type === "upload-excel") {
            console.log('Processing upload-excel dataset:', mailAgentDataset.data.summary)
            datasets.push(mailAgentDataset.data)
          }
          if (mailSystemDataset && mailSystemDataset.type === "upload-excel") {
            console.log('Processing upload-excel dataset:', mailSystemDataset.data.summary)
            datasets.push(mailSystemDataset.data)
          }
          
          const mergedData = datasets.length > 1 ? combineProcessedData(datasets) : datasets[0]
          console.log('Merged data summary:', mergedData.summary)
          
          // Convert to Supabase format
          const supabaseData = []
          for (let i = 0; i < mergedData.data.length; i++) {
            try {
              const converted = convertCargoDataToSupabase(mergedData.data[i])
              supabaseData.push(converted)
            } catch (conversionError) {
              console.error(`Error converting record ${i}:`, conversionError, mergedData.data[i])
              continue
            }
          }
          
          console.log(`Converted ${supabaseData.length} records for Supabase`)
          
          if (supabaseData.length === 0) {
            return { success: false, error: "No valid records to save after conversion" }
          }
          
          // Save to Supabase in batches (optimized for 5MB payload limit)
          const batchSize = 2000 // Conservative estimate: ~250 bytes per record = ~500KB per batch
          let totalSaved = 0
          
          for (let i = 0; i < supabaseData.length; i += batchSize) {
            const batch = supabaseData.slice(i, i + batchSize)
            console.log(`Saving batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(supabaseData.length/batchSize)} (${batch.length} records)`)
            
            const result = await cargoDataOperations.bulkInsert(batch)
            
            if (result.error) {
              console.error('Error saving batch to Supabase:', result.error)
              return { 
                success: false, 
                error: `Failed to save batch ${Math.floor(i/batchSize) + 1}: ${result.error}`,
                savedCount: totalSaved 
              }
            }
            
            totalSaved += batch.length
            console.log(`Successfully saved batch. Total saved so far: ${totalSaved}`)
          }
          
          // Update session to mark as saved to Supabase
          const state = get()
          const currentSession = state.currentSession || {}
          currentSession.supabaseSaved = {
            timestamp: Date.now(),
            recordCount: totalSaved,
            mailAgent: mailAgentDataset?.fileName,
            mailSystem: mailSystemDataset?.fileName
          }
          
          set({ currentSession })
          
          console.log(`Successfully saved ${totalSaved} records to Supabase`)
          return { 
            success: true, 
            savedCount: totalSaved 
          }
        } catch (error) {
          console.error('Error saving merged data to Supabase:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
          }
        }
      },
      
      clearSupabaseData: async (onProgress, shouldStop) => {
        // Use the utility function from storage-utils
        return clearSupabaseData(onProgress, shouldStop)
      },

      clearFilteredSupabaseData: async (filters, filterLogic, onProgress, shouldStop) => {
        // Use the utility function from storage-utils
        return clearFilteredSupabaseData(filters, filterLogic, onProgress, shouldStop)
      },
      
      clearAllData: async (onProgress, shouldStop) => {
        console.log('🔍 clearAllData called from data store')
        let localCleared = false
        let supabaseCleared = false
        let supabaseDeletedCount = 0
        const errors: string[] = []
        
        try {
          // Step 1: Clear local storage first (no progress bar update)
          console.log("Clearing data from local storage...")
          
          if (shouldStop?.()) {
            return { 
              success: false, 
              error: "Process cancelled", 
              localCleared: false, 
              supabaseCleared: false, 
              cancelled: true 
            }
          }
          
          // Clear Zustand store
          set({ 
            datasets: [], 
            currentSession: null, 
            uploadSessions: {} 
          })
          localCleared = true
          // Don't show progress for local storage clearing
        } catch (error) {
          errors.push(`Local storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        try {
          // Step 2: Clear Supabase data
          console.log('🗑️ Starting Supabase data clearing...')
          const supabaseResult = await get().clearSupabaseData((progress, step, stepIndex, totalSteps) => {
            // Map progress from 1-100% to 0-100% (no offset for local storage)
            const mappedProgress = progress
            console.log(`📊 Supabase progress: ${progress}% -> ${mappedProgress}% - ${step}`)
            onProgress?.(mappedProgress, step, 1, 2)
          }, shouldStop)
          
          console.log('📊 Supabase result:', supabaseResult)
          
          if (supabaseResult.success) {
            supabaseCleared = true
            supabaseDeletedCount = supabaseResult.deletedCount || 0
          } else if (supabaseResult.cancelled) {
            return {
              success: false,
              error: supabaseResult.error,
              localCleared,
              supabaseCleared: false,
              supabaseDeletedCount: supabaseResult.deletedCount || 0,
              cancelled: true
            }
          } else {
            errors.push(`Supabase: ${supabaseResult.error}`)
          }
        } catch (error) {
          errors.push(`Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        return {
          success: localCleared && supabaseCleared,
          error: errors.length > 0 ? errors.join('; ') : undefined,
          localCleared,
          supabaseCleared,
          supabaseDeletedCount
        }
      },
      
      // Utility functions
      generateDatasetId: () => `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      shouldTriggerSupabaseSave: () => {
        const state = get()
        const session = state.currentSession
        if (!session) return false
        
        const hasBothDatasets = Boolean(session.mailAgent && session.mailSystem)
        const notYetSaved = !session.supabaseSaved
        
        return hasBothDatasets && notYetSaved
      },
      
      getSupabaseSaveStatus: () => {
        const state = get()
        const session = state.currentSession
        if (!session?.supabaseSaved) {
          return { isSaved: false }
        }
        
        return {
          isSaved: true,
          timestamp: session.supabaseSaved.timestamp,
          recordCount: session.supabaseSaved.recordCount,
          sources: [
            session.supabaseSaved.mailAgent,
            session.supabaseSaved.mailSystem
          ].filter(Boolean) as string[]
        }
      },
      
      // Cleanup functions
      cleanOldDatasets: () => set((state) => {
        if (state.datasets.length > 50) {
          const sorted = state.datasets.sort((a, b) => b.timestamp - a.timestamp)
          return { datasets: sorted.slice(0, 50) }
        }
        return state
      }),
      
      emergencyCleanup: () => set({
        datasets: [],
        currentSession: null,
        uploadSessions: {}
      })
    }),
    {
      name: 'cargo-data-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data to avoid quota issues
      partialize: (state) => {
        try {
          // Create lightweight version first
          const lightweightState = {
            datasets: state.datasets.map(createLightweightDataset),
            currentSession: state.currentSession ? {
              mailAgent: state.currentSession.mailAgent ? createLightweightDataset(state.currentSession.mailAgent) : undefined,
              mailSystem: state.currentSession.mailSystem ? createLightweightDataset(state.currentSession.mailSystem) : undefined,
              supabaseSaved: state.currentSession.supabaseSaved
            } : null,
            uploadSessions: state.uploadSessions
          }
          
          // Check estimated size
          const estimatedSize = JSON.stringify(lightweightState).length * 2
          const maxSize = 2 * 1024 * 1024 // 2MB threshold
          
          if (estimatedSize > maxSize) {
            console.warn('State too large for localStorage, using ultra-lightweight version')
            return {
              datasets: state.datasets.map(createUltraLightweightDataset),
              currentSession: state.currentSession ? {
                mailAgent: state.currentSession.mailAgent ? createUltraLightweightDataset(state.currentSession.mailAgent) : undefined,
                mailSystem: state.currentSession.mailSystem ? createUltraLightweightDataset(state.currentSession.mailSystem) : undefined,
                supabaseSaved: state.currentSession.supabaseSaved
              } : null,
              uploadSessions: {} // Clear upload sessions in extreme cases
            }
          }
          
          return lightweightState
        } catch (error) {
          console.error('Error creating persistent state:', error)
          // Return minimal state in case of error
          return {
            datasets: [],
            currentSession: null,
            uploadSessions: {}
          }
        }
      },
      // Handle storage errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating storage:', error)
          // Continue with empty state rather than crashing
        }
      }
    }
  )
)
