"use client"

import { Button } from "@/components/ui/button"
import { CustomerManagement } from "./CustomerManagement"
import { RulesConfiguration } from "./RulesConfiguration"
import { ExecuteRules } from "./ExecuteRules"
import { AssignCustomersProps } from "./types"
import { useAssignCustomersTabStore } from "@/store/assign-customers-tab-store"
import { useWorkflowStore } from "@/store/workflow-store"

export function AssignCustomers({ data, savedPriorityConditions, onSavePriorityConditions }: AssignCustomersProps) {
  const { 
    activeTab, 
    currentView, 
    setActiveTab, 
    setCurrentView 
  } = useAssignCustomersTabStore()
  
  const { isExecutingRules } = useWorkflowStore()

  return (
    <div className="space-y-4 pt-2">
      {/* Configure/Execute Tabs - Always Visible */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (!isExecutingRules) {
                setActiveTab("customers")
                setCurrentView("rules")
              }
            }}
            disabled={isExecutingRules}
            className={
              activeTab === "customers"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Contractees
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (!isExecutingRules) {
                setActiveTab("configure")
                setCurrentView("rules")
              }
            }}
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
            onClick={() => {
              if (!isExecutingRules) {
                setActiveTab("execute")
                setCurrentView("rules")
              }
            }}
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
      </div>

      {/* Tab Content */}
      {currentView === "rules" && (
        <>
          {/* Configure Contractees Tab */}
          {activeTab === "customers" && <CustomerManagement />}

          {/* Configure Rules Tab */}
          {activeTab === "configure" && <RulesConfiguration />}

          {/* Execute Rules Tab */}
          {activeTab === "execute" && (
            <ExecuteRules 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
          )}
        </>
      )}

      {/* Results View */}
      {currentView === "results" && data && (
        <ExecuteRules 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
        />
      )}
    </div>
  )
}
