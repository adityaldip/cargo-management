import type { ProcessedData, CargoData } from "@/types/cargo-data"
import { cargoDataOperations } from "./supabase-operations"
import { combineProcessedData } from "./file-processor"

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

export interface UploadSession {
  fileName: string | null
  processedData: ProcessedData | null
  excelColumns: string[]
  sampleData: Record<string, string[]>
  activeStep: "upload" | "map" | "ignore" | "ignored"
  ignoreRules: any[]
  timestamp: number
}

const STORAGE_KEYS = {
  DATASETS: 'cargo-management-datasets',
  CURRENT_SESSION: 'cargo-management-session',
  UPLOAD_SESSIONS: 'cargo-management-upload-sessions'
}

// Local Storage Operations
export function saveDataset(dataset: StoredDataset): void {
  try {
    const existingDatasets = getStoredDatasets()
    const updatedDatasets = existingDatasets.filter(d => d.id !== dataset.id)
    updatedDatasets.push(dataset)
    
    localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(updatedDatasets))
  } catch (error) {
    console.error('Error saving dataset to localStorage:', error)
    throw new Error('Failed to save dataset to local storage')
  }
}

export function getStoredDatasets(): StoredDataset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DATASETS)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading datasets from localStorage:', error)
    return []
  }
}

export function deleteDataset(id: string): void {
  try {
    const datasets = getStoredDatasets()
    const filtered = datasets.filter(d => d.id !== id)
    localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting dataset:', error)
    throw new Error('Failed to delete dataset')
  }
}

export function getDatasetById(id: string): StoredDataset | null {
  const datasets = getStoredDatasets()
  return datasets.find(d => d.id === id) || null
}

// Session interface
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

// Session Management
export function saveCurrentSession(data: CurrentSession): void {
  try {
    // Create a lightweight version of the session data to avoid quota issues
    const lightweightData: CurrentSession = {
      mailAgent: data.mailAgent ? {
        id: data.mailAgent.id,
        name: data.mailAgent.name,
        type: data.mailAgent.type,
        timestamp: data.mailAgent.timestamp,
        fileName: data.mailAgent.fileName,
        // Don't save the actual data to avoid quota issues
        data: {
          data: [], // Empty data array
          summary: data.mailAgent.data.summary, // Keep summary for reference
          missingFields: [],
          warnings: []
        },
        mappings: data.mailAgent.mappings
      } : undefined,
      mailSystem: data.mailSystem ? {
        id: data.mailSystem.id,
        name: data.mailSystem.name,
        type: data.mailSystem.type,
        timestamp: data.mailSystem.timestamp,
        fileName: data.mailSystem.fileName,
        // Don't save the actual data to avoid quota issues
        data: {
          data: [], // Empty data array
          summary: data.mailSystem.data.summary, // Keep summary for reference
          missingFields: [],
          warnings: []
        },
        mappings: data.mailSystem.mappings
      } : undefined,
      // Don't save combined data to avoid quota issues
      combined: undefined,
      supabaseSaved: data.supabaseSaved
    }
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(lightweightData))
  } catch (error) {
    console.error('Error saving current session:', error)
    // If it's a quota error, try to clear some space and save a minimal version
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        console.log('Quota exceeded, performing emergency cleanup...')
        emergencyCleanup()
        // Save only the essential info
        const minimalData: CurrentSession = {
          supabaseSaved: data.supabaseSaved
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(minimalData))
        console.log('Successfully saved minimal session data after cleanup')
      } catch (retryError) {
        console.error('Failed to save even minimal session data:', retryError)
      }
    }
  }
}

export function getCurrentSession(): CurrentSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error reading current session:', error)
    return null
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
  } catch (error) {
    console.error('Error clearing current session:', error)
  }
}

