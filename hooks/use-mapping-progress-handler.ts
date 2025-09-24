"use client"

import { useToast } from "@/hooks/use-toast"
import { useStoreManagement } from "./use-store-management"

interface UseMappingProgressHandlerProps {
  dataSource: "upload-excel"
  onSupabaseProgress?: (progress: any) => void
  onComplete: () => void
  onError: () => void
}

export function useMappingProgressHandler({ 
  dataSource, 
  onSupabaseProgress, 
  onComplete, 
  onError 
}: UseMappingProgressHandlerProps) {
  const { toast } = useToast()
  const { clearAllStores, setMappingAndSaving } = useStoreManagement()

  const createProgressHandler = () => {
    return (progress: any) => {
      // Handle mapping completion (before database save)
      if (progress.status === 'mapping-complete') {
        console.log('Mapping processing completed, waiting for database save to begin...')
        return
      }
      
      // Update progress during database save operations
      if (progress.status === 'saving' || progress.status === 'preparing') {
        console.log('Supabase progress update:', progress)
        // Call the onSupabaseProgress callback to update the UI
        if (onSupabaseProgress) {
          onSupabaseProgress(progress)
        }
        return
      }
      
      // Handle database save completion
      if (progress.status === 'completed' && progress.currentCount > 0) {
        toast({
          title: "Save Complete! 🎉",
          description: `Successfully saved ${progress.currentCount.toLocaleString()} records to database.`,
          variant: "default",
        })
        
        // Clean up global progress handler
        if ((window as any).supabaseProgressHandler) {
          delete (window as any).supabaseProgressHandler
        }
        
        // Clear global mapping and saving state
        setMappingAndSaving(false)
        
        // Let the component handle clearing all data via onComplete
        onComplete()
      }
      
      // Handle database save errors
      if (progress.status === 'error') {
        toast({
          title: "Database Save Failed",
          description: "Failed to save data to database. Please try again.",
          variant: "destructive",
        })
        
        // Clean up global progress handler on error
        if ((window as any).supabaseProgressHandler) {
          delete (window as any).supabaseProgressHandler
        }
        
        // Clear global mapping and saving state on error
        setMappingAndSaving(false)
        
        onError()
      }
    }
  }

  const setupProgressHandler = () => {
    if (onSupabaseProgress) {
      const progressHandler = createProgressHandler()
      ;(window as any).supabaseProgressHandler = progressHandler
    }
  }

  const cleanupProgressHandler = () => {
    if ((window as any).supabaseProgressHandler) {
      delete (window as any).supabaseProgressHandler
    }
  }

  return {
    setupProgressHandler,
    cleanupProgressHandler
  }
}
