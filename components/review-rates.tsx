"use client"

import type { ProcessedData } from "@/types/cargo-data"
import type { RateSettings } from "@/types/rate-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  Settings,
  Globe,
  Layers,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react"
import { useState } from "react"

interface ReviewRatesProps {
  settings: RateSettings
  onSettingsChange: (settings: RateSettings) => void
  data: ProcessedData | null
}

export function ReviewRates({ settings, onSettingsChange, data }: ReviewRatesProps) {
  const [activeTab, setActiveTab] = useState("routes")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null)
  const [rateManagementTab, setRateManagementTab] = useState("ratePlans")

  const routes = [
    {
      origin: "BKK",
      destination: "CGK",
      baseRate: "$5",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "BKK",
      destination: "KUL",
      baseRate: "$5.6",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "BKK",
      destination: "SIN",
      baseRate: "$5.6",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "CGK",
      destination: "KUL",
      baseRate: "$5",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "CGK",
      destination: "NRT",
      baseRate: "$5.6",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "CGK",
      destination: "SIN",
      baseRate: "$5.6",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
    {
      origin: "KUL",
      destination: "CGK",
      baseRate: "$5.6",
      ratePlans: "3 plans configured",
      lastUpdated: "Sep 2, 2025 02:00 AM",
    },
  ]

  if (selectedRoute) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Route Header */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {selectedRoute.origin} → {selectedRoute.destination}
                </h1>
                <p className="text-gray-600 text-sm mt-1">Sep 02, 2025 02:00 AM</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedRoute(null)}
                className="border-gray-300 text-black hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Routes
              </Button>
            </div>
          </div>

          {/* Rate Management Tabs */}
          <div className="flex gap-2">
            <Button
              variant={rateManagementTab === "ratePlans" ? "default" : "outline"}
              onClick={() => setRateManagementTab("ratePlans")}
              className={
                rateManagementTab === "ratePlans"
                  ? "bg-black text-white"
                  : "border-gray-300 text-black hover:bg-gray-50"
              }
            >
              <Layers className="h-4 w-4 mr-2" />
              Rate Plans
              <span className="ml-2 bg-gray-200 text-black px-2 py-0.5 rounded-full text-xs">3</span>
            </Button>
            <Button
              variant={rateManagementTab === "modifierRules" ? "default" : "outline"}
              onClick={() => setRateManagementTab("modifierRules")}
              className={
                rateManagementTab === "modifierRules"
                  ? "bg-black text-white"
                  : "border-gray-300 text-black hover:bg-gray-50"
              }
            >
              <Settings className="h-4 w-4 mr-2" />
              Modifier Rules
              <span className="ml-2 bg-gray-200 text-black px-2 py-0.5 rounded-full text-xs">0</span>
            </Button>
            <Button
              variant={rateManagementTab === "ratePreview" ? "default" : "outline"}
              onClick={() => setRateManagementTab("ratePreview")}
              className={
                rateManagementTab === "ratePreview"
                  ? "bg-black text-white"
                  : "border-gray-300 text-black hover:bg-gray-50"
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              Rate Preview
            </Button>
          </div>

          {/* Route Rate Plans Content */}
          {rateManagementTab === "ratePlans" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">Route Rate Plans</h2>
                  <p className="text-gray-600 text-sm">Manage master and rate plans for this route.</p>
                </div>
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </div>

              {/* Rate Plan Structure Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-black mb-1">Rate Plan Structure</h3>
                    <p className="text-gray-600 text-sm">
                      This route uses a master rate plan with linked plans. The master plan is evaluated first, followed
                      by active plans based on their assignment rules. Drag and drop non-master plans to re-order their
                      evaluation priority if their assignment rules overlap (higher plans checked first).
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Rate Plan */}
              <div className="space-y-4 pt-2">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                            Master
                          </span>
                        </div>
                        <h3 className="font-medium text-black">Special Rates</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Master Rate Plan
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Linked Rate Plan */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                            Linked to Special Rates
                          </span>
                        </div>
                        <h3 className="font-medium text-black">Special Rates (Child)</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Active</span>
                        <div className="w-10 h-6 bg-black rounded-full relative">
                          <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Custom Rate Plan */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">Custom</span>
                        </div>
                        <h3 className="font-medium text-black">Special Rates (Custom)</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Active</span>
                        <div className="w-10 h-6 bg-black rounded-full relative">
                          <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {rateManagementTab !== "ratePlans" && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-black mb-2">
                {rateManagementTab === "modifierRules" && "Modifier Rules"}
                {rateManagementTab === "ratePreview" && "Rate Preview"}
              </h3>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-2 py-1 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600 text-sm">Routes</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">14</div>
            <div className="text-gray-500 text-sm">active routes</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600 text-sm">Rate Plans</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">2</div>
            <div className="text-gray-500 text-sm">active rate plans</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600 text-sm">Modifiers</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">3</div>
            <div className="text-gray-500 text-sm">active modifiers</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600 text-sm">Recently Updated</span>
            </div>
            <div className="text-xl font-bold text-black mb-1">SIN → BKK</div>
            <Button variant="ghost" className="text-black hover:bg-gray-100 p-0 h-auto text-sm">
              Configure rates →
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">Rate Management</h2>

          <div className="flex gap-2">
            <Button
              variant={activeTab === "routes" ? "default" : "outline"}
              onClick={() => setActiveTab("routes")}
              className={activeTab === "routes" ? "bg-black text-white" : "border-gray-300 text-black hover:bg-gray-50"}
            >
              <Globe className="h-4 w-4 mr-2" />
              Routes
            </Button>
            <Button
              variant={activeTab === "ratePlans" ? "default" : "outline"}
              onClick={() => setActiveTab("ratePlans")}
              className={
                activeTab === "ratePlans" ? "bg-black text-white" : "border-gray-300 text-black hover:bg-gray-50"
              }
            >
              <Layers className="h-4 w-4 mr-2" />
              Rate Plans
            </Button>
            <Button
              variant={activeTab === "modifiers" ? "default" : "outline"}
              onClick={() => setActiveTab("modifiers")}
              className={
                activeTab === "modifiers" ? "bg-black text-white" : "border-gray-300 text-black hover:bg-gray-50"
              }
            >
              <Settings className="h-4 w-4 mr-2" />
              Modifiers
            </Button>
            <Button
              variant={activeTab === "rules" ? "default" : "outline"}
              onClick={() => setActiveTab("rules")}
              className={activeTab === "rules" ? "bg-black text-white" : "border-gray-300 text-black hover:bg-gray-50"}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Rules
            </Button>
          </div>
        </div>

        {activeTab === "routes" && (
          <div className="space-y-2">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-black">Routes</h3>
              <p className="text-gray-600">
                Configure pricing for your flight routes. Click on "Configure Rates" to set up rate plans and pricing
                rules.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-black placeholder-gray-400"
                />
              </div>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div>Origin</div>
                <div>Destination</div>
                <div>Base Rate</div>
                <div>Rate Plans</div>
                <div>Last Updated</div>
                <div></div>
              </div>

              {routes.map((route, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-2 p-2 border-b border-gray-100 hover:bg-gray-50 items-center"
                >
                  <div className="text-black font-medium">{route.origin}</div>
                  <div className="text-black font-medium">{route.destination}</div>
                  <div className="text-black">{route.baseRate}</div>
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200">
                      {route.ratePlans}
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm">{route.lastUpdated}</div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-black hover:bg-gray-100"
                      onClick={() => setSelectedRoute({ origin: route.origin, destination: route.destination })}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Rates
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab !== "routes" && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-black mb-2">
              {activeTab === "ratePlans" && "Rate Plans"}
              {activeTab === "modifiers" && "Modifiers"}
              {activeTab === "rules" && "Rules"}
            </h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  )
}