// Generate unique ID for datasets
export function generateDatasetId(): string {
  return `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Clean old datasets (keep only last 50)
export function cleanOldDatasets(): void {
  try {
    const datasets = getStoredDatasets()
    if (datasets.length > 50) {
      const sorted = datasets.sort((a, b) => b.timestamp - a.timestamp)
      const keep = sorted.slice(0, 50)
      localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(keep))
    }
  } catch (error) {
    console.error('Error cleaning old datasets:', error)
  }
}

// Aggressive cleanup when quota is exceeded
export function emergencyCleanup(): void {
  try {
    console.log('Performing emergency localStorage cleanup...')
    
    // Clear all datasets
    localStorage.removeItem(STORAGE_KEYS.DATASETS)
    
    // Clear upload sessions
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_SESSIONS)
    
    // Keep only minimal session data
    const currentSession = getCurrentSession()
    if (currentSession) {
      const minimalSession: CurrentSession = {
        supabaseSaved: currentSession.supabaseSaved
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(minimalSession))
    }
    
    console.log('Emergency cleanup completed')
  } catch (error) {
    console.error('Error during emergency cleanup:', error)
    // Last resort - clear everything
    try {
      localStorage.clear()
      console.log('Cleared all localStorage as last resort')
    } catch (clearError) {
      console.error('Failed to clear localStorage:', clearError)
    }
  }
}

// Convert CargoData to Supabase format
function convertCargoDataToSupabase(cargoData: CargoData) {
  try {
    return {
      rec_id: String(cargoData.recordId || cargoData.id || '').substring(0, 100), // Ensure string and limit length
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

// Save merged data to Supabase
export async function saveMergedDataToSupabase(
  mailAgentDataset?: StoredDataset,
  mailSystemDataset?: StoredDataset
): Promise<{ success: boolean; error?: string; savedCount?: number }> {
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
    
    // Convert to Supabase format with error handling
    const supabaseData = []
    for (let i = 0; i < mergedData.data.length; i++) {
      try {
        const converted = convertCargoDataToSupabase(mergedData.data[i])
        supabaseData.push(converted)
      } catch (conversionError) {
        console.error(`Error converting record ${i}:`, conversionError, mergedData.data[i])
        // Skip invalid records but continue processing
        continue
      }
    }
    
    console.log(`Converted ${supabaseData.length} records for Supabase`)
    
    if (supabaseData.length === 0) {
      return { success: false, error: "No valid records to save after conversion" }
    }
    
    // Save to Supabase in batches (Supabase has limits)
    const batchSize = 50 // Reduced batch size for better reliability
    let totalSaved = 0
    
    for (let i = 0; i < supabaseData.length; i += batchSize) {
      const batch = supabaseData.slice(i, i + batchSize)
      console.log(`Saving batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(supabaseData.length/batchSize)} (${batch.length} records)`)
      
      const result = await cargoDataOperations.bulkInsert(batch)
      
      if (result.error) {
        console.error('Error saving batch to Supabase:', result.error)
        console.error('Sample batch data:', batch.slice(0, 2)) // Log first 2 records for debugging
        return { 
          success: false, 
          error: `Failed to save batch ${Math.floor(i/batchSize) + 1}: ${result.error}`,
          savedCount: totalSaved 
        }
      }
      
      totalSaved += batch.length
      console.log(`Successfully saved batch. Total saved so far: ${totalSaved}`)
    }
    
    // Update session to mark as saved to Supabase (without saving large data)
    const currentSession = getCurrentSession() || {}
    // Don't save mergedData to avoid quota issues - it's already saved to Supabase
    currentSession.supabaseSaved = {
      timestamp: Date.now(),
      recordCount: totalSaved,
      mailAgent: mailAgentDataset?.fileName,
      mailSystem: mailSystemDataset?.fileName
    }
    saveCurrentSession(currentSession)
    
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
}

// Check if current session has both datasets ready for Supabase save
export function shouldTriggerSupabaseSave(): boolean {
  const session = getCurrentSession()
  if (!session) return false
  
  // Check if we have both datasets and haven't saved to Supabase yet
  const hasBothDatasets = Boolean(session.mailAgent && session.mailSystem)
  const notYetSaved = !session.supabaseSaved
  
  return hasBothDatasets && notYetSaved
}

// Get Supabase save status
export function getSupabaseSaveStatus(): {
  isSaved: boolean
  timestamp?: number
  recordCount?: number
  sources?: string[]
} {
  const session = getCurrentSession()
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
}

// Clear all local storage data
export function clearAllLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DATASETS)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
    console.log('✅ Local storage cleared successfully')
  } catch (error) {
    console.error('Error clearing local storage:', error)
    throw new Error('Failed to clear local storage')
  }
}

// Store the last successful deletion count to handle double calls
let lastSuccessfulDeletionCount = 0
let lastDeletionTimestamp = 0

// Clear Supabase cargo data (WARNING: This will delete ALL cargo data)
export async function clearSupabaseData(
  onProgress?: (progress: number, currentStep: string, stepIndex: number, totalSteps: number) => void,
  shouldStop?: () => boolean
): Promise<{ success: boolean; error?: string; deletedCount?: number; cancelled?: boolean }> {
  try {
    console.log('🗑️ Starting Supabase data clearing process with batch deletion...')
    console.log('🔍 clearSupabaseData called - Stack trace:', new Error().stack)
    
    // Step 1: Get all IDs for batch deletion (more efficient than getting full records)
    onProgress?.(0, "Fetching record IDs from database...", 0, 3)
    
    let allIds: string[] = []
    let currentPage = 1
    let hasMoreData = true
    const fetchBatchSize = 1000 // Large batches for fetching IDs
    
    // Fetch all IDs in large batches
    while (hasMoreData) {
      if (shouldStop?.()) {
        return { success: false, error: "Process cancelled", cancelled: true }
      }
      
      const result = await cargoDataOperations.getAllIds(currentPage, fetchBatchSize)
      
      if (result.error) {
        console.error('Error fetching cargo data IDs:', result.error)
        return { success: false, error: result.error }
      }
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const batchIds = result.data.map(item => item.id)
        allIds = [...allIds, ...batchIds]
        currentPage++
        
        // Update progress during ID fetching (0-20%)
        const fetchProgress = Math.min(20, (allIds.length / 10000) * 20) // Estimate progress
        onProgress?.(fetchProgress, `Fetching IDs... Found ${allIds.length} records`, 0, 3)
      } else {
        hasMoreData = false
      }
      
      // Stop if we've reached the end
      if (result.data && Array.isArray(result.data) && result.data.length < fetchBatchSize) {
        hasMoreData = false
      }
    }
    
    console.log(`Found ${allIds.length} records to delete using batch deletion`)
    
    if (allIds.length === 0) {
      onProgress?.(100, "No data to delete", 2, 3)
      console.log('⚠️ No records found to delete - database might already be empty')
      
      // Check if this is a double call within 5 seconds of a successful deletion
      const now = Date.now()
      if (now - lastDeletionTimestamp < 5000 && lastSuccessfulDeletionCount > 0) {
        console.log(`🔄 Detected double call - returning last successful count: ${lastSuccessfulDeletionCount}`)
        return { success: true, deletedCount: lastSuccessfulDeletionCount }
      }
      
      return { success: true, deletedCount: 0 }
    }
    
    // Step 2: Delete in optimized batches using Supabase's IN operator
    onProgress?.(20, "Starting batch deletion...", 1, 3)
    let deletedCount = 0
    const deleteBatchSize = 500 // Optimal batch size for Supabase deletion
    const totalBatches = Math.ceil(allIds.length / deleteBatchSize)
    
    console.log(`🔄 Starting batch deletion: ${totalBatches} batches of up to ${deleteBatchSize} records each`)
    console.log(`📊 Initial deletedCount: ${deletedCount}`)
    
    // Import supabase client for direct batch operations
    const { supabase } = await import('@/lib/supabase')
    
    for (let i = 0; i < allIds.length; i += deleteBatchSize) {
      if (shouldStop?.()) {
        return { success: false, error: "Process cancelled", cancelled: true, deletedCount }
      }
      
      const batchIds = allIds.slice(i, i + deleteBatchSize)
      const currentBatch = Math.floor(i / deleteBatchSize) + 1
      
      // Real-time progress updates (20-95%)
      const batchProgress = 20 + (currentBatch / totalBatches) * 75
      onProgress?.(
        batchProgress, 
        `Batch ${currentBatch}/${totalBatches}: Deleting ${batchIds.length} records... (${deletedCount} deleted so far)`, 
        1, 
        3
      )
      
      try {
        console.log(`🔄 Executing batch ${currentBatch}/${totalBatches}: Deleting ${batchIds.length} records`)
        
        // Use Supabase's IN operator for efficient batch deletion
        // Note: Supabase's count option might not work reliably with delete operations
        const deleteResult = await supabase
          .from('cargo_data')
          .delete()
          .in('id', batchIds)
        
        if (deleteResult.error) {
          console.error(`❌ Failed to delete batch ${currentBatch}:`, deleteResult.error)
          // Continue with next batch instead of failing completely
        } else {
          // Since delete operation succeeded without error, assume all records in batch were deleted
          console.log(`📊 Batch ${currentBatch} delete result:`, deleteResult)
          
          // For delete operations, Supabase doesn't reliably return count
          // If no error, assume all records in the batch were successfully deleted
          const actualDeletedCount = batchIds.length
            
          deletedCount += actualDeletedCount
          console.log(`✅ Batch ${currentBatch}: Successfully deleted ${actualDeletedCount} records`)
          console.log(`📊 Running total deletedCount: ${deletedCount}`)
        }
      } catch (error) {
        console.error(`❌ Error deleting batch ${currentBatch}:`, error)
        // Continue with next batch
      }
      
      // Small delay to prevent overwhelming the database and allow UI updates
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Use the tracked count from successful batches
    // This should be reliable since we only count successful deletions
    const finalDeletedCount = deletedCount > 0 ? deletedCount : allIds.length
    
    console.log(`📊 Final count calculation:`)
    console.log(`  - Total records to delete: ${allIds.length}`)
    console.log(`  - Tracked deleted count: ${deletedCount}`)
    console.log(`  - Final count to return: ${finalDeletedCount}`)
    
    // Debug: Double-check the values
    console.log(`🔍 Debug values:`)
    console.log(`  - deletedCount type: ${typeof deletedCount}`)
    console.log(`  - deletedCount value: ${deletedCount}`)
    console.log(`  - allIds.length: ${allIds.length}`)
    console.log(`  - finalDeletedCount: ${finalDeletedCount}`)
    
    onProgress?.(100, `Successfully deleted ${finalDeletedCount} records`, 2, 3)
    
    console.log(`✅ Successfully deleted ${finalDeletedCount} out of ${allIds.length} records using batch deletion`)
    console.log(`🔍 Final result being returned: { success: true, deletedCount: ${finalDeletedCount} }`)
    
    // Store successful deletion info for potential double calls
    if (finalDeletedCount > 0) {
      lastSuccessfulDeletionCount = finalDeletedCount
      lastDeletionTimestamp = Date.now()
      console.log(`💾 Stored last successful deletion: ${finalDeletedCount} records at ${lastDeletionTimestamp}`)
    }
    
    return { 
      success: true, 
      deletedCount: finalDeletedCount 
    }
  } catch (error) {
    console.error('❌ Error clearing Supabase data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Clear all data (both local storage and Supabase)
export async function clearAllData(
  onProgress?: (progress: number, currentStep: string, stepIndex: number, totalSteps: number) => void,
  shouldStop?: () => boolean
): Promise<{ 
  success: boolean
  error?: string
  localCleared: boolean
  supabaseCleared: boolean
  supabaseDeletedCount?: number
  cancelled?: boolean
}> {
  let localCleared = false
  let supabaseCleared = false
  let supabaseDeletedCount = 0
  const errors: string[] = []
  
  try {
    // Step 1: Clear local storage first
    onProgress?.(5, "Clearing local storage...", 0, 2)
    
    // Check if should stop before clearing local storage
    if (shouldStop?.()) {
      return { 
        success: false, 
        error: "Process cancelled", 
        localCleared: false, 
        supabaseCleared: false, 
        cancelled: true 
      }
    }
    
    clearAllLocalStorage()
    localCleared = true
    onProgress?.(10, "Local storage cleared successfully", 0, 2)
  } catch (error) {
    errors.push(`Local storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  try {
    // Step 2: Clear Supabase data
    const supabaseResult = await clearSupabaseData((progress, step, stepIndex, totalSteps) => {
      // Map Supabase progress to overall progress (10% to 100%)
      const mappedProgress = 10 + (progress * 0.9)
      onProgress?.(mappedProgress, step, 1, 2)
    }, shouldStop)
    
    if (supabaseResult.success) {
      supabaseCleared = true
      supabaseDeletedCount = supabaseResult.deletedCount || 0
      console.log(`🔍 clearAllData: Received supabaseDeletedCount = ${supabaseDeletedCount} from clearSupabaseData`)
      console.log(`🔍 clearAllData: Full supabaseResult:`, supabaseResult)
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
  
  // Ensure we have a reasonable count for successful operations
  if (supabaseCleared && supabaseDeletedCount === 0) {
    console.log(`⚠️ Warning: Supabase cleared successfully but count is 0. This might indicate a counting issue.`)
  }
  
  const finalResult = {
    success: localCleared && supabaseCleared,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    localCleared,
    supabaseCleared,
    supabaseDeletedCount
  }
  
  console.log(`🔍 clearAllData final result being returned to UI:`, finalResult)
  
  return finalResult
}

// Upload Session Persistence Functions
export function saveUploadSession(dataSource: "mail-agent" | "mail-system", sessionData: UploadSession): void {
  try {
    const existingSessions = getUploadSessions()
    
    // Create a lightweight version of session data for localStorage
    const lightweightSessionData: UploadSession = {
      ...sessionData,
      // Don't store the full processedData in localStorage to avoid quota issues
      processedData: sessionData.processedData ? {
        ...sessionData.processedData,
        data: [] // Remove the actual data array to save space
      } : null
    }
    
    existingSessions[dataSource] = lightweightSessionData
    localStorage.setItem(STORAGE_KEYS.UPLOAD_SESSIONS, JSON.stringify(existingSessions))
  } catch (error) {
    console.error('Error saving upload session to localStorage:', error)
    
    // If quota exceeded, try to clean up old data and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log('localStorage quota exceeded, attempting cleanup...')
      try {
        // Clean up old datasets first
        cleanOldDatasets()
        
        // Try again with even more minimal data
        const existingSessions = getUploadSessions()
        const minimalSessionData: UploadSession = {
          fileName: sessionData.fileName,
          processedData: null, // Don't store any processed data
          excelColumns: sessionData.excelColumns,
          sampleData: sessionData.sampleData,
          activeStep: sessionData.activeStep,
          ignoreRules: sessionData.ignoreRules,
          timestamp: sessionData.timestamp
        }
        
        existingSessions[dataSource] = minimalSessionData
        localStorage.setItem(STORAGE_KEYS.UPLOAD_SESSIONS, JSON.stringify(existingSessions))
        console.log('Successfully saved minimal session data after cleanup')
      } catch (retryError) {
        console.error('Failed to save even minimal session data:', retryError)
        // Don't throw error - just log it and continue
        console.warn('Continuing without saving session data to localStorage')
      }
    } else {
      throw new Error('Failed to save upload session to local storage')
    }
  }
}

