"use client"

import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Package, TrendingUp, Plus, X, Filter, Download } from "lucide-react"
import { useState, useMemo } from "react"

interface FilterCondition {
  id: string
  field: "inb_flight_date" | "outb_flight_date" | "rec_id" | "des_no" | "rec_numb" | "orig_oe" | "dest_oe" | "inb_flight_no" | "outb_flight_no" | "mail_cat" | "mail_class" | "total_kg" | "invoice" | "customer" | "rate"
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
      field: FilterCondition["field"]
      value: string
      customer: string
      createdAt: Date
    }>
  >([])

  const addFilterCondition = (field: FilterCondition["field"]) => {
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

  const saveAssociation = (field: FilterCondition["field"], value: string, customer: string) => {
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
    <div className="space-y-4 pt-2">
      <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="space-y-1 pt-0 pb-4">
          <CardTitle className="text-black flex items-center gap-2 mb-2">
            <Filter className="h-5 w-5" />
            Rules
          </CardTitle>
          
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
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
                        onClick={() => addFilterCondition("orig_oe")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">📍</span>
                        </div>
                        Origin OE
                      </button>
                      <button
                        onClick={() => addFilterCondition("dest_oe")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">🎯</span>
                        </div>
                        Destination OE
                      </button>
                      <button
                        onClick={() => addFilterCondition("inb_flight_no")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">✈️</span>
                        </div>
                        Flight Number
                      </button>
                      <button
                        onClick={() => addFilterCondition("mail_cat")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">📦</span>
                        </div>
                        Mail Category
                      </button>
                      <button
                        onClick={() => addFilterCondition("customer")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                        Customer
                      </button>
                      <button
                        onClick={() => addFilterCondition("total_kg")}
                        className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">⚖️</span>
                        </div>
                        Weight
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Click outside to close dropdown */}
              {showAddFilter && <div className="fixed inset-0 z-0" onClick={() => setShowAddFilter(false)} />}
            </div>

            <div className="flex items-center gap-2">
              {filterConditions.length > 0 && (
                <>
                  <Button
                    onClick={() => setFilterConditions([])}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    onClick={saveConditions}
                    disabled={isSaving}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
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
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          {filterConditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2 p-1 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium text-sm">Where</span>

              <div className="border-2 border-black rounded px-3 py-1 bg-white min-w-[160px]">
                <Select
                  value={condition.field}
                  onValueChange={(value: FilterCondition["field"]) =>
                    updateFilterCondition(condition.id, { field: value })
                  }
                >
                  <SelectTrigger className="border-none p-0 h-auto text-black font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="inb_flight_date" className="text-black hover:bg-gray-100">
                      Inb.Flight Date
                    </SelectItem>
                    <SelectItem value="outb_flight_date" className="text-black hover:bg-gray-100">
                      Outb.Flight Date
                    </SelectItem>
                    <SelectItem value="rec_id" className="text-black hover:bg-gray-100">
                      Rec. ID
                    </SelectItem>
                    <SelectItem value="des_no" className="text-black hover:bg-gray-100">
                      Des. No.
                    </SelectItem>
                    <SelectItem value="rec_numb" className="text-black hover:bg-gray-100">
                      Rec. Numb.
                    </SelectItem>
                    <SelectItem value="orig_oe" className="text-black hover:bg-gray-100">
                      Orig. OE
                    </SelectItem>
                    <SelectItem value="dest_oe" className="text-black hover:bg-gray-100">
                      Dest. OE
                    </SelectItem>
                    <SelectItem value="inb_flight_no" className="text-black hover:bg-gray-100">
                      Inb. Flight No.
                    </SelectItem>
                    <SelectItem value="outb_flight_no" className="text-black hover:bg-gray-100">
                      Outb. Flight No.
                    </SelectItem>
                    <SelectItem value="mail_cat" className="text-black hover:bg-gray-100">
                      Mail Cat.
                    </SelectItem>
                    <SelectItem value="mail_class" className="text-black hover:bg-gray-100">
                      Mail Class
                    </SelectItem>
                    <SelectItem value="total_kg" className="text-black hover:bg-gray-100">
                      Total kg
                    </SelectItem>
                    <SelectItem value="invoice" className="text-black hover:bg-gray-100">
                      Invoice
                    </SelectItem>
                    <SelectItem value="customer" className="text-black hover:bg-gray-100">
                      Customer
                    </SelectItem>
                    <SelectItem value="rate" className="text-black hover:bg-gray-100">
                      Rate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={condition.operator}
                onValueChange={(value: "is" | "is_not") => updateFilterCondition(condition.id, { operator: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-black w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="is" className="text-black hover:bg-gray-100">
                    is
                  </SelectItem>
                  <SelectItem value="is_not" className="text-black hover:bg-gray-100">
                    is not
                  </SelectItem>
                  <SelectItem value="contains" className="text-black hover:bg-gray-100">
                    contains
                  </SelectItem>
                  <SelectItem value="starts_with" className="text-black hover:bg-gray-100">
                    starts with
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="border-2 border-black rounded px-3 py-1 bg-white min-w-[120px]">
                <Input
                  value={condition.value}
                  onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                  placeholder={
                    condition.field === "orig_oe" || condition.field === "dest_oe" ? "DKCPHA" :
                    condition.field === "inb_flight_no" || condition.field === "outb_flight_no" ? "BT234" :
                    condition.field === "mail_cat" ? "A" :
                    condition.field === "mail_class" ? "7C" :
                    condition.field === "total_kg" ? "25.5" :
                    condition.field === "customer" ? "AirMail Limited" :
                    condition.field === "rate" ? "15.75" :
                    "Enter value"
                  }
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


          {saveMessage && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-800 text-sm font-medium">{saveMessage}</div>
            </div>
          )}

          {savedPriorityConditions.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-black font-medium">Currently Active Conditions</h4>
                <Button
                  onClick={() => onSavePriorityConditions && onSavePriorityConditions([])}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All Active
                </Button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {savedPriorityConditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      <span>
                        Priority {index + 1}: {condition.field} {condition.operator} "{condition.value}"
                      </span>
                      {condition.customer && <span className="text-gray-500">({condition.customer})</span>}
                    </div>
                    <Button
                      onClick={() => {
                        if (onSavePriorityConditions) {
                          const updatedConditions = savedPriorityConditions.filter(c => c.id !== condition.id)
                          onSavePriorityConditions(updatedConditions)
                        }
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table Preview */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black">Customer Data Preview</CardTitle>
              <p className="text-sm text-gray-600">Preview of processed customer data with applied rules</p>
            </div>
            <Button
              className="bg-black text-white"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
          <div className="flex justify-end">
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total Records: <strong className="text-black">1,000</strong></span>
              <span>Total Weight: <strong className="text-black">25,450.5 kg</strong></span>
              <span>Avg Weight: <strong className="text-black">25.5 kg</strong></span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Inb.Flight Date</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Outb.Flight Date</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Rec. ID</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Des. No.</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Rec. Numb.</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Orig. OE</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Dest. OE</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Inb. Flight No.</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Outb. Flight No.</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Mail Cat.</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Mail Class</th>
                  <th className="border border-gray-300 p-2 text-right text-black font-medium">Total kg</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium">Invoice</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium bg-yellow-200">Customer</th>
                  <th className="border border-gray-300 p-2 text-left text-black font-medium bg-yellow-200">Rate</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(20)].map((_, index) => {
                  // Generate sample data for demonstration
                  const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM"]
                  const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA"]
                  const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456"]
                  const mailCats = ["A", "B", "C", "D", "E"]
                  const mailClasses = ["7C", "7D", "7E", "7F", "7G"]
                  const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
                  
                  const origOE = origins[index % origins.length]
                  const destOE = destinations[index % destinations.length]
                  const mailCat = mailCats[index % mailCats.length]
                  const mailClass = mailClasses[index % mailClasses.length]
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-gray-900">2025 JUL {(15 + index % 10).toString().padStart(2, '0')}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">2025 JUL {(16 + index % 10).toString().padStart(2, '0')}</td>
                      <td className="border border-gray-300 p-2 text-gray-900 font-mono text-xs">{origOE}{destOE}{mailCat}{mailClass}507{(index + 1).toString().padStart(2, '0')}{(70000 + index * 123).toString().slice(-4)}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">507{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{(index + 1).toString().padStart(3, '0')}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{origOE}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{destOE}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{flightNos[index % flightNos.length]}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{flightNos[(index + 1) % flightNos.length]}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{mailCat}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{mailClass}</td>
                      <td className="border border-gray-300 p-2 text-right text-gray-900">{(15.5 + (index * 2.3)).toFixed(1)}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{invoiceTypes[index % invoiceTypes.length]}</td>
                      <td className="border border-gray-300 p-2 text-gray-900 text-xs bg-yellow-200"></td>
                      <td className="border border-gray-300 p-2 text-gray-900 text-xs bg-yellow-200"></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 1 to 20 of 1,000 records
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={true}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="default"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  3
                </Button>
                <span className="text-gray-500">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  50
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              This preview shows processed data with applied customer rules
            </p>
          </div>
        </CardContent>
      </Card>

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
