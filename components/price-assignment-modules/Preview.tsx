"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Flight, AirportCode, SectorRate } from "./types"

// Dummy data for preview
const dummyFlights: Flight[] = [
  {
    id: "1",
    flightNumber: "AA123",
    origin: "JFK",
    destination: "LAX",
    airline: "American Airlines",
    aircraft: "Boeing 737",
    departureTime: "2024-01-15 08:30",
    arrivalTime: "2024-01-15 11:45",
    status: "scheduled",
    price: 450
  },
  {
    id: "2",
    flightNumber: "UA456",
    origin: "LAX",
    destination: "SFO",
    airline: "United Airlines",
    aircraft: "Airbus A320",
    departureTime: "2024-01-15 14:20",
    arrivalTime: "2024-01-15 15:35",
    status: "scheduled",
    price: 320
  }
]

const dummyAirportCodes: AirportCode[] = [
  {
    id: "1",
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "United States",
    region: "North America",
    isActive: true,
    rateMultiplier: 1.2
  },
  {
    id: "2",
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "United States",
    region: "North America",
    isActive: true,
    rateMultiplier: 1.1
  }
]

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
  }
]

export function Preview() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const processingSteps = [
    "Validating flight data...",
    "Checking airport codes...",
    "Calculating sector rates...",
    "Applying rate multipliers...",
    "Generating final prices...",
    "Completing assignment..."
  ]

  const handleProcessAssignment = async () => {
    setIsProcessing(true)
    setProcessingStep(0)
    setResults([])

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProcessingStep(i + 1)
    }

    // Generate results
    const mockResults = dummyFlights.map(flight => {
      const originAirport = dummyAirportCodes.find(airport => airport.code === flight.origin)
      const destinationAirport = dummyAirportCodes.find(airport => airport.code === flight.destination)
      const sectorRate = dummySectorRates.find(rate => 
        rate.origin === flight.origin && rate.destination === flight.destination
      )

      const basePrice = sectorRate?.baseRate || 400
      const originMultiplier = originAirport?.rateMultiplier || 1.0
      const destinationMultiplier = destinationAirport?.rateMultiplier || 1.0
      const finalPrice = Math.round(basePrice * originMultiplier * destinationMultiplier)

      return {
        flightNumber: flight.flightNumber,
        route: `${flight.origin} → ${flight.destination}`,
        basePrice,
        originMultiplier,
        destinationMultiplier,
        finalPrice,
        savings: basePrice - finalPrice,
        status: 'assigned'
      }
    })

    setResults(mockResults)
    setIsProcessing(false)
  }

  const totalSavings = results.reduce((sum, result) => sum + result.savings, 0)
  const averagePrice = results.length > 0 ? results.reduce((sum, result) => sum + result.finalPrice, 0) / results.length : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Price Assignment Preview</h2>
        <Button 
          onClick={handleProcessAssignment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Process Assignment"}
        </Button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(processingStep / processingSteps.length) * 100} className="w-full" />
              <p className="text-sm text-gray-600">
                {processingSteps[processingStep - 1] || "Starting..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averagePrice.toFixed(0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flight</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Origin Multiplier</TableHead>
                    <TableHead>Destination Multiplier</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.flightNumber}</TableCell>
                      <TableCell>{result.route}</TableCell>
                      <TableCell>${result.basePrice}</TableCell>
                      <TableCell>{result.originMultiplier}x</TableCell>
                      <TableCell>{result.destinationMultiplier}x</TableCell>
                      <TableCell className="font-medium">${result.finalPrice}</TableCell>
                      <TableCell className={result.savings > 0 ? "text-green-600" : "text-red-600"}>
                        ${result.savings}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {result.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Flights</h4>
              <p className="text-sm text-gray-600">{dummyFlights.length} flights configured</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Airport Codes</h4>
              <p className="text-sm text-gray-600">{dummyAirportCodes.length} airports active</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sector Rates</h4>
              <p className="text-sm text-gray-600">{dummySectorRates.length} rates configured</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
