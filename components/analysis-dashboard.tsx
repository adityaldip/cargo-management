"use client"

import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useState, useMemo } from "react"

interface AnalysisDashboardProps {
  data: ProcessedData
}

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [selectedRoute, setSelectedRoute] = useState<string>("all")

  // Get unique customers and routes
  const customers = useMemo(() => {
    const uniqueCustomers = [...new Set(data.data.map((record) => record.customer || "Unknown"))]
    return uniqueCustomers.sort()
  }, [data.data])

  const routes = useMemo(() => {
    const uniqueRoutes = [...new Set(data.data.map((record) => `${record.origOE} → ${record.destOE}`))]
    return uniqueRoutes.sort()
  }, [data.data])

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return data.data.filter((record) => {
      const customerMatch = selectedCustomer === "all" || (record.customer || "Unknown") === selectedCustomer
      const routeMatch = selectedRoute === "all" || `${record.origOE} → ${record.destOE}` === selectedRoute
      return customerMatch && routeMatch
    })
  }, [data.data, selectedCustomer, selectedRoute])

  const routeAnalysis = useMemo(() => {
    const analysis = filteredData.reduce(
      (acc, record) => {
        const route = `${record.origOE} → ${record.destOE}`
        if (!acc[route]) {
          acc[route] = { route, totalKg: 0, totalEur: 0, count: 0, parcels: 0 }
        }
        acc[route].totalKg += record.totalKg
        acc[route].totalEur += record.totalEur || 0
        acc[route].count += 1
        acc[route].parcels += 1 // Each record represents a parcel
        return acc
      },
      {} as Record<string, { route: string; totalKg: number; totalEur: number; count: number; parcels: number }>,
    )

    return Object.values(analysis).sort((a, b) => b.totalKg - a.totalKg)
  }, [filteredData])

  const routeData = selectedRoute !== "all" ? routeAnalysis : routeAnalysis.slice(0, 8)

  const customerAnalysis = useMemo(() => {
    const analysis = filteredData.reduce(
      (acc, record) => {
        const customer = record.customer || "Unknown"
        if (!acc[customer]) {
          acc[customer] = {
            customer,
            totalKg: 0,
            totalEur: 0,
            count: 0,
            parcels: 0,
            euRevenue: 0,
            nonEuRevenue: 0,
          }
        }
        acc[customer].totalKg += record.totalKg
        acc[customer].totalEur += record.totalEur || 0
        acc[customer].count += 1
        acc[customer].parcels += 1

        if (record.euromail === "EU") {
          acc[customer].euRevenue += record.totalEur || 0
        } else {
          acc[customer].nonEuRevenue += record.totalEur || 0
        }

        return acc
      },
      {} as Record<
        string,
        {
          customer: string
          totalKg: number
          totalEur: number
          count: number
          parcels: number
          euRevenue: number
          nonEuRevenue: number
        }
      >,
    )

    return Object.values(analysis).sort((a, b) => b.totalEur - a.totalEur)
  }, [filteredData])

  const customerData = customerAnalysis.slice(0, 6)

  const euBreakdown = useMemo(() => {
    if (selectedCustomer !== "all") {
      const customerStats = customerAnalysis.find((c) => c.customer === selectedCustomer)
      if (customerStats) {
        return [
          { name: "EU", value: customerStats.euRevenue, color: "#f97316" },
          { name: "Non-EU", value: customerStats.nonEuRevenue, color: "#374151" },
        ]
      }
    }

    const euTotal = filteredData
      .filter((record) => record.euromail === "EU")
      .reduce((sum, record) => sum + (record.totalEur || 0), 0)

    const nonEuTotal = filteredData
      .filter((record) => record.euromail !== "EU")
      .reduce((sum, record) => sum + (record.totalEur || 0), 0)

    return [
      { name: "EU", value: euTotal, color: "#f97316" },
      { name: "Non-EU", value: nonEuTotal, color: "#374151" },
    ]
  }, [filteredData, selectedCustomer, customerAnalysis])

  const filteredSummary = useMemo(() => {
    const totalRecords = filteredData.length
    const totalKg = filteredData.reduce((sum, record) => sum + record.totalKg, 0)
    const totalParcels = filteredData.length // Each record is a parcel
    const totalRevenue = filteredData.reduce((sum, record) => sum + (record.totalEur || 0), 0)

    return { totalRecords, totalKg, totalParcels, totalRevenue }
  }, [filteredData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <label className="text-orange-300 text-sm font-medium mb-2 block">Select Customer</label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="bg-gray-800 border-orange-500/30 text-white">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-orange-500/30">
                <SelectItem value="all" className="text-white hover:bg-orange-500/20">
                  All Customers
                </SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer} value={customer} className="text-white hover:bg-orange-500/20">
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <label className="text-orange-300 text-sm font-medium mb-2 block">Select Route</label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="bg-gray-800 border-orange-500/30 text-white">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-orange-500/30">
                <SelectItem value="all" className="text-white hover:bg-orange-500/20">
                  All Routes
                </SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route} value={route} className="text-white hover:bg-orange-500/20">
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{filteredSummary.totalParcels}</div>
              <div className="text-sm text-orange-300">Total Parcels</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{filteredSummary.totalKg.toFixed(1)} kg</div>
              <div className="text-sm text-orange-300">Total Weight</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">€{filteredSummary.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-orange-300">Total Revenue</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{routeAnalysis.length}</div>
              <div className="text-sm text-orange-300">Active Routes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedRoute !== "all" ? `Route Volume: ${selectedRoute}` : "Route Volume Analysis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="route" stroke="#f97316" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#f97316" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    border: "1px solid #f97316",
                    borderRadius: "6px",
                    color: "#ffffff",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "totalKg"
                      ? `${value.toFixed(1)} kg`
                      : name === "parcels"
                        ? `${value} parcels`
                        : `€${value.toFixed(2)}`,
                    name === "totalKg" ? "Weight" : name === "parcels" ? "Parcels" : "Revenue",
                  ]}
                />
                <Bar dataKey="totalKg" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedCustomer !== "all" ? `${selectedCustomer} - EU vs Non-EU Revenue` : "EU vs Non-EU Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={euBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: €${value.toFixed(0)} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {euBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    border: "1px solid #f97316",
                    borderRadius: "6px",
                    color: "#ffffff",
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-white">Customer Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData.map((customer, index) => (
              <div
                key={customer.customer}
                className="flex items-center justify-between p-3 bg-gray-900 rounded border border-orange-500/10"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-orange-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold"
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="text-white font-medium">{customer.customer}</div>
                    <div className="text-orange-300 text-sm">
                      {customer.parcels} parcels • {customer.totalKg.toFixed(1)} kg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">€{customer.totalEur.toFixed(2)}</div>
                  <div className="text-orange-300 text-sm">
                    EU: €{customer.euRevenue.toFixed(0)} | Non-EU: €{customer.nonEuRevenue.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Breakdown */}
      <Card className="bg-black border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-white">Sector Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(
              data.data.reduce(
                (acc, record) => {
                  const sector = record.sector || "Unknown"
                  if (!acc[sector]) {
                    acc[sector] = { totalKg: 0, totalEur: 0, count: 0 }
                  }
                  acc[sector].totalKg += record.totalKg
                  acc[sector].totalEur += record.totalEur || 0
                  acc[sector].count += 1
                  return acc
                },
                {} as Record<string, { totalKg: number; totalEur: number; count: number }>,
              ),
            )
              .slice(0, 6)
              .map(([sector, stats]) => (
                <div key={sector} className="p-4 bg-gray-900 rounded border border-orange-500/10">
                  <div className="text-white font-medium mb-2">{sector}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-orange-300">
                      <span>Records:</span>
                      <span>{stats.count}</span>
                    </div>
                    <div className="flex justify-between text-orange-300">
                      <span>Weight:</span>
                      <span>{stats.totalKg.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between text-orange-300">
                      <span>Revenue:</span>
                      <span>€{stats.totalEur.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
