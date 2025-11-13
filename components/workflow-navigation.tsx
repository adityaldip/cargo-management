"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { FileUp, Users, DollarSign, FileSpreadsheet, Receipt, UserCheck, Calculator, BarChart3, Menu, X, Coins, ChevronLeft, ChevronRight } from "lucide-react"
import type { WorkflowStep } from "@/store/workflow-store"

interface WorkflowNavigationProps {
  activeStep: WorkflowStep
  onStepChange: (step: WorkflowStep) => void
  isProcessing?: boolean
  isClearingData?: boolean
  isExporting?: boolean
  isBulkDeleting?: boolean
  isExecutingRules?: boolean
  isMappingAndSaving?: boolean
  onCollapseChange?: (isCollapsed: boolean) => void
}

export function WorkflowNavigation({ activeStep, onStepChange, isProcessing = false, isClearingData = false, isExporting = false, isBulkDeleting = false, isExecutingRules = false, isMappingAndSaving = false, onCollapseChange }: WorkflowNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Track hydration to prevent className mismatches
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Notify parent component when collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed)
  }, [isCollapsed, onCollapseChange])
  
  const steps = [
    { id: "import-mail-agent", label: "Import Mail Agent", icon: FileUp, tooltip: "Upload and verify mail agent Excel files for processing", lighterColor: true },
    { id: "import-mail-system", label: "Import Mail System", icon: FileUp, tooltip: "Upload and verify mail system Excel files for processing", lighterColor: true },
    { id: "review-merged-excel", label: "Import Merged Data", icon: FileSpreadsheet, tooltip: "Import and review data from available sources" },
    // { id: "review-customers", label: "Review Customers", icon: Users, tooltip: "Analyze customer performance and individual data breakdown" },
    { id: "assign-customers", label: "Assign Contractees", icon: UserCheck, tooltip: "Configure automated rules for cargo processing and team assignment" },
    { id: "assign-rates", label: "Assign Rates", icon: Calculator, tooltip: "Configure automated rate assignment rules and pricing calculations" },
    { id: "price-assignment", label: "Price Assignment", icon: Coins, tooltip: "Manage flight pricing, airport codes, and sector rates"},
    { id: "price-assignment-v2", label: "Price Assignment 2.0", icon: Coins, tooltip: "Manage flight pricing, airport codes, and sector rates"},
    { id: "price-assignment-v3", label: "Price Assignment 3.0", icon: Coins, tooltip: "Manage flight pricing, airport codes, and sector rates"},
    // { id: "review-rates", label: "Review Rates", icon: DollarSign, tooltip: "Configure pricing for your routes and manage rate plans." },
    { id: "review-invoices", label: "Review Invoices", icon: Receipt, tooltip: "Review and manage generated invoices from processed cargo data"},
    { id: "reporting", label: "Reporting", icon: BarChart3, tooltip: "View comprehensive reports and analytics for cargo data", lighterColor: true },
  ]

  const handleStepChange = (stepId: WorkflowStep) => {
    // Don't allow navigation when processing, clearing data, exporting, bulk deleting, executing rules, or mapping and saving
    if (isProcessing || isClearingData || isExporting || isBulkDeleting || isExecutingRules || isMappingAndSaving) return
    
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

      {/* Desktop Toggle Button - only show when sidebar is collapsed */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 hidden lg:flex bg-white border-gray-200 shadow-sm"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-60'} lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-2 pt-16 lg:pt-2">
            <div className="flex items-center justify-between">
              {!isCollapsed && <div></div>}
              <div className="flex items-center gap-2">
                {/* Toggle button for desktop */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
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
          </div>

          {/* Processing Status Banner */}
          {/* {(isProcessing || isClearingData) && (
            <div className="px-3 py-2 mx-2 mb-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                <span className="text-xs text-yellow-800 font-medium">
                  {isProcessing ? "Processing in progress..." : "Data is being cleared..."}
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Navigation temporarily disabled
              </p>
            </div>
          )} */}

          {/* Navigation Steps */}
          <nav className="flex-1 px-1">
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon
                // Prevent hydration mismatch by ensuring consistent initial state
                const isActive = isHydrated && activeStep === step.id
                const hasLighterColor = step.lighterColor
                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => handleStepChange(step.id as WorkflowStep)}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg transition-colors ${
                          isProcessing || isClearingData || isExporting || isBulkDeleting || isExecutingRules || isMappingAndSaving
                            ? "cursor-not-allowed opacity-50 text-gray-400" 
                            : isActive 
                              ? "bg-black text-white cursor-pointer" 
                              : hasLighterColor
                                ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
                                : "text-gray-600 hover:text-black hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 text-sm font-medium truncate">{step.label}</span>
                            {step.hasBadge && step.badgeText && (
                              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-800 border-gray-200">
                                {step.badgeText}
                              </Badge>
                            )}
                          </>
                        )}
                        {(isProcessing || isExporting || isExecutingRules || isMappingAndSaving) && !isCollapsed && (
                          <div className="ml-auto">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={`bg-black text-white text-xs whitespace-nowrap ${isCollapsed ? 'block' : 'hidden lg:block'}`}>
                      <p>
                        {isProcessing 
                          ? "Navigation is disabled - processing is in progress" 
                          : isClearingData 
                            ? "Navigation is disabled - data is being cleared"
                            : isExporting
                              ? "Navigation is disabled - exporting data in progress"
                              : isExecutingRules
                                ? "Navigation is disabled - rules are being executed"
                                : isMappingAndSaving
                                  ? "Navigation is disabled - mapping and saving to database"
                                  : step.tooltip
                        }
                      </p>
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
