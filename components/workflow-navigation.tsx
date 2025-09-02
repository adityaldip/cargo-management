"use client"

import { Button } from "@/components/ui/button"
import { FileUp, Users, DollarSign, FileSpreadsheet } from "lucide-react"

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
  ]

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4GYJnWyvmaBOUlpBml9mYysmFFHLNN.png"
              alt="airBaltic"
              className="h-8"
            />
          </div>
          <div className="flex items-center gap-0">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = activeStep === step.id
              return (
                <Button
                  key={step.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onStepChange(step.id)}
                  className={
                    isActive
                      ? "bg-black hover:bg-gray-800 text-white rounded-none first:rounded-l-md last:rounded-r-md px-3 py-1 text-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-100 rounded-none first:rounded-l-md last:rounded-r-md border-r border-gray-200 last:border-r-0 px-3 py-1 text-xs"
                  }
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {step.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
