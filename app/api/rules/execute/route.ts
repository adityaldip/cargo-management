import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Executing rules...')
    const body = await request.json()
    const { ruleIds, dryRun = false, processAllData = true } = body

    // Set a longer timeout for this operation (increased for large datasets)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes timeout

    // Get all active rules (or specific rules if ruleIds provided)
    console.log('Fetching rules...')
    let rulesQuery = supabaseAdmin
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

    // Validate that all rules have valid assignTo values
    const rulesWithoutAssignment = rules.filter((rule: any) => !rule.actions?.assignTo)
    if (rulesWithoutAssignment.length > 0) {
      console.warn(`⚠️ Found ${rulesWithoutAssignment.length} rules without customer assignments:`, rulesWithoutAssignment.map((r: any) => r.name))
    }
    console.log('Getting cargo data...')
    console.log('Processing mode: ALL DATA')
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
    
    console.log("Getting customer codes data...")
    // Get customer codes to resolve customer code IDs to customer IDs
    const { data: customerCodes, error: customerCodesError } = await supabaseAdmin
      .from('customer_codes')
      .select(`
        id,
        code,
        customer_id,
        customers!inner(id, name)
      `)
      .eq('is_active', true)

    if (customerCodesError) {
      console.error('Error fetching customer codes:', customerCodesError)
      return NextResponse.json(
        { error: 'Failed to fetch customer codes', details: customerCodesError.message },
        { status: 500 }
      )
    }

    console.log(`Loaded ${customerCodes?.length || 0} customer codes`)
    
    // Validate that we have customer codes available
    if (!customerCodes || customerCodes.length === 0) {
      console.warn('No active customer codes found in database')
    }

    // Filter out rules with invalid customer code assignments (skip them instead of failing)
    const customerCodeIds = customerCodes?.map((cc: any) => cc.id) || []
    const validRules = rules.filter((rule: any) => {
      const assignTo = rule.actions?.assignTo
      if (!assignTo) {
        console.warn(`⚠️ Skipping rule "${rule.name}" - no customer assignment configured`)
        return false
      }
      if (!customerCodeIds.includes(assignTo)) {
        console.warn(`⚠️ Skipping rule "${rule.name}" - invalid customer code assignment (${assignTo})`)
        return false
      }
      return true
    })
    
    const invalidRules = rules.filter((rule: any) => {
      const assignTo = rule.actions?.assignTo
      return !assignTo || !customerCodeIds.includes(assignTo)
    })
    
    if (invalidRules.length > 0) {
      console.warn(`⚠️ Skipping ${invalidRules.length} rules with invalid customer code assignments:`, invalidRules.map((r: any) => r.name))
    }
    
    if (validRules.length === 0) {
      return NextResponse.json(
        { error: 'No valid rules found with proper customer code assignments' },
        { status: 400 }
      )
    }
    
    console.log(`✅ Processing ${validRules.length} valid rules (skipped ${invalidRules.length} invalid rules)`)


    if (!cargoData || cargoData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No cargo data found',
        results: {
          totalProcessed: 0,
          totalAssigned: 0,
          totalSkipped: 0,
          validRulesProcessed: validRules.length,
          invalidRulesSkipped: invalidRules.length,
          skippedRules: invalidRules.map((rule: any) => ({
            name: rule.name,
            reason: !rule.actions?.assignTo ? 'No customer assignment configured' : 'Invalid customer code assignment',
            assignTo: rule.actions?.assignTo || null
          })),
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
    
    // Debug: Log available customer codes
    console.log(`Available customer codes:`, customerCodes?.map((cc: any) => ({ 
      id: cc.id, 
      code: cc.code, 
      customer_id: cc.customer_id,
      customer_name: cc.customers?.name 
    })))

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

    // Ensure valid rules are sorted by priority (additional safeguard)
    const sortedRules = [...validRules].sort((a: any, b: any) => a.priority - b.priority)
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
        
        // Skip if already has an assigned customer (since we're processing all data)
        if ((cargo as any).assigned_customer) {
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
            case 'is_empty':
              return !fieldValue || fieldValue.trim() === ''
            case 'not_empty':
              return fieldValue && fieldValue.trim() !== ''
            case 'does_not_contain':
              return !fieldValue.includes(conditionValue)
            default:
              return false
          }
        })

        if (matches) {
          console.log(`✅ MATCH FOUND! Rule ${(rule as any).name} matched cargo ${(cargo as any).rec_id} (des_no: ${(cargo as any).des_no})`)
          
          // Resolve customer code ID to customer ID
          let assignedCustomerId = (rule as any).actions.assignTo
          let customerCodeInfo = null
          
          // If assignTo is a customer code ID, find the corresponding customer ID
          if (customerCodes && customerCodes.length > 0) {
            const customerCode = customerCodes.find((cc: any) => cc.id === (rule as any).actions.assignTo)
            if (customerCode) {
              assignedCustomerId = (customerCode as any).customer_id
              customerCodeInfo = {
                code: (customerCode as any).code,
                customerName: (customerCode as any).customers?.name || 'Unknown Customer'
              }
              console.log(`✅ Resolved customer code ID "${(rule as any).actions.assignTo}" (${(customerCode as any).code}) to customer ID: ${assignedCustomerId} (${(customerCode as any).customers?.name})`)
            } else {
              // If not found by customer code ID, assume it's already a customer ID (backward compatibility)
              console.warn(`⚠️ Customer code ID "${(rule as any).actions.assignTo}" not found in active customer codes, using as customer ID: ${assignedCustomerId}`)
            }
          } else {
            console.warn(`⚠️ No customer codes available, using assignTo value as customer ID: ${assignedCustomerId}`)
          }

          ruleResult.matches++
          ruleResult.assignments.push({
            cargoId: (cargo as any).id,
            recId: (cargo as any).rec_id,
            assignedCustomer: assignedCustomerId,
            customerCode: customerCodeInfo?.code || null,
            customerName: customerCodeInfo?.customerName || null
          } as any)

          assignments.push({
            id: (cargo as any).id,
            assigned_customer: assignedCustomerId,
            customer_code_id: (rule as any).actions.assignTo, // Store the original customer code ID
            assigned_at: new Date().toISOString()
          } as any)
          
          if (customerCodeInfo) {
            console.log(`📝 Assignment created: cargo ${(cargo as any).rec_id} → customer code ${customerCodeInfo.code} (${customerCodeInfo.customerName}) → customer ID ${assignedCustomerId}`)
          } else {
            console.log(`📝 Assignment created: cargo ${(cargo as any).rec_id} → customer ID ${assignedCustomerId}`)
          }
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
    console.log(`Customer codes available: ${customerCodes?.length || 0}`)
    console.log(`Valid rules processed: ${validRules.length}`)
    console.log(`Invalid rules skipped: ${invalidRules.length}`)
    console.log(`Rules executed in priority order:`)
    results.ruleResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.ruleName}: ${result.matches} assignments`)
    })
    
    if (invalidRules.length > 0) {
      console.log(`\n⚠️ Skipped Rules (Invalid Customer Code Assignments):`)
      invalidRules.forEach((rule: any, index: number) => {
        console.log(`  ${index + 1}. ${rule.name}: ${rule.actions?.assignTo || 'No assignment'}`)
      })
    }
    
    // Log customer code usage summary
    const customerCodeUsage = new Map()
    results.ruleResults.forEach((result: any) => {
      result.assignments.forEach((assignment: any) => {
        if (assignment.customerCode) {
          const key = `${assignment.customerCode} (${assignment.customerName})`
          customerCodeUsage.set(key, (customerCodeUsage.get(key) || 0) + 1)
        }
      })
    })
    
    if (customerCodeUsage.size > 0) {
      console.log(`\n📋 Customer Code Assignment Summary:`)
      customerCodeUsage.forEach((count, customerCode) => {
        console.log(`  ${customerCode}: ${count} assignments`)
      })
    }

    // If not a dry run, update the database
    if (!dryRun && assignments.length > 0) {
      console.log(`Updating ${assignments.length} cargo records...`)
      
      // Process in batches for better performance (optimized for 5MB payload limit)
      const batchSize = 2000 // Conservative estimate: ~250 bytes per record = ~500KB per batch
      const batches = []
      for (let i = 0; i < assignments.length; i += batchSize) {
        batches.push(assignments.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        console.log(`Processing batch of ${batch.length} records...`)
        
        // Use Promise.all for concurrent updates within each batch
        const updatePromises = batch.map((assignment: any) => 
          (supabaseAdmin as any)
            .from('cargo_data')
            .update({
              assigned_customer: assignment.assigned_customer,
              customer_code_id: assignment.customer_code_id,
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

      const { error: rulesUpdateError } = await supabaseAdmin
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
      results: {
        ...results,
        validRulesProcessed: validRules.length,
        invalidRulesSkipped: invalidRules.length,
        skippedRules: invalidRules.map((rule: any) => ({
          name: rule.name,
          reason: !rule.actions?.assignTo ? 'No customer assignment configured' : 'Invalid customer code assignment',
          assignTo: rule.actions?.assignTo || null
        }))
      }
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
