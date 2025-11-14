"use client"

import { Button } from "@/components/ui/button"
import { Flights } from "@/components/price-assignment-modules/Flights"
import { AirportCodes } from "@/components/price-assignment-modules/AirportCodes"
import { Preview } from "@/components/price-assignment-modules/Preview"
import { PriceAssignmentProps } from "@/components/price-assignment-modules/types"
import { usePriceAssignmentV3TabStore } from "@/store/price-assignment-v3-tab-store"
import { CustomerManagement } from "@/components/assign-customers-modules/CustomerManagement"
import { SectorRatesV3 } from "./SectorRatesV3"
import { PreviewV3 } from "./PreviewV3"

export function PriceAssignmentV3Modules({ data, onSave, onExecute }: PriceAssignmentProps) {
  const { 
    activeTab, 
    currentView, 
    setActiveTab, 
    setCurrentView 
  } = usePriceAssignmentV3TabStore()

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
            variant={activeTab === "customer-management" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("customer-management")
              setCurrentView("main")
            }}
            className={
              activeTab === "customer-management"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Customers
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
            Sector Rate
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
            Preview
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

          {/* Customer Management Tab */}
          {activeTab === "customer-management" && <CustomerManagement />}

          {/* Sector Rates Tab */}
          {activeTab === "sector-rates" && <SectorRatesV3 />}

          {/* Preview Tab */}
          {activeTab === "preview" && <PreviewV3 />}
        </>
      )}

      {/* Results View */}
      {currentView === "results" && data && (
        <Preview />
      )}
    </div>
  )
}