export function getUploadSession(dataSource: "mail-agent" | "mail-system"): UploadSession | null {
  try {
    const sessions = getUploadSessions()
    return sessions[dataSource] || null
  } catch (error) {
    console.error('Error reading upload session from localStorage:', error)
    return null
  }
}

export function getUploadSessions(): Record<string, UploadSession> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UPLOAD_SESSIONS)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading upload sessions from localStorage:', error)
    return {}
  }
}

export function clearUploadSession(dataSource: "mail-agent" | "mail-system"): void {
  try {
    const existingSessions = getUploadSessions()
    delete existingSessions[dataSource]
    localStorage.setItem(STORAGE_KEYS.UPLOAD_SESSIONS, JSON.stringify(existingSessions))
  } catch (error) {
    console.error('Error clearing upload session from localStorage:', error)
    
    // If quota exceeded, try to remove the entire key
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(STORAGE_KEYS.UPLOAD_SESSIONS)
        console.log('Cleared upload sessions by removing entire key due to quota')
      } catch (removeError) {
        console.error('Failed to clear upload sessions:', removeError)
      }
    }
  }
}

export function clearAllUploadSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_SESSIONS)
  } catch (error) {
    console.error('Error clearing all upload sessions from localStorage:', error)
  }
}

// Utility function to check localStorage quota and estimate usage
export function checkLocalStorageQuota(): { used: number; available: number; percentage: number } {
  try {
    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // Estimate available space (most browsers have 5-10MB limit)
    const estimatedLimit = 5 * 1024 * 1024 // 5MB
    const available = Math.max(0, estimatedLimit - used)
    const percentage = (used / estimatedLimit) * 100
    
    return { used, available, percentage }
  } catch (error) {
    console.error('Error checking localStorage quota:', error)
    return { used: 0, available: 0, percentage: 0 }
  }
}

