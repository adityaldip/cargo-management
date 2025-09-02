"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUp, Users, DollarSign, FileSpreadsheet, Receipt, UserCheck, Calculator } from "lucide-react"

interface WorkflowNavigationProps {
  activeStep: string
  onStepChange: (step: string) => void
}

export function WorkflowNavigation({ activeStep, onStepChange }: WorkflowNavigationProps) {
  const steps = [
    { id: "import-mail-agent", label: "Import Mail Agent", icon: FileUp, tooltip: "Upload and verify mail agent Excel files for processing" },
    { id: "import-mail-system", label: "Import Mail System", icon: FileUp, tooltip: "Upload and verify mail system Excel files for processing" },
    { id: "review-merged-excel", label: "Review Merged Excel", icon: FileSpreadsheet, tooltip: "Combine and review data from available sources" },
    { id: "review-customers", label: "Review Customers", icon: Users, tooltip: "Analyze customer performance and individual data breakdown" },
    { id: "assign-customers", label: "Assign Customers", icon: UserCheck, tooltip: "Configure automated rules for cargo processing and team assignment" },
    { id: "assign-rates", label: "Assign Rates", icon: Calculator, tooltip: "Configure automated rate assignment rules and pricing calculations" },
    { id: "review-rates", label: "Review Rates", icon: DollarSign, tooltip: "Configure pricing for your routes and manage rate plans." },
    { id: "review-invoices", label: "Review Invoices", icon: Receipt, tooltip: "Review and manage generated invoices from processed cargo data" },
  ]

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 z-10">
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-2">
            <div className="flex items-center">
            </div>
          </div>

          {/* Navigation Steps */}
          <nav className="flex-1 px-1">
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = activeStep === step.id
                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => onStepChange(step.id)}
                        className={`
                          flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                          ${isActive 
                            ? "bg-black text-white" 
                            : "text-gray-600 hover:text-black hover:bg-gray-50"
                          }
                        `}
                      >
                        {/* <Icon className="h-4 w-4" /> */}
                        <span className="ml-3 text-sm font-medium">{step.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black text-white text-xs whitespace-nowrap">
                      <p>{step.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
