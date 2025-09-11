// Simple script to test cargo_data table and add sample data if needed
// Run with: node scripts/test-cargo-data.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCargoData() {
  try {
    console.log('Testing cargo_data table...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('cargo_data')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check if table has data
    const { count, error: countError } = await supabase
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Count query failed:', countError.message)
      return
    }
    
    console.log(`📊 Found ${count} records in cargo_data table`)
    
    if (count === 0) {
      console.log('📝 No data found. Adding sample data...')
      await addSampleData()
    } else {
      // Show sample records
      const { data: sampleData, error: sampleError } = await supabase
        .from('cargo_data')
        .select('id, assigned_customer, total_kg, created_at')
        .limit(3)
      
      if (sampleError) {
        console.error('❌ Sample query failed:', sampleError.message)
        return
      }
      
      console.log('📋 Sample records:')
      sampleData.forEach((record, index) => {
        console.log(`  ${index + 1}. Customer: ${record.assigned_customer || 'N/A'}, Weight: ${record.total_kg || 'N/A'}kg, Date: ${record.created_at}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function addSampleData() {
  const sampleData = [
    {
      rec_id: 'SAMPLE001',
      orig_oe: 'USFRAT',
      dest_oe: 'USRIXT',
      inb_flight_no: 'AA123',
      outb_flight_no: 'AA456',
      mail_cat: 'A',
      mail_class: 'B',
      total_kg: 25.5,
      invoice: 'INV-SAMPLE-001',
      customer_name_number: 'AirMail Limited / ZZXDA14',
      assigned_customer: 'AirMail Limited',
      assigned_rate: 1.25,
      rate_currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      rec_id: 'SAMPLE002',
      orig_oe: 'DKCPHA',
      dest_oe: 'FRANK',
      inb_flight_no: 'SK789',
      outb_flight_no: 'SK012',
      mail_cat: 'B',
      mail_class: 'A',
      total_kg: 18.3,
      invoice: 'INV-SAMPLE-002',
      customer_name_number: 'Euro Express',
      assigned_customer: 'Euro Express',
      assigned_rate: 1.15,
      rate_currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      rec_id: 'SAMPLE003',
      orig_oe: 'SEARNK',
      dest_oe: 'OSLO',
      inb_flight_no: 'DY345',
      outb_flight_no: 'DY678',
      mail_cat: 'A',
      mail_class: 'A',
      total_kg: 32.1,
      invoice: 'INV-SAMPLE-003',
      customer_name_number: 'Nordic Post',
      assigned_customer: 'Nordic Post',
      assigned_rate: 1.35,
      rate_currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('cargo_data')
      .insert(sampleData)
      .select()
    
    if (error) {
      console.error('❌ Failed to insert sample data:', error.message)
      return
    }
    
    console.log(`✅ Added ${data.length} sample records`)
    console.log('📋 Sample records added:')
    data.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.assigned_customer} - ${record.total_kg}kg - ${record.orig_oe} → ${record.dest_oe}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error.message)
  }
}

// Run the test
testCargoData()