// Enhanced storage quota management
export interface StorageQuotaInfo {
  used: number
  available: number
  percentage: number
  isNearLimit: boolean
  isFull: boolean
}

// Progressive cleanup strategies - more aggressive for auto-cleanup
const CLEANUP_STRATEGIES = [
  {
    name: 'cleanup_old_datasets',
    description: 'Remove datasets older than 12 hours',
    execute: () => cleanOldDatasets() // Remove old datasets
  },
  {
    name: 'cleanup_file_storage',
    description: 'Remove stored file data',
    execute: () => {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cargo-file-storage-')) {
          keys.push(key)
        }
      }
      keys.forEach(key => localStorage.removeItem(key))
      return keys.length
    }
  },
  {
    name: 'cleanup_upload_sessions',
    description: 'Clear upload session data',
    execute: () => {
      localStorage.removeItem(STORAGE_KEYS.UPLOAD_SESSIONS)
      return 1
    }
  },
  {
    name: 'cleanup_column_mappings',
    description: 'Remove column mapping cache',
    execute: () => {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('column-mapping')) {
          keys.push(key)
        }
      }
      keys.forEach(key => localStorage.removeItem(key))
      return keys.length
    }
  },
  {
    name: 'cleanup_recent_datasets',
    description: 'Remove datasets older than 6 hours',
    execute: () => cleanOldDatasets() // Remove old datasets (more aggressive)
  },
  {
    name: 'emergency_cleanup',
    description: 'Clear all cargo-related data except essential session info',
    execute: () => {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('cargo') || key.includes('zustand'))) {
          keys.push(key)
        }
      }
      keys.forEach(key => localStorage.removeItem(key))
      return keys.length
    }
  }
]

