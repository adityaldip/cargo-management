"use client"
import { useState, useEffect } from "react"
import { WorkflowNavigation } from "@/components/workflow-navigation"
import { ImportMailAgent } from "@/components/import-mail-agent"
import { ImportMailSystem } from "@/components/import-mail-system"
import { ReviewMergedExcel } from "@/components/review-merged-excel"
import { ReviewCustomers } from "@/components/review-customers"
import { AssignCustomers } from "@/components/assign-customers-modules"
import { AssignRates } from "@/components/assign-rates-modules"
import { ReviewRates } from "@/components/review-rates"
import { ReviewInvoices } from "@/components/review-invoices"
import { Reporting } from "@/components/reporting"
import { defaultRateSettings, type RateSettings } from "@/types/rate-settings"
import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, Eye } from "lucide-react"
import { useWorkflowStore } from "@/store/workflow-store"

interface FilterCondition {
  id: string
  field: "office_of_exchange" | "flight_number"
  operator: "is" | "is_not"
  value: string
  customer?: string
}

export function MailProcessingDashboard() {
  const { activeStep, setActiveStep, isProcessing, isClearingData } = useWorkflowStore()
  const [rateSettings, setRateSettings] = useState<RateSettings>(defaultRateSettings)
  const [mailAgentData, setMailAgentData] = useState<ProcessedData | null>(null)
  const [mailSystemData, setMailSystemData] = useState<ProcessedData | null>(null)
  const [mergedData, setMergedData] = useState<ProcessedData | null>(null)
  const [savedPriorityConditions, setSavedPriorityConditions] = useState<FilterCondition[]>([])

  useEffect(() => {
    if (mailAgentData || mailSystemData) {
      const combined = {
        data: [...(mailAgentData?.data || []), ...(mailSystemData?.data || [])],
        summary: {
          totalRecords: (mailAgentData?.summary?.totalRecords || 0) + (mailSystemData?.summary?.totalRecords || 0),
          totalKg: (mailAgentData?.summary?.totalKg || 0) + (mailSystemData?.summary?.totalKg || 0),
          euSubtotal: (mailAgentData?.summary?.euSubtotal || 0) + (mailSystemData?.summary?.euSubtotal || 0),
          nonEuSubtotal: (mailAgentData?.summary?.nonEuSubtotal || 0) + (mailSystemData?.summary?.nonEuSubtotal || 0),
          total: (mailAgentData?.summary?.total || 0) + (mailSystemData?.summary?.total || 0),
        },
        missingFields: [...(mailAgentData?.missingFields || []), ...(mailSystemData?.missingFields || [])],
        warnings: [...(mailAgentData?.warnings || []), ...(mailSystemData?.warnings || [])],
      }
      setMergedData(combined)
    }
  }, [mailAgentData, mailSystemData])

  const renderActiveStep = () => {
    switch (activeStep) {
      case "import-mail-agent":
        return <ImportMailAgent 
          onDataProcessed={setMailAgentData} 
          onContinue={() => setActiveStep("import-mail-system")}
        />
      case "import-mail-system":
        return <ImportMailSystem 
          onDataProcessed={setMailSystemData}
          onContinue={() => setActiveStep("review-merged-excel")}
        />
      case "review-merged-excel":
        return (
          <ReviewMergedExcel
            mailAgentData={mailAgentData}
            mailSystemData={mailSystemData}
            onMergedData={setMergedData}
            onContinue={() => setActiveStep("assign-customers")}
          />
        )
      // case "review-customers":
      //   return (
      //     <ReviewCustomers
      //       data={mergedData}
      //       savedPriorityConditions={savedPriorityConditions}
      //       onSavePriorityConditions={setSavedPriorityConditions}
      //       onContinue={() => setActiveStep("assign-customers")}
      //     />
      //   )
      case "assign-customers":
        return (
          <AssignCustomers
            data={mergedData}
            savedPriorityConditions={savedPriorityConditions}
            onSavePriorityConditions={setSavedPriorityConditions}
          />
        )
      case "assign-rates":
        return (
          <AssignRates
            data={mergedData}
            savedRateConditions={savedPriorityConditions}
            onSaveRateConditions={setSavedPriorityConditions}
          />
        )
      case "review-rates":
        return <ReviewRates settings={rateSettings} onSettingsChange={setRateSettings} data={mergedData} />
      case "review-invoices":
        return <ReviewInvoices data={mergedData} />
      case "reporting":
        return <Reporting data={mergedData} />
      default:
        return <ImportMailAgent onDataProcessed={setMailAgentData} />
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <WorkflowNavigation activeStep={activeStep} onStepChange={setActiveStep} isProcessing={isProcessing} isClearingData={isClearingData} />
      <div className="ml-60 min-h-screen">
        <div className="container mx-auto px-2 py-1">
        {savedPriorityConditions.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-black flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                Priority Conditions Overview
              </CardTitle>
              <p className="text-gray-600 text-xs">Active priority conditions applied across the workflow</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {savedPriorityConditions.map((condition, index) => (
                  <div key={condition.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Badge className="bg-black text-white px-1 py-0.5 text-xs">#{index + 1}</Badge>
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-medium text-black">
                        {condition.field.replace("_", " ")} {condition.operator} "{condition.value}"
                      </div>
                      {condition.customer && <div className="text-gray-600">Customer: {condition.customer}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs text-blue-800">
                  <Filter className="h-3 w-3 inline mr-1" />
                  {savedPriorityConditions.length} active condition{savedPriorityConditions.length !== 1 ? "s" : ""}
                  will be applied when processing customer data
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {renderActiveStep()}
        </div>
      </div>
    </div>
  )
}
