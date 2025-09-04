"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CustomerManagement } from "./CustomerManagement"
import { RulesConfiguration } from "./RulesConfiguration"
import { ExecuteRules } from "./ExecuteRules"
import { AssignCustomersProps, TabType, ViewType } from "./types"

export function AssignCustomers({ data, savedPriorityConditions, onSavePriorityConditions }: AssignCustomersProps) {
  const [activeTab, setActiveTab] = useState<TabType>("customers")
  const [currentView, setCurrentView] = useState<ViewType>("rules")

  return (
    <div className="space-y-4 pt-2">
      {/* Configure/Execute Tabs - Always Visible */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("customers")
              setCurrentView("rules")
            }}
            className={
              activeTab === "customers"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Customers
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("configure")
              setCurrentView("rules")
            }}
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
            onClick={() => {
              setActiveTab("execute")
              setCurrentView("rules")
            }}
            className={
              activeTab === "execute"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Execute Rules
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {currentView === "rules" && (
        <>
          {/* Configure Customers Tab */}
          {activeTab === "customers" && <CustomerManagement />}

          {/* Configure Rules Tab */}
          {activeTab === "configure" && <RulesConfiguration />}

          {/* Execute Rules Tab */}
          {activeTab === "execute" && (
            <ExecuteRules 
              data={data} 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
          )}
        </>
      )}

      {/* Results View */}
      {currentView === "results" && data && (
        <ExecuteRules 
          data={data} 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
        />
      )}
    </div>
  )
}
