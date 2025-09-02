"use client"
import { useState, useEffect } from "react"
import { WorkflowNavigation } from "@/components/workflow-navigation"
import { ImportMailAgent } from "@/components/import-mail-agent"
import { ImportMailSystem } from "@/components/import-mail-system"
import { ReviewMergedExcel } from "@/components/review-merged-excel"
import { ReviewCustomers } from "@/components/review-customers"
import { ReviewRates } from "@/components/review-rates"
import { ReviewInvoices } from "@/components/review-invoices"
import { defaultRateSettings, type RateSettings } from "@/types/rate-settings"
import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, Eye } from "lucide-react"

interface FilterCondition {
  id: string
  field: "office_of_exchange" | "flight_number"
  operator: "is" | "is_not"
  value: string
  customer?: string
}

export function MailProcessingDashboard() {
  const [activeStep, setActiveStep] = useState("import-mail-agent")
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
        return <ImportMailAgent onDataProcessed={setMailAgentData} />
      case "import-mail-system":
        return <ImportMailSystem onDataProcessed={setMailSystemData} />
      case "review-merged-excel":
        return (
          <ReviewMergedExcel
            mailAgentData={mailAgentData}
            mailSystemData={mailSystemData}
            onMergedData={setMergedData}
          />
        )
      case "review-customers":
        return (
          <ReviewCustomers
            data={mergedData}
            savedPriorityConditions={savedPriorityConditions}
            onSavePriorityConditions={setSavedPriorityConditions}
          />
        )
      case "review-rates":
        return <ReviewRates settings={rateSettings} onSettingsChange={setRateSettings} data={mergedData} />
      case "review-invoices":
        return <ReviewInvoices data={mergedData} />
      default:
        return <ImportMailAgent onDataProcessed={setMailAgentData} />
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <WorkflowNavigation activeStep={activeStep} onStepChange={setActiveStep} />
      <div className="ml-64 min-h-screen">
        <div className="container mx-auto px-6 py-8">
        {savedPriorityConditions.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Priority Conditions Overview
              </CardTitle>
              <p className="text-gray-600 text-sm">Active priority conditions applied across the workflow</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedPriorityConditions.map((condition, index) => (
                  <div key={condition.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-black text-white px-2 py-1 text-xs">Priority {index + 1}</Badge>
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-black">
                        {condition.field.replace("_", " ")} {condition.operator} "{condition.value}"
                      </div>
                      {condition.customer && <div className="text-gray-600">Customer: {condition.customer}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <Filter className="h-4 w-4 inline mr-1" />
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
