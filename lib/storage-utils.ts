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

const STORAGE_KEYS = {
  DATASETS: 'cargo-management-datasets',
  CURRENT_SESSION: 'cargo-management-session'
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
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving current session:', error)
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
    
    // Update session to mark as saved to Supabase
    const currentSession = getCurrentSession() || {}
    currentSession.combined = mergedData
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
  const hasBothDatasets = session.mailAgent && session.mailSystem
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
    ].filter(Boolean)
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

// Clear Supabase cargo data (WARNING: This will delete ALL cargo data)
export async function clearSupabaseData(): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    console.log('🗑️ Starting Supabase data clearing process...')
    
    // Get all cargo data first to know how many records we're deleting
    const allDataResult = await cargoDataOperations.getAll(1, 10000) // Get up to 10k records
    
    if (allDataResult.error) {
      return { 
        success: false, 
        error: `Failed to fetch data for deletion: ${allDataResult.error}` 
      }
    }
    
    const totalRecords = allDataResult.data?.length || 0
    console.log(`Found ${totalRecords} records to delete`)
    
    if (totalRecords === 0) {
      return { success: true, deletedCount: 0 }
    }
    
    // Delete records in batches
    let deletedCount = 0
    const batchSize = 50
    
    if (allDataResult.data) {
      for (let i = 0; i < allDataResult.data.length; i += batchSize) {
        const batch = allDataResult.data.slice(i, i + batchSize)
        console.log(`Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allDataResult.data.length/batchSize)} (${batch.length} records)`)
        
        // Delete each record in the batch
        for (const record of batch) {
          const deleteResult = await cargoDataOperations.delete(record.id)
          if (deleteResult.error) {
            console.error(`Failed to delete record ${record.id}:`, deleteResult.error)
            // Continue with other records even if one fails
          } else {
            deletedCount++
          }
        }
      }
    }
    
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
}

// Clear all data (both local storage and Supabase)
export async function clearAllData(): Promise<{ 
  success: boolean
  error?: string
  localCleared: boolean
  supabaseCleared: boolean
  supabaseDeletedCount?: number
}> {
  let localCleared = false
  let supabaseCleared = false
  let supabaseDeletedCount = 0
  const errors: string[] = []
  
  try {
    // Clear local storage first
    clearAllLocalStorage()
    localCleared = true
  } catch (error) {
    errors.push(`Local storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  try {
    // Clear Supabase data
    const supabaseResult = await clearSupabaseData()
    if (supabaseResult.success) {
      supabaseCleared = true
      supabaseDeletedCount = supabaseResult.deletedCount || 0
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
}