export function getStorageQuotaInfo(): StorageQuotaInfo {
  try {
    const test = 'test'
    const testKey = 'storage-quota-test'
    
    // Get current usage
    let used = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    }
    
    // Estimate available space by trying to store data
    let available = 0
    try {
      const testData = 'x'.repeat(1024) // 1KB test chunks
      let testSize = 0
      
      while (testSize < 50 * 1024 * 1024) { // Test up to 50MB
        try {
          localStorage.setItem(testKey + testSize, testData)
          testSize += 1024
        } catch (e) {
          break
        }
      }
      
      // Clean up test data
      for (let i = 0; i < testSize; i += 1024) {
        localStorage.removeItem(testKey + i)
      }
      
      available = testSize
    } catch (e) {
      // Fallback estimation
      available = Math.max(0, 5 * 1024 * 1024 - used) // Assume 5MB limit
    }
    
    const total = used + available
    const percentage = total > 0 ? (used / total) * 100 : 0
    
    return {
      used,
      available,
      percentage,
      isNearLimit: percentage > 70, // More aggressive - trigger at 70%
      isFull: percentage > 90 || available < 200 * 1024 // Less than 200KB available
    }
  } catch (error) {
    console.error('Error checking storage quota:', error)
    return { used: 0, available: 0, percentage: 0, isNearLimit: false, isFull: false }
  }
}

