# Troubleshooting Cargo Data Integration

This guide helps you diagnose and fix issues with the cargo data integration.

## Common Issues and Solutions

### 1. "Failed to fetch invoices" Error

This error typically occurs due to one of these issues:

#### A. Missing Environment Variables
**Symptoms:** Error when clicking "Real Data" button
**Solution:** 
1. Click the "Check Env" button in the interface
2. Ensure you have a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Restart your development server after adding environment variables

#### B. Database Table Not Created
**Symptoms:** Database test fails with table not found error
**Solution:**
1. Run the SQL migration from `migration/supabase-migration.sql` in your Supabase SQL Editor
2. Or run the cargo_data table creation SQL you provided

#### C. No Data in Table
**Symptoms:** Database test succeeds but no invoices are generated
**Solution:**
1. Click "Test DB" button to check if there's data
2. If no data, run the test script: `node scripts/test-cargo-data.js`
3. Or manually add sample data through Supabase dashboard

### 2. Environment Variables Setup

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and API keys

### 3. Database Schema Issues

If the `cargo_data` table doesn't exist, run this SQL in your Supabase SQL Editor:

```sql
create table public.cargo_data (
  id uuid not null default extensions.uuid_generate_v4 (),
  rec_id character varying(255) not null,
  inb_flight_date character varying(50) null,
  outb_flight_date character varying(50) null,
  des_no character varying(50) null,
  rec_numb character varying(50) null,
  orig_oe character varying(50) null,
  dest_oe character varying(50) null,
  inb_flight_no character varying(50) null,
  outb_flight_no character varying(50) null,
  mail_cat character varying(10) null,
  mail_class character varying(10) null,
  total_kg numeric(10, 2) null,
  invoice character varying(100) null,
  customer_name_number text null,
  assigned_customer character varying(255) null,
  assigned_rate numeric(10, 2) null,
  rate_currency character varying(3) null,
  processed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  assigned_at timestamp with time zone null,
  rate_id uuid null,
  rate_value numeric(10, 2) null,
  constraint cargo_data_pkey primary key (id),
  constraint cargo_data_rate_id_fkey foreign KEY (rate_id) references rates (id) on delete set null
) TABLESPACE pg_default;
```

### 4. Testing the Integration

Use these debugging tools in the interface:

1. **Check Env Button**: Verifies environment variables are set
2. **Test DB Button**: Tests database connection and shows sample data
3. **Browser Console**: Check for detailed error messages

### 5. Adding Sample Data

If you need sample data for testing:

1. **Via Script**: Run `node scripts/test-cargo-data.js`
2. **Via Supabase Dashboard**: 
   - Go to Table Editor → cargo_data
   - Click "Insert" → "Insert row"
   - Add sample records with required fields

**Required fields for invoice generation:**
- `assigned_customer` (not null)
- `assigned_rate` (not null)
- `total_kg` (not null)
- `orig_oe`, `dest_oe` (for route display)

### 6. API Endpoints

The integration creates these API endpoints:

- `GET /api/cargo-data` - Fetch cargo data with pagination
- `GET /api/cargo-data/invoices` - Generate invoice summaries
- `GET /api/cargo-data/test` - Test database connection
- `GET /api/cargo-data/env-check` - Check environment variables

### 7. Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Missing Supabase environment variables" | Environment variables not set | Add `.env.local` file |
| "Failed to fetch invoices: 500" | Database connection issue | Check Supabase credentials |
| "Failed to fetch invoices: 404" | API endpoint not found | Restart development server |
| "No invoices found" | No data in cargo_data table | Add sample data |

### 8. Development Server Issues

If you're still having issues:

1. **Restart the development server** after adding environment variables
2. **Clear browser cache** and hard refresh (Ctrl+F5)
3. **Check browser console** for detailed error messages
4. **Verify Supabase project is active** and not paused

### 9. Production Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
3. Test the API endpoints in production environment

### 10. Getting Help

If you're still stuck:

1. Check the browser console for detailed error messages
2. Use the "Test DB" and "Check Env" buttons to gather diagnostic info
3. Verify your Supabase project is properly configured
4. Ensure the `cargo_data` table exists and has the correct schema
