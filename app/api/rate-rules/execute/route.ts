import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('Executing rate rules...')
    const body = await request.json()
    const { ruleIds, dryRun = false } = body

    // Set a longer timeout for this operation (increased for large datasets)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes timeout

    // Get all active rate rules (or specific rules if ruleIds provided)
    console.log('Fetching rate rules...')
    let rulesQuery = supabaseAdmin
      .from('rate_rules')
      .select(`
        *,
        rates (
          id,
          name,
          description,
          rate_type,
          base_rate,
          currency,
          multiplier,
          tags,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (ruleIds && ruleIds.length > 0) {
      rulesQuery = rulesQuery.in('id', ruleIds)
    }
    
    const { data: rateRules, error: rulesError } = await rulesQuery
    console.log('Total Rate Rules:', rateRules?.length)

    if (rulesError) {
      console.error('Error fetching rate rules:', rulesError)
      return NextResponse.json(
        { error: 'Failed to fetch rate rules', details: rulesError.message },
        { status: 500 }
      )
    }

    if (!rateRules || rateRules.length === 0) {
      return NextResponse.json(
        { error: 'No active rate rules found' },
        { status: 400 }
      )
    }

    console.log('Getting cargo data...')
    // Get all cargo data - always process all data
    // Use pagination to handle large datasets (Supabase default limit is 1000)
    let allCargoData: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: cargoData, error: cargoError } = await supabaseAdmin
        .from('cargo_data')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (cargoError) {
        console.error('Error fetching cargo data:', cargoError)
        return NextResponse.json(
          { error: 'Failed to fetch cargo data', details: cargoError.message },
          { status: 500 }
        )
      }

      if (cargoData && cargoData.length > 0) {
        allCargoData.push(...cargoData)
        console.log(`Fetched page ${page + 1}: ${cargoData.length} records (Total so far: ${allCargoData.length})`)
        page++
        hasMore = cargoData.length === pageSize // If we got less than pageSize, we're done
      } else {
        hasMore = false
      }
    }

    const cargoData = allCargoData
    console.log("Total cargo data fetched:", cargoData.length)

    if (!cargoData || cargoData.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          results: {
            totalProcessed: 0,
            totalAssigned: 0,
            ruleResults: []
          }
        }
      )
    }

    // Track assignments to avoid duplicate processing
    const assignments = new Set<string>()
    const ruleResults: Array<{
      ruleId: string
      ruleName: string
      matches: number
      assignments: Array<{
        cargoId: string
        recId: string
        assignedRate: string
        rateValue: number
      }>
    }> = []

    // Sort rules by priority (1 = highest priority)
    const sortedRules = rateRules.sort((a, b) => a.priority - b.priority)
    
    console.log('Processing rules in priority order:', 
      sortedRules.map((r: any) => ({ 
        name: r.name, 
        priority: r.priority 
      }))
    )

    // Process each rule in priority order (1 = highest priority)
    for (const rule of sortedRules as any[]) {
      console.log(`\n🎯 Processing Rate Rule: "${rule.name}" (Priority: ${rule.priority})`)
      
      const ruleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        matches: 0,
        assignments: [] as Array<{
          cargoId: string
          recId: string
          assignedRate: string
          rateValue: number
        }>
      }

      // Find cargo records that match this rule
      let skippedCount = 0
      for (const cargo of cargoData) {
        // Skip if already assigned by a higher priority rule
        if (assignments.has(cargo.id)) {
          skippedCount++
          continue
        }
        
        // Skip if already has an assigned rate (since we're processing all data)
        if (cargo.assigned_rate && cargo.assigned_rate !== null) {
          skippedCount++
          continue
        }

        // Check if cargo matches rule conditions
        const matches = rule.conditions.some((condition: any) => {
          const fieldValue = String(cargo[condition.field] || '').toLowerCase()
          const conditionValue = condition.value.toLowerCase()

          // Debug logging
          console.log(`Rule ${rule.name}: Checking condition ${condition.field} = "${fieldValue}" vs "${conditionValue}" (operator: ${condition.operator})`)

          switch (condition.operator) {
            case 'equals':
              return fieldValue === conditionValue
            case 'contains':
              return fieldValue.includes(conditionValue)
            case 'starts_with':
              return fieldValue.startsWith(conditionValue)
            case 'ends_with':
              return fieldValue.endsWith(conditionValue)
            case 'greater_than':
              return parseFloat(fieldValue) > parseFloat(conditionValue)
            case 'less_than':
              return parseFloat(fieldValue) < parseFloat(conditionValue)
            default:
              return false
          }
        })

        if (matches) {
          console.log(`✅ Match found for cargo ${cargo.rec_id} with rule "${rule.name}"`)
          
          // Get the rate information
          const rate = rule.rates
          if (!rate) {
            console.warn(`⚠️ No rate found for rule "${rule.name}"`)
            continue
          }

          // Calculate rate value based on rate type
          let rateValue = 0
          if (rate.rate_type === 'per_kg') {
            rateValue = (cargo.total_kg || 0) * (rate.base_rate || 0)
          } else if (rate.rate_type === 'fixed') {
            rateValue = rate.base_rate || 0
          } else if (rate.rate_type === 'multiplier') {
            rateValue = (cargo.total_kg || 0) * (rate.base_rate || 0) * (rate.multiplier || 1)
          }

          // Always round to 2 decimal places for all currencies
          rateValue = Math.round(rateValue * 100) / 100

          // Debug logging for rate calculation
          console.log(`💰 Rate calculation for ${cargo.rec_id}: type=${rate.rate_type}, base_rate=${rate.base_rate}, currency=${rate.currency}, total_kg=${cargo.total_kg}, multiplier=${rate.multiplier}, calculated_value=${rateValue}`)

          ruleResult.matches++
          ruleResult.assignments.push({
            cargoId: cargo.id,
            recId: cargo.rec_id || cargo.rec_numb || 'Unknown',
            assignedRate: rate.name || 'Unknown Rate',
            rateValue: rateValue
          })

          // Mark as assigned
          assignments.add(cargo.id)
        }
      }

      console.log(`Rule "${rule.name}" matched ${ruleResult.matches} records (skipped ${skippedCount} already assigned)`)
      ruleResults.push(ruleResult)
    }

    // Update cargo_data with assigned rates
    if (!dryRun && assignments.size > 0) {
      console.log(`\n📝 Updating ${assignments.size} cargo records with assigned rates...`)
      
      // Prepare batch updates
      const updates = []
      for (const ruleResult of ruleResults) {
        for (const assignment of ruleResult.assignments) {
          // Find the rule that contains this assignment
          const rule = rateRules.find((r: any) => r.id === ruleResult.ruleId)
          const rate = rule?.rates
          
          // Debug logging for update preparation
          console.log(`📝 Preparing update for ${assignment.recId}: rate_id=${rate?.id}, rate_value=${assignment.rateValue}, currency=${rate?.currency || 'EUR'}, rate_type=${rate?.rate_type}`)
          
          updates.push({
            id: assignment.cargoId,
            rate_id: rate?.id,
            rate_value: assignment.rateValue,
            rate_currency: rate?.currency || 'EUR',
            assigned_at: new Date().toISOString()
          })
        }
      }

      // Batch update cargo_data - update existing records only
      const updatePromises = updates.map(update => 
        supabaseAdmin
          .from('cargo_data')
          .update({
            rate_id: update.rate_id,
            rate_value: update.rate_value,
            rate_currency: update.rate_currency,
            assigned_at: update.assigned_at
          })
          .eq('id', update.id)
      )
      
      const updateResults = await Promise.all(updatePromises)
      const updateError = updateResults.find(result => result.error)?.error

      if (updateError) {
        console.error('Error updating cargo data:', updateError)
        return NextResponse.json(
          { error: 'Failed to update cargo data', details: updateError.message },
          { status: 500 }
        )
      }

      console.log(`✅ Successfully updated ${updates.length} cargo records`)
    }

    // Calculate summary statistics
    const totalProcessed = cargoData.length
    const totalAssigned = assignments.size

    console.log(`\n📊 Execution Summary:`)
    console.log(`- Total cargo records processed: ${totalProcessed}`)
    console.log(`- Total records assigned rates: ${totalAssigned}`)
    console.log(`- Rules executed: ${ruleResults.length}`)

    // Clear timeout
    clearTimeout(timeoutId)

    return NextResponse.json({
      success: true,
      results: {
        totalProcessed,
        totalAssigned,
        ruleResults: ruleResults.map(r => ({
          ruleName: r.ruleName,
          matches: r.matches,
          assignments: r.assignments.length
        }))
      }
    })

  } catch (error) {
    console.error('Rate rules execution error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Execution timeout - operation took too long' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
