"use client"

import { useColumnMappingStore } from "@/store/column-mapping-store"
import { useDataStore } from "@/store/data-store"
import { useWorkflowStore } from "@/store/workflow-store"

export function useStoreManagement() {
  const { clearColumnMapping, clearAllColumnMappings } = useColumnMappingStore()
  const { clearUploadSession, clearAllUploadSessions, clearCurrentSession } = useDataStore()
  const { setIsMappingAndSaving } = useWorkflowStore()

  const clearAllStores = (dataSource: "upload-excel") => {
    // Clear specific stores
    clearColumnMapping(dataSource)
    clearUploadSession(dataSource)
    
    // Clear all stores
    clearAllColumnMappings()
    clearAllUploadSessions()
    clearCurrentSession()
    
    // Clear localStorage
    try {
      localStorage.removeItem('column-mapping-storage')
      localStorage.removeItem('cargo-upload-sessions')
      localStorage.removeItem('cargo-data-storage')
      localStorage.removeItem('file-storage')
    } catch (error) {
      // Silent error handling
    }
  }

  const setMappingAndSaving = (isMappingAndSaving: boolean) => {
    setIsMappingAndSaving(isMappingAndSaving)
  }

  return {
    clearAllStores,
    setMappingAndSaving
  }
}
