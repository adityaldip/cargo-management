"use client"

import { Button } from "@/components/ui/button"
import { Flights } from "./Flights"
import { AirportCodes } from "./AirportCodes"
import { SectorRates } from "./SectorRates"
import { Preview } from "./Preview"
import { PriceAssignmentProps } from "./types"
import { usePriceAssignmentTabStore } from "@/store/price-assignment-tab-store"

export function PriceAssignment({ data, onSave, onExecute }: PriceAssignmentProps) {
  const { 
    activeTab, 
    currentView, 
    setActiveTab, 
    setCurrentView 
  } = usePriceAssignmentTabStore()

  return (
    <div className="space-y-4 pt-2">
      {/* Tab Navigation - Always Visible */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
        <Button
            variant={activeTab === "airport-codes" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("airport-codes")
              setCurrentView("main")
            }}
            className={
              activeTab === "airport-codes"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Airport Codes
          </Button>
          <Button
            variant={activeTab === "flights" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("flights")
              setCurrentView("main")
            }}
            className={
              activeTab === "flights"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Flights
          </Button>
          <Button
            variant={activeTab === "sector-rates" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("sector-rates")
              setCurrentView("main")
            }}
            className={
              activeTab === "sector-rates"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Sector Rates
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("preview")
              setCurrentView("main")
            }}
            className={
              activeTab === "preview"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Upload File
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {currentView === "main" && (
        <>
          {/* Flights Tab */}
          {activeTab === "flights" && <Flights />}

          {/* Airport Codes Tab */}
          {activeTab === "airport-codes" && <AirportCodes />}

          {/* Sector Rates Tab */}
          {activeTab === "sector-rates" && <SectorRates />}

          {/* Preview Tab */}
          {activeTab === "preview" && <Preview />}
        </>
      )}

      {/* Results View */}
      {currentView === "results" && data && (
        <Preview />
      )}
    </div>
  )
}
