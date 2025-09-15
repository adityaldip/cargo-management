"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { AssignRatesProps } from "@/types/rate-management"
import { SetupRates } from "./SetupRates"
import { ConfigureRates } from "./ConfigureRates"
import { ExecuteRates } from "./ExecuteRates"
import { useAssignRatesTabStore } from "@/store/assign-rates-tab-store"
import { useWorkflowStore } from "@/store/workflow-store"

export function AssignRates({ data, savedRateConditions, onSaveRateConditions, onContinue }: AssignRatesProps) {
  const { activeTab, setActiveTab } = useAssignRatesTabStore()
  const { isExecutingRules, isClearingData, isExporting, isBulkDeleting } = useWorkflowStore()

  return (
    <div className="space-y-4 pt-2">
      {/* Header Navigation */}
      <div className="flex justify-between items-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "setup" ? "default" : "ghost"}
            size="sm"
            onClick={() => !isExecutingRules && setActiveTab("setup")}
            disabled={isExecutingRules}
            className={
              activeTab === "setup"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Set Up Rates
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => !isExecutingRules && setActiveTab("configure")}
            disabled={isExecutingRules}
            className={
              activeTab === "configure"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Rules
          </Button>
          <Button
            variant={activeTab === "execute" ? "default" : "ghost"}
            size="sm"
            onClick={() => !isExecutingRules && setActiveTab("execute")}
            disabled={isExecutingRules}
            className={
              activeTab === "execute"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Execute Rules
          </Button>
        </div>

        {/* Continue Button */}
        {onContinue && (
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
            disabled={isExecutingRules || isClearingData || isExporting || isBulkDeleting}
          >
            Continue to Review Rates
          </Button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "setup" && <SetupRates />}
      {activeTab === "configure" && <ConfigureRates />}
      {activeTab === "execute" && <ExecuteRates />}
    </div>
  )
}
