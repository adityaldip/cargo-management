"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectorRate } from "./types"

// Dummy data
const dummySectorRates: SectorRate[] = [
  {
    id: "1",
    origin: "JFK",
    destination: "LAX",
    baseRate: 450,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Transcontinental route"
  },
  {
    id: "2",
    origin: "LAX",
    destination: "SFO",
    baseRate: 320,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Short domestic route"
  },
  {
    id: "3",
    origin: "LHR",
    destination: "CDG",
    baseRate: 180,
    currency: "EUR",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "European short-haul"
  },
  {
    id: "4",
    origin: "JFK",
    destination: "LHR",
    baseRate: 850,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Transatlantic route"
  },
  {
    id: "5",
    origin: "NRT",
    destination: "LAX",
    baseRate: 1200,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Transpacific route"
  },
  {
    id: "6",
    origin: "SYD",
    destination: "LAX",
    baseRate: 1500,
    currency: "AUD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: false,
    notes: "Long-haul international"
  },
  {
    id: "7",
    origin: "DXB",
    destination: "LHR",
    baseRate: 650,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Middle East to Europe"
  },
  {
    id: "8",
    origin: "SFO",
    destination: "NRT",
    baseRate: 1100,
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    isActive: true,
    notes: "Pacific route"
  }
]

export function SectorRates() {
  const [sectorRates, setSectorRates] = useState<SectorRate[]>(dummySectorRates)
  const [searchTerm, setSearchTerm] = useState("")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredSectorRates = sectorRates.filter(rate => {
    const matchesSearch = rate.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCurrency = currencyFilter === "all" || rate.currency === currencyFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && rate.isActive) ||
                         (statusFilter === "inactive" && !rate.isActive)

    return matchesSearch && matchesCurrency && matchesStatus
  })

  const uniqueCurrencies = Array.from(new Set(sectorRates.map(rate => rate.currency)))

  const toggleActiveStatus = (id: string) => {
    setSectorRates(prev => 
      prev.map(rate => 
        rate.id === id 
          ? { ...rate, isActive: !rate.isActive }
          : rate
      )
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sector Rates Management</h2>
        <Button>Add New Rate</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {uniqueCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setCurrencyFilter("all")
                setStatusFilter("all")
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Rates ({filteredSectorRates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSectorRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.origin} → {rate.destination}</TableCell>
                    <TableCell>{formatCurrency(rate.baseRate, rate.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate.currency}</Badge>
                    </TableCell>
                    <TableCell>{new Date(rate.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell>{rate.expiryDate ? new Date(rate.expiryDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={rate.isActive}
                          onCheckedChange={() => toggleActiveStatus(rate.id)}
                        />
                        <Badge className={rate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{rate.notes || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
