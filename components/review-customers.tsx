"use client"

import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Package, TrendingUp, Plus, X, Filter } from "lucide-react"
import { useState, useMemo } from "react"

interface FilterCondition {
  id: string
  field: "office_of_exchange" | "flight_number"
  operator: "is" | "is_not"
  value: string
  customer?: string
}

interface ReviewCustomersProps {
  data: ProcessedData | null
  savedPriorityConditions?: FilterCondition[]
  onSavePriorityConditions?: (conditions: FilterCondition[]) => void
  onContinue?: () => void
}

const preExistingCustomers = [
  {
    customer: "AirMail Limited / ZZXDA14",
    totalKg: 245.8,
    totalEur: 1250.75,
    parcels: 45,
    euRevenue: 850.25,
    nonEuRevenue: 400.5,
    euParcels: 28,
    nonEuParcels: 17,
    routes: new Set(["USFRAT → USRIXT", "USFRAT → USROMT", "USFRAT → USVNOT"]),
    officeOfExchange: ["DKCPHA", "USFRAT", "GBLON"],
    flightNumbers: ["BT234", "BT633", "BT341"],
  },
  {
    customer: "Latvia Post",
    totalKg: 189.3,
    totalEur: 945.2,
    parcels: 32,
    euRevenue: 945.2,
    nonEuRevenue: 0,
    euParcels: 32,
    nonEuParcels: 0,
    routes: new Set(["LVRIX → DKCPH", "LVRIX → GBLON"]),
    officeOfExchange: ["LVRIX", "DKCPH"],
    flightNumbers: ["LV123", "LV456"],
  },
  {
    customer: "Estonia Post",
    totalKg: 156.7,
    totalEur: 780.35,
    parcels: 28,
    euRevenue: 780.35,
    nonEuRevenue: 0,
    euParcels: 28,
    nonEuParcels: 0,
    routes: new Set(["EETLL → DKCPH", "EETLL → GBLON"]),
    officeOfExchange: ["EETLL", "DKCPH"],
    flightNumbers: ["EE789", "EE012"],
  },
  {
    customer: "Lithuania Post",
    totalKg: 203.4,
    totalEur: 1015.6,
    parcels: 38,
    euRevenue: 1015.6,
    nonEuRevenue: 0,
    euParcels: 38,
    nonEuParcels: 0,
    routes: new Set(["LTVNO → DKCPH", "LTVNO → GBLON"]),
    officeOfExchange: ["LTVNO", "DKCPH"],
    flightNumbers: ["LT345", "LT678"],
  },
  {
    customer: "Nordic Express",
    totalKg: 312.9,
    totalEur: 1564.5,
    parcels: 52,
    euRevenue: 1100.15,
    nonEuRevenue: 464.35,
    euParcels: 35,
    nonEuParcels: 17,
    routes: new Set(["DKCPH → GBLON", "DKCPH → USFRAT", "DKCPH → CAYVR"]),
    officeOfExchange: ["DKCPH", "GBLON", "USFRAT"],
    flightNumbers: ["NK901", "NK902", "NK903"],
  },
]

