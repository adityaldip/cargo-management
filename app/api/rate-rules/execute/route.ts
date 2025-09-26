import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cargoDataOperations } from '@/lib/supabase-operations'

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
    // OPTIMIZATION: Load only necessary fields and filter out already assigned records
    // This reduces data transfer and processing time significantly
    const startTime = Date.now()
    
    // Get ALL unassigned cargo data with essential fields
    // Use pagination to handle large datasets without memory issues
    let allCargoData: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    console.log('📥 Loading all unassigned cargo data...')
    
    while (hasMore) {
      const { data: cargoData, error: cargoError } = await supabaseAdmin
        .from('cargo_data')
        .select(`
          id,
          rec_id,
          rec_numb,
          orig_oe,
          dest_oe,
          mail_cat,
          mail_class,
          total_kg,
          invoice,
          assigned_customer,
          rate_id,
          rate_value
        `)
        .is('rate_id', null) // Only get records without assigned rates
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
        console.log(`📥 Loaded page ${page + 1}: ${cargoData.length} records (Total so far: ${allCargoData.length})`)
        page++
        hasMore = cargoData.length === pageSize // If we got less than pageSize, we're done
        
        // Memory optimization: if we have too many records, process in chunks
        if (allCargoData.length > 100000) {
          console.log(`⚠️ Large dataset detected (${allCargoData.length} records). Consider processing in smaller batches.`)
        }
      } else {
        hasMore = false
      }
    }

    const cargoData = allCargoData

    // Type the cargo data properly
    interface CargoRecord {
      id: string
      rec_id: string
      rec_numb?: string
      orig_oe?: string
      dest_oe?: string
      mail_cat?: string
      mail_class?: string
      total_kg?: number
      invoice?: string
      assigned_customer?: string
      rate_id?: string
      rate_value?: number
    }

    const typedCargoData: CargoRecord[] = cargoData

    const dataLoadTime = Date.now() - startTime
    console.log(`✅ Cargo data loaded: ${typedCargoData.length} unassigned records in ${dataLoadTime}ms`)

    // Safety check for extremely large datasets
    if (typedCargoData.length > 1000000) {
      console.warn(`⚠️ Very large dataset detected: ${typedCargoData.length} records`)
      console.warn(`⚠️ This may take a long time to process. Consider running during off-peak hours.`)
    }

    if (typedCargoData.length === 0) {
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

    // OPTIMIZATION: Pre-process rules and create efficient matching functions
    const ruleProcessingStart = Date.now()
    
    // Sort rules by priority (1 = highest priority)
    const sortedRules = (rateRules as any[]).sort((a: any, b: any) => a.priority - b.priority)
    
    console.log('🚀 Processing rules in priority order:', 
      sortedRules.map((r: any) => ({ 
        name: r.name, 
        priority: r.priority,
        conditionsCount: r.conditions?.length || 0
      }))
    )

    // Pre-compile rule matching functions for better performance
    interface CompiledRule {
      id: string
      name: string
      priority: number
      rate: any
      conditionMatchers: Array<(cargo: any) => boolean>
      matches: number
      assignments: Array<{
        cargoId: string
        recId: string
        assignedRate: string
        rateValue: number
      }>
    }

    const compiledRules: CompiledRule[] = sortedRules.map((rule: any) => {
      const rate = rule.rates
      if (!rate || !rate.id) {
        console.warn(`⚠️ Skipping rule "${rule.name}" - no valid rate found`)
        return null
      }

      // Create optimized condition matcher
      const conditionMatchers = rule.conditions.map((condition: any) => {
        const field = condition.field
        const operator = condition.operator
        const value = condition.value.toLowerCase()
        
        return (cargo: any): boolean => {
          const fieldValue = String(cargo[field] || '').toLowerCase()
          
          switch (operator) {
            case 'equals':
              // Handle multi-select values (comma-separated)
              if (value.includes(',')) {
                const conditionValues = value.split(',').map(v => v.trim()).filter(Boolean)
                return conditionValues.includes(fieldValue)
              } else {
                return fieldValue === value
              }
            case 'contains':
              // Handle multi-select values for contains
              if (value.includes(',')) {
                const conditionValues = value.split(',').map(v => v.trim()).filter(Boolean)
                return conditionValues.some(conditionValue => fieldValue.includes(conditionValue))
              } else {
                return fieldValue.includes(value)
              }
            case 'starts_with':
              // Handle multi-select values for starts_with
              if (value.includes(',')) {
                const conditionValues = value.split(',').map(v => v.trim()).filter(Boolean)
                return conditionValues.some(conditionValue => fieldValue.startsWith(conditionValue))
              } else {
                return fieldValue.startsWith(value)
              }
            case 'ends_with':
              // Handle multi-select values for ends_with
              if (value.includes(',')) {
                const conditionValues = value.split(',').map(v => v.trim()).filter(Boolean)
                return conditionValues.some(conditionValue => fieldValue.endsWith(conditionValue))
              } else {
                return fieldValue.endsWith(value)
              }
            case 'greater_than':
              return parseFloat(fieldValue) > parseFloat(value)
            case 'less_than':
              return parseFloat(fieldValue) < parseFloat(value)
            case 'is_empty':
              return !fieldValue || fieldValue.trim() === ''
            case 'not_empty':
              return fieldValue && fieldValue.trim() !== ''
            case 'does_not_contain':
              // Handle multi-select values for does_not_contain
              if (value.includes(',')) {
                const conditionValues = value.split(',').map(v => v.trim()).filter(Boolean)
                return !conditionValues.some(conditionValue => fieldValue.includes(conditionValue))
              } else {
                return !fieldValue.includes(value)
              }
            default:
              return false
          }
        }
      })

      return {
        id: rule.id,
        name: rule.name,
        priority: rule.priority,
        rate,
        conditionMatchers,
        matches: 0,
        assignments: [] as Array<{
          cargoId: string
          recId: string
          assignedRate: string
          rateValue: number
        }>
      }
    }).filter((rule): rule is CompiledRule => rule !== null) // Remove null entries with proper type guard

    console.log(`✅ Compiled ${compiledRules.length} valid rules`)

    // Track assignments to avoid duplicate processing
    const assignments = new Set<string>()
    const allUpdates: Array<{ id: string; updates: any }> = []

    // Process each rule in priority order
    for (const rule of compiledRules) {
      const ruleStart = Date.now()
      console.log(`\n🎯 Processing Rule: "${rule.name}" (Priority: ${rule.priority})`)
      
      let processedCount = 0
      let matchedCount = 0

      // OPTIMIZATION: Process cargo data in chunks for better memory usage
      // Use smaller chunks for very large datasets to prevent memory issues
      const chunkSize = typedCargoData.length > 50000 ? 500 : 1000
      const totalChunks = Math.ceil(typedCargoData.length / chunkSize)
      
      for (let i = 0; i < typedCargoData.length; i += chunkSize) {
        const chunk = typedCargoData.slice(i, i + chunkSize)
        const currentChunk = Math.floor(i / chunkSize) + 1
        
        // Progress reporting for large datasets
        if (typedCargoData.length > 10000 && currentChunk % 10 === 0) {
          console.log(`   📊 Processing chunk ${currentChunk}/${totalChunks} (${Math.round((currentChunk / totalChunks) * 100)}%)`)
        }
        
        for (const cargo of chunk) {
          processedCount++
          
          // Skip if already assigned by a higher priority rule
          if (assignments.has(cargo.id)) {
            continue
          }

          // Check if cargo matches ALL rule conditions
          const matches = rule.conditionMatchers.length > 0 && 
            rule.conditionMatchers.every(matcher => matcher(cargo))

          if (matches) {
            // Calculate rate value
            let rateValue = 0
            if (rule.rate.rate_type === 'per_kg') {
              rateValue = (cargo.total_kg || 0) * (rule.rate.base_rate || 0)
            } else if (rule.rate.rate_type === 'fixed') {
              rateValue = rule.rate.base_rate || 0
            } else if (rule.rate.rate_type === 'multiplier') {
              rateValue = (cargo.total_kg || 0) * (rule.rate.base_rate || 0) * (rule.rate.multiplier || 1)
            }

            rateValue = Math.round(rateValue * 100) / 100

            // Add to assignments
            rule.assignments.push({
              cargoId: cargo.id,
              recId: cargo.rec_id || cargo.rec_numb || 'Unknown',
              assignedRate: rule.rate.name || 'Unknown Rate',
              rateValue: rateValue
            })

            // Validate cargo record has required fields before adding to updates
            if (!cargo.id || !cargo.rec_id) {
              console.warn(`⚠️ Skipping cargo record with missing required fields: id=${cargo.id}, rec_id=${cargo.rec_id}`)
              continue
            }

            // Prepare update data
            allUpdates.push({
              id: cargo.id,
              updates: {
                rate_id: rule.rate.id,
                rate_value: rateValue,
                rate_currency: rule.rate.currency || 'EUR',
                assigned_at: new Date().toISOString()
              }
            })

            // Mark as assigned
            assignments.add(cargo.id)
            matchedCount++
          }
        }
      }

      const ruleTime = Date.now() - ruleStart
      console.log(`✅ Rule "${rule.name}": ${matchedCount} matches in ${ruleTime}ms (processed ${processedCount} records)`)
    }

    const processingTime = Date.now() - ruleProcessingStart
    console.log(`\n🚀 Rule processing completed in ${processingTime}ms`)
    console.log(`📊 Total matches found: ${assignments.size}`)
    console.log(`📊 Total updates prepared: ${allUpdates.length}`)

    // OPTIMIZATION: Use bulk update for maximum performance
    if (!dryRun && allUpdates.length > 0) {
      const updateStart = Date.now()
      console.log(`\n🚀 Starting bulk update of ${allUpdates.length} cargo records...`)
      
      try {
        // Use the new bulk update operation
        const { data: updateResults, error: updateError } = await cargoDataOperations.bulkUpdate(allUpdates)
        
        const updateTime = Date.now() - updateStart
        
        if (updateError) {
          console.error(`❌ Bulk update failed:`, updateError)
          return NextResponse.json(
            { error: 'Failed to update cargo data', details: updateError },
            { status: 500 }
          )
        }

        // Handle partial success
        const successfulUpdates = updateResults?.totalUpdated || 0
        const failedUpdates = updateResults?.totalFailed || 0
        
        console.log(`✅ Bulk update completed in ${updateTime}ms`)
        console.log(`📊 Successfully updated: ${successfulUpdates} records`)
        
        if (failedUpdates > 0) {
          console.warn(`⚠️ ${failedUpdates} updates failed`)
          // Don't fail the entire operation for partial success
        }
        
      } catch (error) {
        console.error(`❌ Bulk update exception:`, error)
        return NextResponse.json(
          { error: 'Bulk update failed', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else if (dryRun) {
      console.log(`\n🔍 DRY RUN: Would update ${allUpdates.length} cargo records`)
    }

    // Calculate summary statistics
    const totalProcessed = typedCargoData.length
    const totalAssigned = assignments.size
    const totalExecutionTime = Date.now() - startTime

    console.log(`\n📊 Execution Summary:`)
    console.log(`- Total cargo records processed: ${totalProcessed}`)
    console.log(`- Total records assigned rates: ${totalAssigned}`)
    console.log(`- Rules executed: ${compiledRules.length}`)
    console.log(`- Total execution time: ${totalExecutionTime}ms`)
    console.log(`- Performance: ${Math.round(totalProcessed / (totalExecutionTime / 1000))} records/second`)

    // Clear timeout
    clearTimeout(timeoutId)

    return NextResponse.json({
      success: true,
      results: {
        totalProcessed,
        totalAssigned,
        executionTimeMs: totalExecutionTime,
        performanceRecordsPerSecond: Math.round(totalProcessed / (totalExecutionTime / 1000)),
        ruleResults: compiledRules.map(r => ({
          ruleName: r.name,
          matches: r.assignments.length,
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