export async function performProgressiveCleanup(
  onProgress?: (strategy: string, description: string, itemsRemoved: number) => void
): Promise<{ success: boolean; strategiesUsed: string[]; totalItemsRemoved: number }> {
  const strategiesUsed: string[] = []
  let totalItemsRemoved = 0
  
  for (const strategy of CLEANUP_STRATEGIES) {
    const quotaInfo = getStorageQuotaInfo()
    
    // Stop if we have enough space
    if (!quotaInfo.isFull && quotaInfo.percentage < 70) {
      break
    }
    
    try {
      console.log(`Executing cleanup strategy: ${strategy.name}`)
      strategy.execute()
      strategiesUsed.push(strategy.name)
      totalItemsRemoved += 1 // Count strategies executed
      
      onProgress?.(strategy.name, strategy.description, 1)
      
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error executing cleanup strategy ${strategy.name}:`, error)
    }
  }
  
  const finalQuotaInfo = getStorageQuotaInfo()
  return {
    success: !finalQuotaInfo.isFull,
    strategiesUsed,
    totalItemsRemoved
  }
}

// Enhanced safe localStorage function with progressive cleanup
export async function safeLocalStorageSetItem(
  key: string, 
  value: string,
  onCleanupProgress?: (strategy: string, description: string, itemsRemoved: number) => void
): Promise<{ success: boolean; error?: string; cleanupPerformed?: boolean }> {
  try {
    localStorage.setItem(key, value)
    return { success: true }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`localStorage quota exceeded for key: ${key}`)
      
      // Get storage info
      const quotaInfo = getStorageQuotaInfo()
      console.log('Storage quota info:', quotaInfo)
      
      // Perform progressive cleanup
      const cleanupResult = await performProgressiveCleanup(onCleanupProgress)
      console.log('Cleanup result:', cleanupResult)
      
      if (!cleanupResult.success) {
        return {
          success: false,
          error: `Storage is full. Tried ${cleanupResult.strategiesUsed.length} cleanup strategies but couldn't free enough space.`,
          cleanupPerformed: true
        }
      }
      
      // Try to save again after cleanup
      try {
        localStorage.setItem(key, value)
        console.log('Successfully saved after progressive cleanup')
        return { success: true, cleanupPerformed: true }
      } catch (retryError) {
        console.error('Failed to save even after progressive cleanup:', retryError)
        return {
          success: false,
          error: 'Storage cleanup completed but still unable to save data. Consider reducing data size.',
          cleanupPerformed: true
        }
      }
    } else {
      console.error('Error saving to localStorage:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      }
    }
  }
}

// Function to safely save data with quota management (backward compatibility)
export function safeLocalStorageSetItemSync(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`localStorage quota exceeded for key: ${key}`)
      
      // Try to clean up old data
      try {
        cleanOldDatasets()
        localStorage.setItem(key, value)
        console.log('Successfully saved after cleanup')
        return true
      } catch (retryError) {
        console.error('Failed to save even after cleanup:', retryError)
        return false
      }
    } else {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }
}
