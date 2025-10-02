"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Flight } from "./types"

// Dummy data
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
    status: "delayed",
    price: 320
  },
  {
    id: "3",
    flightNumber: "DL789",
    origin: "SFO",
    destination: "JFK",
    airline: "Delta Airlines",
    aircraft: "Boeing 777",
    departureTime: "2024-01-15 18:00",
    arrivalTime: "2024-01-16 06:15",
    status: "scheduled",
    price: 680
  },
  {
    id: "4",
    flightNumber: "SW234",
    origin: "ORD",
    destination: "DEN",
    airline: "Southwest",
    aircraft: "Boeing 737",
    departureTime: "2024-01-15 10:15",
    arrivalTime: "2024-01-15 12:30",
    status: "completed",
    price: 280
  },
  {
    id: "5",
    flightNumber: "BA567",
    origin: "LHR",
    destination: "CDG",
    airline: "British Airways",
    aircraft: "Airbus A320",
    departureTime: "2024-01-15 16:45",
    arrivalTime: "2024-01-15 19:20",
    status: "scheduled",
    price: 420
  }
]

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  delayed: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800"
}

export function Flights() {
  const [flights, setFlights] = useState<Flight[]>(dummyFlights)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [airlineFilter, setAirlineFilter] = useState<string>("all")

  const filteredFlights = flights.filter(flight => {
    const matchesSearch = flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flight.airline.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || flight.status === statusFilter
    const matchesAirline = airlineFilter === "all" || flight.airline === airlineFilter

    return matchesSearch && matchesStatus && matchesAirline
  })

  const uniqueAirlines = Array.from(new Set(flights.map(flight => flight.airline)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Flight Management</h2>
        <Button>Add New Flight</Button>
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
                placeholder="Search flights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Airline</label>
              <Select value={airlineFilter} onValueChange={setAirlineFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Airlines</SelectItem>
                  {uniqueAirlines.map(airline => (
                    <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setAirlineFilter("all")
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flights ({filteredFlights.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flight Number</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlights.map((flight) => (
                  <TableRow key={flight.id}>
                    <TableCell className="font-medium">{flight.flightNumber}</TableCell>
                    <TableCell>{flight.origin} → {flight.destination}</TableCell>
                    <TableCell>{flight.airline}</TableCell>
                    <TableCell>{flight.aircraft}</TableCell>
                    <TableCell>{new Date(flight.departureTime).toLocaleString()}</TableCell>
                    <TableCell>{new Date(flight.arrivalTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[flight.status]}>
                        {flight.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${flight.price?.toLocaleString() || 'N/A'}</TableCell>
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
