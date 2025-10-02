import { Flight, AirportCode } from "@/components/price-assignment-modules/types"

/**
 * Generate flight number preview suggestions based on existing flights
 * and airport codes for a given route
 */
export function generateFlightNumberSuggestions(
  origin: string,
  destination: string,
  flights: Flight[],
  airportCodes: AirportCode[]
): string[] {
  const suggestions: string[] = []
  
  // Find flights that match this route
  const matchingFlights = flights.filter(flight => 
    flight.origin === origin && flight.destination === destination
  )
  
  // Extract unique flight number patterns
  const patterns = new Set<string>()
  matchingFlights.forEach(flight => {
    // Extract airline code (first 2 characters)
    const airlineCode = flight.flightNumber.substring(0, 2)
    patterns.add(airlineCode)
  })
  
  // Generate suggestions based on patterns
  patterns.forEach(airlineCode => {
    // Generate a few variations
    suggestions.push(`${airlineCode}123`)
    suggestions.push(`${airlineCode}456`)
    suggestions.push(`${airlineCode}789`)
  })
  
  // If no matching flights, suggest common airline codes for the route
  if (suggestions.length === 0) {
    const commonAirlines = getCommonAirlinesForRoute(origin, destination)
    commonAirlines.forEach(airline => {
      suggestions.push(`${airline}123`)
      suggestions.push(`${airline}456`)
    })
  }
  
  return suggestions.slice(0, 3) // Return max 3 suggestions
}

/**
 * Get common airline codes for specific routes
 */
function getCommonAirlinesForRoute(origin: string, destination: string): string[] {
  const routeAirlines: Record<string, string[]> = {
    'JFK-LAX': ['AA', 'DL', 'UA'],
    'LAX-SFO': ['UA', 'AA', 'WN'],
    'LHR-CDG': ['BA', 'AF', 'KL'],
    'JFK-LHR': ['AA', 'BA', 'VS'],
    'NRT-LAX': ['JL', 'NH', 'UA'],
    'SYD-LAX': ['QF', 'UA', 'AA'],
    'DXB-LHR': ['EK', 'BA', 'VS'],
    'SFO-NRT': ['UA', 'NH', 'JL']
  }
  
  const routeKey = `${origin}-${destination}`
  return routeAirlines[routeKey] || ['AA', 'UA', 'DL'] // Default to common US airlines
}

/**
 * Get all flight numbers for a route from existing flights
 */
export function getFlightNumberPreviewFromFlights(
  origin: string,
  destination: string,
  flights: Flight[]
): string | null {
  const matchingFlights = flights.filter(flight => 
    flight.origin === origin && 
    flight.destination === destination &&
    flight.is_active
  )
  
  if (matchingFlights.length === 0) {
    return null
  }
  
  if (matchingFlights.length === 1) {
    return matchingFlights[0].flightNumber
  }
  
  // If multiple flights, return all flight numbers joined
  return matchingFlights.map(flight => flight.flightNumber).join(', ')
}