export function ReviewCustomers({
  data,
  savedPriorityConditions = [],
  onSavePriorityConditions,
  onContinue,
}: ReviewCustomersProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"revenue" | "weight" | "parcels">("revenue")

  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [showAddFilter, setShowAddFilter] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>("")
  const [savedAssociations, setSavedAssociations] = useState<
    Array<{
      id: string
      field: "office_of_exchange" | "flight_number"
      value: string
      customer: string
      createdAt: Date
    }>
  >([])

  const addFilterCondition = (field: "office_of_exchange" | "flight_number") => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field,
      operator: "is",
      value: "",
      customer: "",
    }
    setFilterConditions([...filterConditions, newCondition])
    setShowAddFilter(false)
  }

  const removeFilterCondition = (id: string) => {
    setFilterConditions(filterConditions.filter((condition) => condition.id !== id))
  }

  const saveAssociation = (field: "office_of_exchange" | "flight_number", value: string, customer: string) => {
    const newAssociation = {
      id: Date.now().toString(),
      field,
      value,
      customer,
      createdAt: new Date(),
    }
    setSavedAssociations((prev) => [...prev, newAssociation])
  }

  const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilterConditions(
      filterConditions.map((condition) => {
        if (condition.id === id) {
          const updatedCondition = { ...condition, ...updates }
          // Save association when both value and customer are set
          if (updatedCondition.value && updatedCondition.customer && updates.customer) {
            saveAssociation(updatedCondition.field, updatedCondition.value, updatedCondition.customer)
          }
          return updatedCondition
        }
        return condition
      }),
    )
  }

  const saveConditions = async () => {
    setIsSaving(true)
    setSaveMessage("")

    setTimeout(() => {
      if (onSavePriorityConditions) {
        onSavePriorityConditions([...filterConditions])
      }
      setSaveMessage(
        `Successfully saved ${filterConditions.length} condition${filterConditions.length !== 1 ? "s" : ""}`,
      )
      setIsSaving(false)

      setTimeout(() => setSaveMessage(""), 3000)
    }, 1000)
  }

  const customers = useMemo(() => {
    if (data) {
      const uniqueCustomers = [...new Set(data.data.map((record) => record.customer || "Unknown"))]
      return uniqueCustomers.sort()
    }
    // Use pre-existing customers when no import data
    return preExistingCustomers.map((c) => c.customer).sort()
  }, [data])

  const customerAnalysis = useMemo(() => {
    if (data) {
      const analysis = data.data.reduce(
        (acc, record) => {
          const customer = record.customer || "Unknown"
          if (!acc[customer]) {
            acc[customer] = {
              customer,
              totalKg: 0,
              totalEur: 0,
              parcels: 0,
              euRevenue: 0,
              nonEuRevenue: 0,
              euParcels: 0,
              nonEuParcels: 0,
              routes: new Set<string>(),
            }
          }
          acc[customer].totalKg += record.totalKg
          acc[customer].totalEur += record.totalEur || 0
          acc[customer].parcels += 1

          const route = `${record.origOE} → ${record.destOE}`
          acc[customer].routes.add(route)

          if (record.euromail === "EU") {
            acc[customer].euRevenue += record.totalEur || 0
            acc[customer].euParcels += 1
          } else {
            acc[customer].nonEuRevenue += record.totalEur || 0
            acc[customer].nonEuParcels += 1
          }

          return acc
        },
        {} as Record<
          string,
          {
            customer: string
            totalKg: number
            totalEur: number
            parcels: number
            euRevenue: number
            nonEuRevenue: number
            euParcels: number
            nonEuParcels: number
            routes: Set<string>
          }
        >,
      )

      return Object.values(analysis)
        .filter((customer) => customer.customer.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
          switch (sortBy) {
            case "weight":
              return b.totalKg - a.totalKg
            case "parcels":
              return b.parcels - a.parcels
            default:
              return b.totalEur - a.totalEur
          }
        })
    }

    // Use pre-existing customers when no import data
    return preExistingCustomers
      .filter((customer) => customer.customer.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case "weight":
            return b.totalKg - a.totalKg
          case "parcels":
            return b.parcels - a.parcels
          default:
            return b.totalEur - a.totalEur
        }
      })
  }, [data, searchTerm, sortBy])

  const selectedCustomerData = useMemo(() => {
    if (selectedCustomer === "all" || !data) return null
    return customerAnalysis.find((c) => c.customer === selectedCustomer)
  }, [customerAnalysis, selectedCustomer, data])

  const selectedCustomerRecords = useMemo(() => {
    if (selectedCustomer === "all" || !data) return []
    return data.data.filter((record) => (record.customer || "Unknown") === selectedCustomer)
  }, [data, selectedCustomer])

  const hasAnyData = data || preExistingCustomers.length > 0

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          {/* <h2 className="text-3xl font-bold text-black mb-2">Review Customers</h2> */}
          <p className="text-gray-600">No customer data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* <h2 className="text-3xl font-bold text-black mb-2">Review Customers</h2> */}
        {/* <p className="text-gray-600">
          {data
            ? "Analyze customer performance and individual data breakdown"
            : "Review pre-existing customer database and set up filtering rules"}
        </p> */}
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Priority Condition Filters
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Set conditions in order of priority to filter customer data and create associations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filterConditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium text-sm">Where</span>

              <div className="border-2 border-black rounded px-4 py-2 bg-white min-w-[180px]">
                <Select
                  value={condition.field}
                  onValueChange={(value: "office_of_exchange" | "flight_number") =>
                    updateFilterCondition(condition.id, { field: value })
                  }
                >
                  <SelectTrigger className="border-none p-0 h-auto text-black font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="office_of_exchange" className="text-black hover:bg-gray-100">
                      office_of_exchange
                    </SelectItem>
                    <SelectItem value="flight_number" className="text-black hover:bg-gray-100">
                      flight_number
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={condition.operator}
                onValueChange={(value: "is" | "is_not") => updateFilterCondition(condition.id, { operator: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-black w-20 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="is" className="text-black hover:bg-gray-100">
                    is
                  </SelectItem>
                  <SelectItem value="is_not" className="text-black hover:bg-gray-100">
                    is not
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="border-2 border-black rounded px-4 py-2 bg-white min-w-[140px]">
                <Input
                  value={condition.value}
                  onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                  placeholder={condition.field === "office_of_exchange" ? "DKCPHA" : "BT234"}
                  className="border-none p-0 h-auto text-black font-medium bg-transparent"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilterCondition(condition.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-gray-600 text-sm">Customer:</span>
                <div className="relative">
                  <Input
                    value={condition.customer || ""}
                    onChange={(e) => updateFilterCondition(condition.id, { customer: e.target.value })}
                    placeholder="Enter customer name..."
                    className="bg-white border-gray-300 text-black w-48"
                    onPaste={(e) => {
                      setTimeout(() => {
                        const pastedValue = e.currentTarget.value
                        if (pastedValue && condition.value) {
                          saveAssociation(condition.field, condition.value, pastedValue)
                        }
                      }, 100)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowAddFilter(!showAddFilter)}
                  className="border-gray-300 text-black hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Filter
                </Button>

                {showAddFilter && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px]">
                    <div className="p-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search..."
                          className="pl-10 bg-white border-gray-200 text-black text-sm h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => addFilterCondition("office_of_exchange")}
                          className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs">📍</span>
                          </div>
                          Office of Exchange
                        </button>
                        <button
                          onClick={() => addFilterCondition("flight_number")}
                          className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs">✈️</span>
                          </div>
                          Flight Number
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-3 py-2 text-xs text-gray-500">More filters coming soon...</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {showAddFilter && <div className="fixed inset-0 z-0" onClick={() => setShowAddFilter(false)} />}
            </div>

            {filterConditions.length > 0 && (
              <Button
                onClick={saveConditions}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Save Changes
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>

          {filterConditions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-black font-medium mb-2">Example Results Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {filterConditions.map((condition, index) => (
                  <div key={condition.id}>
                    • Priority {index + 1}: {condition.field} {condition.operator} "{condition.value}"
                    {condition.customer && ` for customer "${condition.customer}"`}
                    {condition.customer && !customers.includes(condition.customer) && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Pasted</Badge>
                    )}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div>• Estimated matches: {Math.floor(Math.random() * 50) + 10} records</div>
                  <div>• Affected customers: {Math.floor(Math.random() * 5) + 1}</div>
                  <div>
                    • Total weight: {(Math.random() * 200 + 50).toFixed(1)} kg | Total value: €
                    {(Math.random() * 5000 + 1000).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-800 text-sm font-medium">{saveMessage}</div>
            </div>
          )}

          {savedPriorityConditions.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-black font-medium mb-2">Currently Active Conditions</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {savedPriorityConditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    <span>
                      Priority {index + 1}: {condition.field} {condition.operator} "{condition.value}"
                    </span>
                    {condition.customer && <span className="text-gray-500">({condition.customer})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <label className="text-black text-sm font-medium mb-2 block">Search Customers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-black"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <label className="text-black text-sm font-medium mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={(value: "revenue" | "weight" | "parcels") => setSortBy(value)}>
              <SelectTrigger className="bg-white border-gray-300 text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="revenue" className="text-black hover:bg-gray-100">
                  Total Revenue
                </SelectItem>
                <SelectItem value="weight" className="text-black hover:bg-gray-100">
                  Total Weight
                </SelectItem>
                <SelectItem value="parcels" className="text-black hover:bg-gray-100">
                  Parcel Count
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <label className="text-black text-sm font-medium mb-2 block">Select Customer</label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="bg-white border-gray-300 text-black">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-black hover:bg-gray-100">
                  All Customers
                </SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer} value={customer} className="text-black hover:bg-gray-100">
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedCustomerData && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedCustomerData.customer} - Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-black">{selectedCustomerData.parcels}</div>
                <div className="text-sm text-gray-600">Total Parcels</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-black">{selectedCustomerData.totalKg.toFixed(1)} kg</div>
                <div className="text-sm text-gray-600">Total Weight</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-black">€{selectedCustomerData.euRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">EU Revenue</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-black">€{selectedCustomerData.nonEuRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Non-EU Revenue</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-black mb-2">EU vs Non-EU Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">EU Parcels:</span>
                    <span className="text-black font-medium">{selectedCustomerData.euParcels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Non-EU Parcels:</span>
                    <span className="text-black font-medium">{selectedCustomerData.nonEuParcels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">EU Revenue %:</span>
                    <span className="text-black font-medium">
                      {((selectedCustomerData.euRevenue / selectedCustomerData.totalEur) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-black mb-2">Active Routes</h4>
                <div className="space-y-1 text-sm">
                  {Array.from(selectedCustomerData.routes)
                    .slice(0, 5)
                    .map((route) => (
                      <div key={route} className="text-gray-600">
                        • {route}
                      </div>
                    ))}
                  {selectedCustomerData.routes.size > 5 && (
                    <div className="text-gray-500">... and {selectedCustomerData.routes.size - 5} more routes</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Customer Performance Overview
          </CardTitle>
          <div className="text-sm text-gray-600">
            Showing {customerAnalysis.length} customers sorted by {sortBy}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerAnalysis.slice(0, 10).map((customer, index) => (
              <div
                key={customer.customer}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="text-black font-medium">{customer.customer}</div>
                    <div className="text-gray-600 text-sm flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {customer.parcels} parcels
                      </span>
                      <span>{customer.totalKg.toFixed(1)} kg</span>
                      <span>{customer.routes.size} routes</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-black font-bold text-lg">€{customer.totalEur.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm">
                    EU: €{customer.euRevenue.toFixed(0)} | Non-EU: €{customer.nonEuRevenue.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {customerAnalysis.length > 10 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Showing 10 of {customerAnalysis.length} customers
            </div>
          )}
        </CardContent>
      </Card>

      {savedAssociations.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Package className="h-5 w-5" />
              Saved Customer Associations
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Customer associations created from filter conditions (including pasted customer names)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedAssociations.map((association) => (
                <div key={association.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-100 text-green-800 text-xs">Saved</Badge>
                    <div>
                      <div className="text-black font-medium">
                        {association.field.replace("_", " ")} = "{association.value}"
                      </div>
                      <div className="text-gray-600 text-sm">
                        Associated with: {association.customer}
                        {!customers.includes(association.customer) && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Custom Entry</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">{association.createdAt.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={onContinue}
        >
          Continue to Rate Review
        </Button>
      </div>
    </div>
  )
}
