"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Eye } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { useDataStore } from "@/store/data-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useReviewTabStore } from "@/store/review-tab-store"
import type { ProcessedData } from "@/types/cargo-data"
import { ConfigureColumns, DatabasePreview } from "./assign-custom-modules"

interface ReviewMergedExcelProps {
  mailAgentData: ProcessedData | null
  mailSystemData: ProcessedData | null
  onMergedData: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  // Review tab store for persistence
  const { activeTab, setActiveTab } = useReviewTabStore()
  
  // Data store
  const { clearAllData } = useDataStore()
  
  // Workflow store
  const { isClearingData, isExporting } = useWorkflowStore()

  // Handle clear data
  const handleClearData = async () => {
    try {
      const result = await clearAllData()
      
      if (result.success) {
        console.log(`✅ Successfully cleared all data:`)
        console.log(`- Local storage: ${result.localCleared ? 'cleared' : 'failed'}`)
        console.log(`- Supabase: ${result.supabaseDeletedCount || 0} records deleted`)
        
        alert(`Data cleared successfully!\n- Local storage cleared\n- ${result.supabaseDeletedCount || 0} records deleted from database`)
        
        // Reload page after successful clear
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else if (result.cancelled) {
        console.log('❌ Clear data process was cancelled')
        alert('Clear data process was cancelled')
        
        // Reload page when cancelled
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.error('❌ Failed to clear all data:', result.error)
        alert(`Failed to clear data: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error during clear operation:', error)
      alert(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    if (mailAgentData || mailSystemData) {
      handleMergeData()
    }
  }, [mailAgentData, mailSystemData])

  const handleMergeData = async () => {
    if (!mailAgentData && !mailSystemData) return

    try {
      let combined: ProcessedData
      if (mailAgentData && mailSystemData) {
        combined = combineProcessedData([mailAgentData, mailSystemData])
      } else if (mailAgentData) {
        combined = mailAgentData
      } else {
        combined = mailSystemData!
      }

      onMergedData(combined)
    } catch (error) {
      console.error("Error merging data:", error)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header Navigation */}
      <div className="flex justify-between items-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("configure")}
            disabled={isClearingData || isExporting}
            className={activeTab === "configure" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            disabled={isClearingData || isExporting}
            className={activeTab === "preview" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Database Preview
          </Button>
      </div>

        {/* Continue Button */}
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
            disabled={isClearingData || isExporting}
          >
            Continue to Assign Customers
          </Button>
        </div>

      <div className="space-y-2">
        {/* Configure Columns section */}
        {activeTab === "configure" && (
          <ConfigureColumns onSwitchToPreview={() => setActiveTab("preview")} />
        )}

        {/* Database Preview section */}
        {activeTab === "preview" && (
          <DatabasePreview 
            key={`preview-${activeTab}`}
            onClearData={handleClearData}
          />
        )}
          </div>
    </div>
  )
}
