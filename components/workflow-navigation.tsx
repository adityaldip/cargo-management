"use client"

import { Button } from "@/components/ui/button"
import { FileUp, Users, DollarSign, FileSpreadsheet, Receipt } from "lucide-react"

interface WorkflowNavigationProps {
  activeStep: string
  onStepChange: (step: string) => void
}

export function WorkflowNavigation({ activeStep, onStepChange }: WorkflowNavigationProps) {
  const steps = [
    { id: "import-mail-agent", label: "Import Mail Agent", icon: FileUp },
    { id: "import-mail-system", label: "Import Mail System", icon: FileUp },
    { id: "review-merged-excel", label: "Review Merged Excel", icon: FileSpreadsheet },
    { id: "review-customers", label: "Review Customers", icon: Users },
    { id: "review-rates", label: "Review Rates", icon: DollarSign },
    { id: "review-invoices", label: "Review Invoices", icon: Receipt },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-10">
      <div className="flex flex-col h-full">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4GYJnWyvmaBOUlpBml9mYysmFFHLNN.png"
              alt="airBaltic"
              className="h-8"
            />
          </div>
        </div>

        {/* Navigation Steps */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === step.id
              return (
                <Button
                  key={step.id}
                  variant={isActive ? "default" : "ghost"}
                  size="default"
                  onClick={() => onStepChange(step.id)}
                  className={
                    isActive
                      ? "w-full justify-start bg-black hover:bg-gray-800 text-white px-4 py-3 text-sm font-medium"
                      : "w-full justify-start text-gray-600 hover:text-black hover:bg-gray-100 px-4 py-3 text-sm font-medium"
                  }
                >
                  <div className="flex items-center w-full">
                    <Icon className="h-4 w-4 mr-3" />
                    <span className="flex-1 text-left">{step.label}</span>
                  </div>
                </Button>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
