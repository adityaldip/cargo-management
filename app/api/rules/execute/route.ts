import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Executing rules...')
    const body = await request.json()
    const { ruleIds, dryRun = false } = body

    // Set a longer timeout for this operation
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    // Get all active rules (or specific rules if ruleIds provided)
    console.log('Fetching rules...')
    let rulesQuery = supabase
      .from('customer_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (ruleIds && ruleIds.length > 0) {
      rulesQuery = rulesQuery.in('id', ruleIds)
    }
    
    const { data: rules, error: rulesError } = await rulesQuery
    console.log('Total Rules:', rules?.length)

    if (rulesError) {
      console.error('Error fetching rules:', rulesError)
      return NextResponse.json(
        { error: 'Failed to fetch rules', details: rulesError.message },
        { status: 500 }
      )
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json(
        { error: 'No active rules found' },
        { status: 400 }
      )
    }
    console.log('getting cargo data...')
    // Get all cargo data that doesn't have assigned customers (null or empty string)
    const { data: cargoData, error: cargoError } = await supabase
      .from('cargo_data')
      .select('*')
      .or('assigned_customer.is.null,assigned_customer.eq.')

    console.log("total cargo data:", cargoData?.length)    
    
    console.log("getting customers data...")
    // Also get customers to resolve customer names to IDs
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('is_active', true)

    if (customersError) {
      console.error('Error fetching customers:', customersError)
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: customersError.message },
        { status: 500 }
      )
    }

    if (cargoError) {
      console.error('Error fetching cargo data:', cargoError)
      return NextResponse.json(
        { error: 'Failed to fetch cargo data', details: cargoError.message },
        { status: 500 }
      )
    }

    if (!cargoData || cargoData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unassigned cargo data found',
        results: {
          totalProcessed: 0,
          totalAssigned: 0,
          totalSkipped: 0,
          ruleResults: []
        }
      })
    }

    // Debug: Log sample cargo data
    console.log(`Processing ${cargoData.length} cargo records`)
    console.log('Sample cargo data:', cargoData.slice(0, 3).map((c: any) => ({ 
      id: c.id, 
      rec_id: c.rec_id, 
      des_no: c.des_no, 
      orig_oe: c.orig_oe, 
      dest_oe: c.dest_oe,
      assigned_customer: c.assigned_customer 
    })))
    
    // Debug: Check for specific cargo with des_no = "USFRAT"
    const usfratCargo = cargoData.filter((c: any) => c.des_no === "USFRAT")
    console.log(`Cargo records with des_no = "USFRAT":`, usfratCargo.length)
    if (usfratCargo.length > 0) {
      console.log('USFRAT cargo details:', usfratCargo.map((c: any) => ({
        id: c.id,
        rec_id: c.rec_id,
        des_no: c.des_no,
        assigned_customer: c.assigned_customer
      })))
    }
    
    // Debug: Log available customers
    console.log(`Available customers:`, customers?.map((c: any) => ({ id: c.id, name: c.name })))

    const results = {
      totalProcessed: cargoData.length,
      totalAssigned: 0,
      totalSkipped: 0,
      ruleResults: [] as Array<{
        ruleId: string
        ruleName: string
        matches: number
        assignments: Array<{
          cargoId: string
          recId: string
          assignedCustomer: string
        }>
      }>
    }

    const assignments: Array<{
      id: string
      assigned_customer: string
      assigned_at: string
    }> = []

    // Debug: Log rules being processed in priority order
    console.log(`Processing ${rules.length} rules in priority order:`, rules.map((r: any) => ({ 
      id: r.id, 
      name: r.name, 
      priority: r.priority, 
      conditions: r.conditions, 
      actions: r.actions 
    })))

    // Ensure rules are sorted by priority (additional safeguard)
    const sortedRules = [...rules].sort((a: any, b: any) => a.priority - b.priority)
    console.log(`Rules sorted by priority:`, sortedRules.map((r: any) => ({ 
      name: r.name, 
      priority: r.priority 
    })))

    // Process each rule in priority order (1 = highest priority)
    for (const rule of sortedRules as any[]) {
      console.log(`\n🎯 Processing Rule: "${(rule as any).name}" (Priority: ${(rule as any).priority})`)
      
      const ruleResult = {
        ruleId: (rule as any).id,
        ruleName: (rule as any).name,
        matches: 0,
        assignments: [] as Array<{
          cargoId: string
          recId: string
          assignedCustomer: string
        }>
      }

      // Find cargo records that match this rule
      let skippedCount = 0
      for (const cargo of cargoData) {
        // Skip if already assigned by a higher priority rule
        if (assignments.some(a => a.id === (cargo as any).id)) {
          skippedCount++
          continue
        }

        // Check if cargo matches rule conditions
        const matches = (rule as any).conditions.some((condition: any) => {
          const fieldValue = String(cargo[condition.field] || '').toLowerCase()
          const conditionValue = condition.value.toLowerCase()

          // Debug logging
          console.log(`Rule ${(rule as any).name}: Checking condition ${condition.field} = "${fieldValue}" vs "${conditionValue}" (operator: ${condition.operator})`)

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
          console.log(`✅ MATCH FOUND! Rule ${(rule as any).name} matched cargo ${(cargo as any).rec_id} (des_no: ${(cargo as any).des_no})`)
          
          // Resolve customer name to ID if needed
          let assignedCustomerId = (rule as any).actions.assignTo
          
          // If assignTo is a customer name, find the corresponding ID
          if (customers && customers.length > 0) {
            const customer = customers.find((c: any) => c.name === (rule as any).actions.assignTo)
            if (customer) {
              assignedCustomerId = (customer as any).id
              console.log(`Resolved customer name "${(rule as any).actions.assignTo}" to ID: ${assignedCustomerId}`)
            } else {
              // If not found by name, assume it's already an ID
              console.log(`Customer "${(rule as any).actions.assignTo}" not found, using as ID: ${assignedCustomerId}`)
            }
          }

          ruleResult.matches++
          ruleResult.assignments.push({
            cargoId: (cargo as any).id,
            recId: (cargo as any).rec_id,
            assignedCustomer: assignedCustomerId
          })

          assignments.push({
            id: (cargo as any).id,
            assigned_customer: assignedCustomerId,
            assigned_at: new Date().toISOString()
          })
          
          console.log(`📝 Assignment created: cargo ${(cargo as any).rec_id} → customer ${assignedCustomerId}`)
        }
      }

      console.log(`✅ Rule "${(rule as any).name}" completed: ${ruleResult.matches} matches, ${skippedCount} skipped (already assigned by higher priority rules)`)
      results.ruleResults.push(ruleResult)
    }

    results.totalAssigned = assignments.length
    results.totalSkipped = results.totalProcessed - results.totalAssigned

    // Log priority execution summary
    console.log(`\n📊 Priority Execution Summary:`)
    console.log(`Total cargo records processed: ${results.totalProcessed}`)
    console.log(`Total assignments made: ${results.totalAssigned}`)
    console.log(`Total skipped: ${results.totalSkipped}`)
    console.log(`Rules executed in priority order:`)
    results.ruleResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.ruleName}: ${result.matches} assignments`)
    })

    // If not a dry run, update the database
    if (!dryRun && assignments.length > 0) {
      console.log(`Updating ${assignments.length} cargo records...`)
      
      // Process in smaller batches to avoid timeout
      const batchSize = 50
      const batches = []
      for (let i = 0; i < assignments.length; i += batchSize) {
        batches.push(assignments.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        console.log(`Processing batch of ${batch.length} records...`)
        
        // Use Promise.all for concurrent updates within each batch
        const updatePromises = batch.map(assignment => 
          (supabase as any)
            .from('cargo_data')
            .update({
              assigned_customer: assignment.assigned_customer,
              assigned_at: assignment.assigned_at
            })
            .eq('id', assignment.id)
        )

        const results = await Promise.allSettled(updatePromises)
        
        // Check for errors
        const errors = results
          .map((result, index) => result.status === 'rejected' ? { index, error: result.reason } : null)
          .filter(Boolean)

        if (errors.length > 0) {
          console.error(`Errors in batch:`, errors)
        }
      }

      // This block is no longer needed since we handle errors in the loop above

      // Update rule match counts and last run timestamps
      const ruleUpdates = results.ruleResults.map(result => ({
        id: result.ruleId,
        match_count: result.matches,
        last_run: new Date().toISOString()
      }))

      const { error: rulesUpdateError } = await supabase
        .from('customer_rules')
        .upsert(ruleUpdates as any, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (rulesUpdateError) {
        console.error('Error updating rule statistics:', rulesUpdateError)
        // Don't fail the entire operation for this
      }
    }

    clearTimeout(timeoutId)
    
    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed. Would assign ${results.totalAssigned} records.`
        : `Successfully assigned ${results.totalAssigned} records.`,
      results
    })

  } catch (error) {
    console.error('Error executing rules:', error)
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - operation took too long', details: 'Please try with fewer rules or smaller dataset' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
