"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUp, Users, DollarSign, FileSpreadsheet, Receipt, UserCheck, Calculator, BarChart3, Menu, X } from "lucide-react"

type WorkflowStep = 
  | "import-mail-agent"
  | "import-mail-system" 
  | "review-merged-excel"
  | "assign-customers"
  | "assign-rates"
  | "review-rates"
  | "review-invoices"
  | "reporting"

interface WorkflowNavigationProps {
  activeStep: WorkflowStep
  onStepChange: (step: WorkflowStep) => void
}

export function WorkflowNavigation({ activeStep, onStepChange }: WorkflowNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Track hydration to prevent className mismatches
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  const steps = [
    { id: "import-mail-agent", label: "Import Mail Agent", icon: FileUp, tooltip: "Upload and verify mail agent Excel files for processing" },
    { id: "import-mail-system", label: "Import Mail System", icon: FileUp, tooltip: "Upload and verify mail system Excel files for processing" },
    { id: "review-merged-excel", label: "Review Merged Data", icon: FileSpreadsheet, tooltip: "Combine and review data from available sources" },
    // { id: "review-customers", label: "Review Customers", icon: Users, tooltip: "Analyze customer performance and individual data breakdown" },
    { id: "assign-customers", label: "Assign Customers", icon: UserCheck, tooltip: "Configure automated rules for cargo processing and team assignment" },
    { id: "assign-rates", label: "Assign Rates", icon: Calculator, tooltip: "Configure automated rate assignment rules and pricing calculations" },
    // { id: "review-rates", label: "Review Rates", icon: DollarSign, tooltip: "Configure pricing for your routes and manage rate plans." },
    { id: "review-invoices", label: "Review Invoices", icon: Receipt, tooltip: "Review and manage generated invoices from processed cargo data" },
    { id: "reporting", label: "Reporting", icon: BarChart3, tooltip: "View comprehensive reports and analytics for cargo data" },
  ]

  const handleStepChange = (stepId: WorkflowStep) => {
    onStepChange(stepId)
    setIsMobileMenuOpen(false) // Close mobile menu when step is selected
  }

  return (
    <TooltipProvider>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white border-gray-200 shadow-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-40 transition-transform duration-300 ease-in-out w-60 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-2 pt-16 lg:pt-2">
            <div className="flex items-center justify-between">
              <div></div>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Steps */}
          <nav className="flex-1 px-1">
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon
                // Prevent hydration mismatch by ensuring consistent initial state
                const isActive = isHydrated && activeStep === step.id
                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => handleStepChange(step.id as WorkflowStep)}
                        className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-black text-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="ml-3 text-sm font-medium truncate">{step.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black text-white text-xs whitespace-nowrap hidden lg:block">
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
