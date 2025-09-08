"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Eye } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { useDataStore } from "@/store/data-store"
import { useWorkflowStore } from "@/store/workflow-store"
import type { ProcessedData } from "@/types/cargo-data"
import { ConfigureColumns, DatabasePreview } from "./assign-custom-modules"

interface ReviewMergedExcelProps {
  mailAgentData: ProcessedData | null
  mailSystemData: ProcessedData | null
  onMergedData: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  const [activeStep, setActiveStep] = useState<"preview" | "configure">("configure")
  
  // Data store
  const { clearAllData } = useDataStore()
  
  // Workflow store
  const { isClearingData } = useWorkflowStore()

  // Handle clear data
  const handleClearData = async () => {
    try {
      const result = await clearAllData()
      
      if (result.success) {
        console.log(`✅ Successfully cleared all data:`)
        console.log(`- Local storage: ${result.localCleared ? 'cleared' : 'failed'}`)
        console.log(`- Supabase: ${result.supabaseDeletedCount || 0} records deleted`)
        
        alert(`Data cleared successfully!\n- Local storage cleared\n- ${result.supabaseDeletedCount || 0} records deleted from database`)
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
            variant={activeStep === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("configure")}
            disabled={isClearingData}
            className={activeStep === "configure" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeStep === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("preview")}
            disabled={isClearingData}
            className={activeStep === "preview" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Database Preview
          </Button>
      </div>

        {/* Continue Button */}
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
            disabled={isClearingData}
          >
            Continue to Assign Customers
          </Button>
        </div>

      <div className="space-y-2">
        {/* Configure Columns section */}
        {activeStep === "configure" && (
          <ConfigureColumns onSwitchToPreview={() => setActiveStep("preview")} />
        )}

        {/* Database Preview section */}
        {activeStep === "preview" && (
          <DatabasePreview 
            onClearData={handleClearData}
          />
        )}
          </div>
    </div>
  )
}
