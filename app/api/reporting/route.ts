import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const viewBy = searchParams.get('viewBy') || 'revenue' // 'revenue' or 'weight'
    const viewPeriod = searchParams.get('viewPeriod') || 'total' // 'total', 'week', 'month'
    
    console.log('🚀 Reporting API called with params:', { dateFrom, dateTo, viewBy, viewPeriod })
    
    // Build the base query to get aggregated data by route with rates join
    let query = supabaseAdmin
      .from('cargo_data')
      .select(`
        inb_flight_date,
        outb_flight_date,
        orig_oe,
        dest_oe,
        total_kg,
        rate_value,
        rate_currency,
        rate_id,
        processed_at,
        created_at,
        rates (
          id,
          name,
          base_rate,
          currency,
          multiplier,
          rate_type
        )
      `)
      .not('orig_oe', 'is', null)
      .not('dest_oe', 'is', null)
      .not('total_kg', 'is', null)
      .not('rate_id', 'is', null)
    
    // Apply date filters - handle both processed_at and created_at
    // Note: We'll filter after fetching since the date format might be different
    // For now, let's get all data and filter in memory
    
    const { data: cargoData, error } = await query
    
    console.log('📊 Cargo data query result:', { 
      recordCount: cargoData?.length || 0, 
      error: error?.message,
      sampleRecord: cargoData?.[0],
      sampleRecordWithRates: cargoData?.[0] ? {
        inb_flight_date: cargoData[0].inb_flight_date,
        outb_flight_date: cargoData[0].outb_flight_date,
        orig_oe: cargoData[0].orig_oe,
        dest_oe: cargoData[0].dest_oe,
        total_kg: cargoData[0].total_kg,
        rate_value: cargoData[0].rate_value,
        rate_id: cargoData[0].rate_id,
        rates: cargoData[0].rates
      } : null
    })
    
    if (error) {
      console.error('Error fetching cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cargo data' },
        { status: 500 }
      )
    }
    
    if (!cargoData || cargoData.length === 0) {
      return NextResponse.json({
        data: [],
        summary: {
          totalRevenue: 0,
          totalWeight: 0,
          totalRecords: 0
        }
      })
    }

    // Helper function to parse date in "2025 Jul 14" format and convert to ISO
    const parseFlightDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null
      
      try {
        // Handle "2025 Jul 14" format - convert to ISO format first
        if (dateStr.includes(' ') && !dateStr.includes('T')) {
          // Convert "2025 Jul 14" to "2025-07-14"
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            console.warn('Failed to parse date:', dateStr)
            return null
          }
          return date
        }
        // Handle ISO format
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          console.warn('Failed to parse date:', dateStr)
          return null
        }
        return date
      } catch (e) {
        console.warn('Failed to parse date:', dateStr, e)
        return null
      }
    }

    // Helper function to convert date to ISO string for comparison
    const dateToISO = (date: Date): string => {
      return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
    }

    // Filter data by date range using flight dates
    let filteredCargoData = cargoData
    
    if (dateFrom || dateTo) {
      filteredCargoData = cargoData.filter(record => {
        // Try to get date from flight dates first, then fallback to processed_at/created_at
        const recordDate = parseFlightDate(record.outb_flight_date) || 
                          parseFlightDate(record.inb_flight_date) || 
                          parseFlightDate(record.processed_at) || 
                          parseFlightDate(record.created_at)
        
        if (!recordDate) return true // Include records without valid dates
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          if (recordDate < fromDate) return false
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo)
          if (recordDate > toDate) return false
        }
        
        return true
      })
    }

    console.log('🔍 Filtered cargo data:', { 
      originalCount: cargoData.length,
      filteredCount: filteredCargoData.length,
      sampleFilteredRecord: filteredCargoData[0] ? {
        outb_flight_date: filteredCargoData[0].outb_flight_date,
        inb_flight_date: filteredCargoData[0].inb_flight_date,
        processed_at: filteredCargoData[0].processed_at,
        created_at: filteredCargoData[0].created_at,
        orig_oe: filteredCargoData[0].orig_oe,
        dest_oe: filteredCargoData[0].dest_oe,
        total_kg: filteredCargoData[0].total_kg,
        rate_value: filteredCargoData[0].rate_value
      } : null
    })
    
    // Group data by route (orig_oe + dest_oe)
    const routeGroups = new Map<string, any[]>()
    
    filteredCargoData.forEach((record) => {
      const routeKey = `${record.orig_oe}-${record.dest_oe}`
      if (!routeGroups.has(routeKey)) {
        routeGroups.set(routeKey, [])
      }
      routeGroups.get(routeKey)!.push(record)
    })
    
    // Transform grouped data into reporting format
    const reportData = Array.from(routeGroups.entries()).map(([routeKey, records]) => {
      const [orig_oe, dest_oe] = routeKey.split('-')
      const routeLabel = `${orig_oe} → ${dest_oe}`
      
      // Calculate totals
      const totalWeight = records.reduce((sum, record) => sum + (record.total_kg || 0), 0)
      
      // Calculate revenue using the same logic as ExecuteRates
      const totalRevenue = records.reduce((sum, record) => {
        let calculatedRateValue = record.rate_value || 0
        
        // If rate_value is 0 or null, calculate from rates table (same logic as ExecuteRates)
        if ((record.rate_value === 0 || record.rate_value === null) && record.rates) {
          if (record.rates.rate_type === 'per_kg') {
            calculatedRateValue = (record.total_kg || 0) * (record.rates.base_rate || 0)
          } else if (record.rates.rate_type === 'fixed') {
            calculatedRateValue = record.rates.base_rate || 0
          } else if (record.rates.rate_type === 'multiplier') {
            calculatedRateValue = (record.total_kg || 0) * (record.rates.base_rate || 0) * (record.rates.multiplier || 1)
          }
          // Round to 2 decimal places
          calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
        }
        
        return sum + calculatedRateValue
      }, 0)
      
      // Group by month for monthly breakdown and by week for weekly breakdown
      const monthlyData = new Map<string, { weight: number, revenue: number }>()
      const weeklyData = new Map<string, { weight: number, revenue: number }>()
      
      // Helper function to get ISO week number from date
      const getWeekNumber = (date: Date): number => {
        const target = new Date(date.valueOf())
        const dayNr = (date.getDay() + 6) % 7
        target.setDate(target.getDate() - dayNr + 3)
        const firstThursday = target.valueOf()
        target.setMonth(0, 1)
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
        }
        return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
      }
      
      records.forEach((record, index) => {
        // Use flight dates first, then fallback to processed_at/created_at
        const recordDate = parseFlightDate(record.outb_flight_date) || 
                          parseFlightDate(record.inb_flight_date) || 
                          parseFlightDate(record.processed_at) || 
                          parseFlightDate(record.created_at)
        
        // Debug first few records
        if (index < 3) {
          console.log(`📅 Record ${index} date processing:`, {
            outb_flight_date: record.outb_flight_date,
            inb_flight_date: record.inb_flight_date,
            processed_at: record.processed_at,
            created_at: record.created_at,
            parsedDate: recordDate,
            weekNumber: recordDate ? getWeekNumber(recordDate) : 'no date',
            total_kg: record.total_kg,
            rate_value: record.rate_value
          })
        }
        
        if (recordDate) {
          // Monthly grouping
          const monthKey = recordDate.toISOString().substring(0, 7) // YYYY-MM format
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { weight: 0, revenue: 0 })
          }
          
          const monthData = monthlyData.get(monthKey)!
          monthData.weight += record.total_kg || 0
          
          // Weekly grouping - use actual week number (1-52)
          const weekNumber = getWeekNumber(recordDate)
          const weekKey = `week${weekNumber}`
          
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { weight: 0, revenue: 0 })
          }
          
          const weekData = weeklyData.get(weekKey)!
          weekData.weight += record.total_kg || 0
          
          // Calculate revenue for this record using the same logic as ExecuteRates
          let calculatedRateValue = record.rate_value || 0
          
          // If rate_value is 0 or null, calculate from rates table (same logic as ExecuteRates)
          if ((record.rate_value === 0 || record.rate_value === null) && record.rates) {
            if (record.rates.rate_type === 'per_kg') {
              calculatedRateValue = (record.total_kg || 0) * (record.rates.base_rate || 0)
            } else if (record.rates.rate_type === 'fixed') {
              calculatedRateValue = record.rates.base_rate || 0
            } else if (record.rates.rate_type === 'multiplier') {
              calculatedRateValue = (record.total_kg || 0) * (record.rates.base_rate || 0) * (record.rates.multiplier || 1)
            }
            // Round to 2 decimal places
            calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
          }
          
          monthData.revenue += calculatedRateValue
          weekData.revenue += calculatedRateValue
          
          // Debug: Log weekly data accumulation for first few records
          if (index < 3) {
            console.log(`📈 Record ${index} weekly data added:`, {
              weekKey,
              weekNumber,
              weight: record.total_kg || 0,
              revenue: calculatedRateValue,
              weekDataAfter: {
                weight: weekData.weight,
                revenue: weekData.revenue
              }
            })
          }
        }
      })
      
      // Create monthly breakdown - map to all 12 months
      const monthMapping = {
        '2025-01': 'jan',
        '2025-02': 'feb', 
        '2025-03': 'mar',
        '2025-04': 'apr',
        '2025-05': 'may',
        '2025-06': 'jun',
        '2025-07': 'jul',
        '2025-08': 'aug',
        '2025-09': 'sep',
        '2025-10': 'oct',
        '2025-11': 'nov',
        '2025-12': 'dec'
      }
      
      // Initialize all months with null
      const monthlyBreakdown = {
        jan: null,
        feb: null,
        mar: null,
        apr: null,
        may: null,
        jun: null,
        jul: null,
        aug: null,
        sep: null,
        oct: null,
        nov: null,
        dec: null
      }
      
      // Map actual data to correct months
      monthlyData.forEach((data, monthKey) => {
        const monthField = monthMapping[monthKey as keyof typeof monthMapping]
        if (monthField) {
          monthlyBreakdown[monthField as keyof typeof monthlyBreakdown] = viewBy === 'revenue' ? data.revenue : data.weight
        }
      })
      
      // Create weekly breakdown - dynamically create all weeks (1-52)
      const weeklyBreakdown: Record<string, number | null> = {}
      
      // Initialize all weeks with null
      for (let week = 1; week <= 52; week++) {
        weeklyBreakdown[`week${week}`] = null
      }
      
      // Map actual weekly data to correct weeks
      weeklyData.forEach((data, weekKey) => {
        if (weekKey in weeklyBreakdown) {
          weeklyBreakdown[weekKey] = viewBy === 'revenue' ? data.revenue : data.weight
        }
      })
      
      // Debug: Log weekly data for first route
      if (routeLabel === Array.from(routeGroups.keys())[0]) {
        console.log(`🗓️ First route ${routeLabel} weekly debug:`, {
          weeklyDataEntries: Array.from(weeklyData.entries()),
          weeklyBreakdownSample: {
            week1: weeklyBreakdown.week1,
            week2: weeklyBreakdown.week2,
            week3: weeklyBreakdown.week3,
            week4: weeklyBreakdown.week4
          },
          viewBy,
          totalRevenue,
          totalWeight
        })
      }
      
      // Debug logging for monthly and weekly data
      console.log(`Route ${routeLabel} data:`, {
        availableMonths: Array.from(monthlyData.keys()),
        availableWeeks: Array.from(weeklyData.keys()),
        weeklyDataEntries: Array.from(weeklyData.entries()),
        monthlyBreakdown,
        weeklyBreakdown: Object.keys(weeklyBreakdown).filter(key => weeklyBreakdown[key] !== null)
      })
      
      return {
        rowLabel: routeLabel,
        // Monthly data
        jan: monthlyBreakdown.jan,
        feb: monthlyBreakdown.feb,
        mar: monthlyBreakdown.mar,
        apr: monthlyBreakdown.apr,
        may: monthlyBreakdown.may,
        jun: monthlyBreakdown.jun,
        jul: monthlyBreakdown.jul,
        aug: monthlyBreakdown.aug,
        sep: monthlyBreakdown.sep,
        oct: monthlyBreakdown.oct,
        nov: monthlyBreakdown.nov,
        dec: monthlyBreakdown.dec,
        // Weekly data - all 52 weeks
        ...weeklyBreakdown,
        // Totals
        total: viewBy === 'revenue' ? totalRevenue : totalWeight,
        revenue: totalRevenue,
        weight: totalWeight,
        recordCount: records.length
      }
    })
    
    // Sort by the selected view metric
    reportData.sort((a, b) => {
      const aValue = viewBy === 'revenue' ? a.revenue : a.weight
      const bValue = viewBy === 'revenue' ? b.revenue : b.weight
      return bValue - aValue
    })
    
    // Calculate summary statistics
    const summary = {
      totalRevenue: reportData.reduce((sum, item) => sum + item.revenue, 0),
      totalWeight: reportData.reduce((sum, item) => sum + item.weight, 0),
      totalRecords: reportData.reduce((sum, item) => sum + item.recordCount, 0),
      routeCount: reportData.length
    }
    
    console.log('✅ Generated report data:', {
      routeCount: reportData.length,
      totalRecords: summary.totalRecords,
      totalRevenue: summary.totalRevenue,
      totalWeight: summary.totalWeight,
      sampleRoute: reportData[0] ? {
        rowLabel: reportData[0].rowLabel,
        total: reportData[0].total,
        revenue: reportData[0].revenue,
        weekKeys: Object.keys(reportData[0]).filter(key => key.startsWith('week')),
        sampleWeeks: {
          week1: reportData[0].week1,
          week2: reportData[0].week2,
          week3: reportData[0].week3
        }
      } : null
    })
    
    return NextResponse.json({
      data: reportData,
      summary,
      filters: {
        dateFrom,
        dateTo,
        viewBy,
        viewPeriod
      }
    })
    
  } catch (error) {
    console.error('Error in reporting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
