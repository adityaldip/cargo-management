"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProcessedData, CargoData } from "@/types/cargo-data"
import { cargoDataOperations } from "@/lib/supabase-operations"
import { combineProcessedData } from "@/lib/file-processor"

// Types
export interface StoredDataset {
  id: string
  name: string
  type: "mail-agent" | "mail-system"
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
  combined?: ProcessedData
  supabaseSaved?: {
    timestamp: number
    recordCount: number
    mailAgent?: string
    mailSystem?: string
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
  saveUploadSession: (dataSource: "mail-agent" | "mail-system", sessionData: UploadSession) => void
  getUploadSession: (dataSource: "mail-agent" | "mail-system") => UploadSession | null
  clearUploadSession: (dataSource: "mail-agent" | "mail-system") => void
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
    data: [], // Empty data array
    summary: dataset.data.summary, // Keep summary for reference
    missingFields: [],
    warnings: []
  }
})

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
        safeSaveUploadSession(dataSource, sessionData)
        
        // Update the state as well
        set((state) => ({
          uploadSessions: {
            ...state.uploadSessions,
            [dataSource]: sessionData
          }
        }))
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
          
          // Save to Supabase in batches
          const batchSize = 50
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
        try {
          console.log('🗑️ Starting Supabase data clearing process...')
          
          // Step 1: Get all IDs first
          onProgress?.(0, "Fetching from database...", 0, 3)
          console.log("Getting all record IDs...")
          
          if (shouldStop?.()) {
            return { success: false, error: "Process cancelled", cancelled: true }
          }
          
          // Get all IDs by fetching all pages
          let allIds: string[] = []
          let currentPage = 1
          const pageSize = 1000
          let hasMoreData = true
          
          while (hasMoreData) {
            if (shouldStop?.()) {
              return { success: false, error: "Process cancelled", cancelled: true }
            }
            
            console.log(`🔍 Fetching IDs page ${currentPage} with pageSize ${pageSize}...`)
            const batchResult = await cargoDataOperations.getAllIds(currentPage, pageSize)
            console.log(`📊 Batch result for page ${currentPage}:`, batchResult)
            
            if (batchResult.error) {
              console.error(`❌ Error fetching IDs page ${currentPage}:`, batchResult.error)
              break
            }
            
            const batchIds = Array.isArray(batchResult.data) ? batchResult.data.map(item => item.id) : []
            
            if (batchIds.length === 0) {
              hasMoreData = false
              break
            }
            
            allIds = [...allIds, ...batchIds]
            console.log(`📊 Fetched ${allIds.length} IDs so far... (page ${currentPage})`)
            
            currentPage++
            
            // If we got less than pageSize, we've reached the end
            if (batchIds.length < pageSize) {
              hasMoreData = false
            }
          }
          
          const totalRecords = allIds.length
          console.log(`Found ${totalRecords} records to delete`)
          
          if (totalRecords === 0) {
            onProgress?.(100, "No data to delete", 2, 3)
            return { success: true, deletedCount: 0 }
          }
          
          // Step 2: Delete records in batches (progress bar starts here)
          onProgress?.(0, "Starting deletion process...", 1, 3)
          let deletedCount = 0
          const batchSize = 1000 // Process 1000 records per batch
          const totalBatches = Math.ceil(allIds.length / batchSize)
          
          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            // Check if should stop before each batch
            if (shouldStop?.()) {
              console.log('🛑 Process stopped by user')
              return { success: false, error: "Process cancelled", cancelled: true, deletedCount }
            }
            
            const startIndex = batchIndex * batchSize
            const endIndex = Math.min(startIndex + batchSize, allIds.length)
            const batchIds = allIds.slice(startIndex, endIndex)
            
            console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${batchIds.length} records`)
            
            // Update progress for batch start
            const batchProgress = (batchIndex / totalBatches) * 100
            onProgress?.(
              batchProgress, 
              `Processing batch ${batchIndex + 1}/${totalBatches} (${batchIds.length} records in this batch)`, 
              1, 
              3
            )
            
            // Delete each record in the batch with immediate stop check
            for (let i = 0; i < batchIds.length; i++) {
              const recordId = batchIds[i]
              
              // Check if should stop before each record
              if (shouldStop?.()) {
                console.log('🛑 Process stopped by user during record deletion')
                return { success: false, error: "Process cancelled", cancelled: true, deletedCount }
              }
              
              try {
                // Perform delete operation
                const deleteResult = await cargoDataOperations.delete(recordId) as any
                
                if (deleteResult && !deleteResult.error) {
                  deletedCount++
                  
                  // Check if should stop after successful deletion
                  if (shouldStop?.()) {
                    console.log('🛑 Process stopped by user after successful deletion')
                    return { success: false, error: "Process cancelled", cancelled: true, deletedCount }
                  }
                  
                  // Update progress after each successful deletion
                  const progress = (deletedCount / allIds.length) * 100
                  const remainingRecords = allIds.length - deletedCount
                  
                  onProgress?.(
                    progress, 
                    `Batch ${batchIndex + 1}/${totalBatches}: Deleted ${deletedCount}/${allIds.length} records (${remainingRecords} remaining)`, 
                    1, 
                    3
                  )
                  
                  // Log every 100 deletions for performance
                  if (deletedCount % 100 === 0) {
                    console.log(`✅ Batch ${batchIndex + 1}/${totalBatches}: Deleted ${deletedCount}/${allIds.length} records`)
                  }
                } else if (deleteResult && deleteResult.error) {
                  console.error(`Failed to delete record ${recordId}:`, deleteResult.error)
                }
              } catch (deleteError: any) {
                console.error(`Error deleting record ${recordId}:`, deleteError)
                // Continue with next record instead of stopping the entire process
              }
            }
            
            // Log batch completion
            console.log(`✅ Completed batch ${batchIndex + 1}/${totalBatches}: Deleted ${batchIds.length} records`)
          }
          
          // Step 3: Complete
          onProgress?.(100, `Successfully deleted ${deletedCount} records`, 2, 3)
          console.log(`✅ Successfully deleted ${deletedCount} records from Supabase`)
          return { 
            success: true, 
            deletedCount 
          }
        } catch (error) {
          console.error('❌ Error clearing Supabase data:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
          }
        }
      },
      
      clearAllData: async (onProgress, shouldStop) => {
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
      partialize: (state) => ({
        datasets: state.datasets.map(createLightweightDataset),
        currentSession: state.currentSession ? {
          mailAgent: state.currentSession.mailAgent ? createLightweightDataset(state.currentSession.mailAgent) : undefined,
          mailSystem: state.currentSession.mailSystem ? createLightweightDataset(state.currentSession.mailSystem) : undefined,
          supabaseSaved: state.currentSession.supabaseSaved
        } : null,
        uploadSessions: state.uploadSessions
      })
    }
  )
)
