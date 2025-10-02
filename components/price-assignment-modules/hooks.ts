import { useState, useEffect, useCallback } from "react"
import { airportCodeAPI, flightsAPI, sectorRatesAPI } from "@/lib/api-client"
import { AirportCode, Flight, SectorRate } from "./types"

export function useAirportCodeData() {
  const [airportCodes, setAirportCodes] = useState<AirportCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchAirportCodes = async () => {
    try {
      const { data: airportCodesData, error } = await airportCodeAPI.getAll()

      if (error) {
        setError(`Failed to fetch airport codes: ${error}`)
        return
      }

      if (airportCodesData && Array.isArray(airportCodesData)) {
        setAirportCodes(airportCodesData)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      setError(`Failed to fetch airport codes: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleAirport = async (airportId: string) => {
    const airport = airportCodes.find(a => a.id === airportId)
    if (!airport) return

    try {
      console.log('Toggling airport:', airportId, 'from', airport.is_active, 'to', !airport.is_active)
      const { data: updatedAirport, error } = await airportCodeAPI.toggleActive(airportId, !airport.is_active)
      console.log('Toggle result:', { updatedAirport, error })
      
      if (error) {
        setError(`Failed to update airport: ${error}`)
        return
      }
      
      if (updatedAirport && typeof updatedAirport === 'object' && 'is_active' in updatedAirport) {
        setAirportCodes(prev => prev.map(a => 
          a.id === airportId ? { ...a, is_active: (updatedAirport as any).is_active } : a
        ))
      }
    } catch (err) {
      console.error('Toggle airport error:', err)
      setError(`Failed to update airport: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleEU = async (airportId: string) => {
    const airport = airportCodes.find(a => a.id === airportId)
    if (!airport) return

    try {
      console.log('Toggling EU status:', airportId, 'from', airport.is_eu, 'to', !airport.is_eu)
      const { data: updatedAirport, error } = await airportCodeAPI.toggleEU(airportId, !airport.is_eu)
      console.log('Toggle EU result:', { updatedAirport, error })
      
      if (error) {
        setError(`Failed to update airport EU status: ${error}`)
        return
      }
      
      if (updatedAirport && typeof updatedAirport === 'object' && 'is_eu' in updatedAirport) {
        setAirportCodes(prev => prev.map(a => 
          a.id === airportId ? { ...a, is_eu: (updatedAirport as any).is_eu } : a
        ))
      }
    } catch (err) {
      console.error('Toggle EU error:', err)
      setError(`Failed to update airport EU status: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const deleteAirport = async (airportId: string) => {
    try {
      const { error } = await airportCodeAPI.delete(airportId)
      if (error) {
        setError(`Failed to delete airport: ${error}`)
        return
      }
      
      setAirportCodes(prev => prev.filter(airport => airport.id !== airportId))
    } catch (err) {
      setError(`Failed to delete airport: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const createAirport = async (airportData: any) => {
    try {
      const { data: newAirport, error } = await airportCodeAPI.create(airportData)
      if (error) {
        setError(`Failed to create airport: ${error}`)
        return { success: false, error }
      }
      
      if (newAirport) {
        setAirportCodes(prev => [newAirport as AirportCode, ...prev])
        return { success: true, data: newAirport }
      }
    } catch (err) {
      const errorMessage = `Failed to create airport: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateAirport = async (airportId: string, updates: any) => {
    try {
      const { data: updatedAirport, error } = await airportCodeAPI.update(airportId, updates)
      if (error) {
        setError(`Failed to update airport: ${error}`)
        return { success: false, error }
      }
      
      if (updatedAirport) {
        setAirportCodes(prev => prev.map(airport => 
          airport.id === airportId ? updatedAirport as AirportCode : airport
        ))
        return { success: true, data: updatedAirport }
      }
    } catch (err) {
      const errorMessage = `Failed to update airport: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const loadData = useCallback(async (forceRefresh = false) => {
    // Cache for 60 seconds to avoid unnecessary requests
    const cacheTime = 60 * 1000
    const now = Date.now()
    
    if (!forceRefresh && lastFetchTime > 0 && (now - lastFetchTime) < cacheTime) {
      console.log('Using cached airport codes data, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    await fetchAirportCodes()
    setLoading(false)
  }, [lastFetchTime])

  useEffect(() => {
    loadData()
  }, [])

  return {
    airportCodes,
    loading,
    error,
    setError,
    toggleAirport,
    toggleEU,
    deleteAirport,
    createAirport,
    updateAirport,
    loadData,
    refetch: () => loadData(true) // Force refresh
  }
}

export function useFlightData() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchFlights = async () => {
    try {
      const { data: flightsData, error } = await flightsAPI.getAll()

      if (error) {
        setError(`Failed to fetch flights: ${error}`)
        return
      }

      if (flightsData && Array.isArray(flightsData)) {
        setFlights(flightsData)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      setError(`Failed to fetch flights: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleFlight = async (flightId: string) => {
    const flight = flights.find(f => f.id === flightId)
    if (!flight) return

    try {
      console.log('Toggling flight:', flightId, 'from', flight.is_active, 'to', !flight.is_active)
      const { data: updatedFlight, error } = await flightsAPI.toggleActive(flightId, !flight.is_active)
      console.log('Toggle result:', { updatedFlight, error })
      
      if (error) {
        setError(`Failed to update flight: ${error}`)
        return
      }
      
      if (updatedFlight && typeof updatedFlight === 'object' && 'is_active' in updatedFlight) {
        setFlights(prev => prev.map(f => 
          f.id === flightId ? { ...f, is_active: (updatedFlight as any).is_active } : f
        ))
      }
    } catch (err) {
      console.error('Toggle flight error:', err)
      setError(`Failed to update flight: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const deleteFlight = async (flightId: string) => {
    try {
      const { error } = await flightsAPI.delete(flightId)
      if (error) {
        setError(`Failed to delete flight: ${error}`)
        return
      }
      
      setFlights(prev => prev.filter(flight => flight.id !== flightId))
    } catch (err) {
      setError(`Failed to delete flight: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const createFlight = async (flightData: any) => {
    try {
      const { data: newFlight, error } = await flightsAPI.create(flightData)
      if (error) {
        setError(`Failed to create flight: ${error}`)
        return { success: false, error }
      }
      
      if (newFlight) {
        setFlights(prev => [newFlight as Flight, ...prev])
        return { success: true, data: newFlight }
      }
    } catch (err) {
      const errorMessage = `Failed to create flight: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateFlight = async (flightId: string, updates: any) => {
    try {
      const { data: updatedFlight, error } = await flightsAPI.update(flightId, updates)
      if (error) {
        setError(`Failed to update flight: ${error}`)
        return { success: false, error }
      }
      
      if (updatedFlight) {
        setFlights(prev => prev.map(flight => 
          flight.id === flightId ? updatedFlight as Flight : flight
        ))
        return { success: true, data: updatedFlight }
      }
    } catch (err) {
      const errorMessage = `Failed to update flight: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const loadData = useCallback(async (forceRefresh = false) => {
    // Cache for 60 seconds to avoid unnecessary requests
    const cacheTime = 60 * 1000
    const now = Date.now()
    
    if (!forceRefresh && lastFetchTime > 0 && (now - lastFetchTime) < cacheTime) {
      console.log('Using cached flights data, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    await fetchFlights()
    setLoading(false)
  }, [lastFetchTime])

  useEffect(() => {
    loadData()
  }, [])

  return {
    flights,
    loading,
    error,
    setError,
    toggleFlight,
    deleteFlight,
    createFlight,
    updateFlight,
    loadData,
    refetch: () => loadData(true) // Force refresh
  }
}

export function useSectorRateData() {
  const [sectorRates, setSectorRates] = useState<SectorRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchSectorRates = async () => {
    try {
      const { data: sectorRatesData, error } = await sectorRatesAPI.getAll()

      if (error) {
        setError(`Failed to fetch sector rates: ${error}`)
        return
      }

      if (sectorRatesData && Array.isArray(sectorRatesData)) {
        setSectorRates(sectorRatesData)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      setError(`Failed to fetch sector rates: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleSectorRate = async (sectorRateId: string) => {
    const sectorRate = sectorRates.find(s => s.id === sectorRateId)
    if (!sectorRate) return

    try {
      console.log('Toggling sector rate:', sectorRateId, 'from', sectorRate.is_active, 'to', !sectorRate.is_active)
      const { data: updatedSectorRate, error } = await sectorRatesAPI.toggleActive(sectorRateId, !sectorRate.is_active)
      console.log('Toggle result:', { updatedSectorRate, error })
      
      if (error) {
        setError(`Failed to update sector rate: ${error}`)
        return
      }
      
      if (updatedSectorRate && typeof updatedSectorRate === 'object' && 'is_active' in updatedSectorRate) {
        setSectorRates(prev => prev.map(s => 
          s.id === sectorRateId ? { ...s, is_active: (updatedSectorRate as any).is_active } : s
        ))
      }
    } catch (err) {
      console.error('Toggle sector rate error:', err)
      setError(`Failed to update sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const deleteSectorRate = async (sectorRateId: string) => {
    try {
      const { error } = await sectorRatesAPI.delete(sectorRateId)
      if (error) {
        setError(`Failed to delete sector rate: ${error}`)
        return
      }
      
      setSectorRates(prev => prev.filter(sectorRate => sectorRate.id !== sectorRateId))
    } catch (err) {
      setError(`Failed to delete sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const createSectorRate = async (sectorRateData: any) => {
    try {
      const { data: newSectorRate, error } = await sectorRatesAPI.create(sectorRateData)
      if (error) {
        setError(`Failed to create sector rate: ${error}`)
        return { success: false, error }
      }
      
      if (newSectorRate) {
        setSectorRates(prev => [newSectorRate as SectorRate, ...prev])
        return { success: true, data: newSectorRate }
      }
    } catch (err) {
      const errorMessage = `Failed to create sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateSectorRate = async (sectorRateId: string, updates: any) => {
    try {
      const { data: updatedSectorRate, error } = await sectorRatesAPI.update(sectorRateId, updates)
      if (error) {
        setError(`Failed to update sector rate: ${error}`)
        return { success: false, error }
      }
      
      if (updatedSectorRate) {
        setSectorRates(prev => prev.map(sectorRate => 
          sectorRate.id === sectorRateId ? updatedSectorRate as SectorRate : sectorRate
        ))
        return { success: true, data: updatedSectorRate }
      }
    } catch (err) {
      const errorMessage = `Failed to update sector rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const loadData = useCallback(async (forceRefresh = false) => {
    // Cache for 60 seconds to avoid unnecessary requests
    const cacheTime = 60 * 1000
    const now = Date.now()
    
    if (!forceRefresh && lastFetchTime > 0 && (now - lastFetchTime) < cacheTime) {
      console.log('Using cached sector rates data, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    await fetchSectorRates()
    setLoading(false)
  }, [lastFetchTime])

  useEffect(() => {
    loadData()
  }, [])

  return {
    sectorRates,
    loading,
    error,
    setError,
    toggleSectorRate,
    deleteSectorRate,
    createSectorRate,
    updateSectorRate,
    loadData,
    refetch: () => loadData(true) // Force refresh
  }
}
