# Supabase Setup Guide for Cargo Management System

This guide will help you set up Supabase for your cargo management application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your cargo management application with the Supabase integration files

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `cargo-management`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this takes a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)
   - **service_role key** (starts with `eyJ`) - Keep this secret!

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Replace the placeholder values with your actual credentials from Step 2

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase-migration.sql` and paste it
4. Click "Run" to execute the migration
5. You should see a success message: "Cargo Management System database setup completed successfully!"

## Step 5: Verify the Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `customers`
   - `customer_rules`
   - `rate_rules`
   - `cargo_data`
   - `column_mappings`
   - `invoices`

3. Check that sample data was inserted:
   - Click on `customers` table - should show 5 sample customers
   - Click on `customer_rules` table - should show 5 sample rules
   - Click on `rate_rules` table - should show 3 sample rules

## Step 6: Test the Connection

1. Start your development server:
```bash
pnpm dev
```

2. Open your application in the browser
3. Check the browser console for any connection errors
4. If you see errors, verify your environment variables are correct

## Step 7: Using the Supabase Integration

### Option 1: Replace Existing Components

Replace your existing data management with Supabase hooks:

```typescript
// Instead of local state
const [customers, setCustomers] = useState([])

// Use Supabase hooks
import { useCustomers } from '@/hooks/use-supabase'
const { customers, loading, error, createCustomer, updateCustomer } = useCustomers()
```

### Option 2: Gradual Migration

Use the example component (`assign-customers-supabase-example.tsx`) as a reference to gradually migrate your components.

## Available Hooks

- `useCustomers()` - Customer management
- `useCustomerRules()` - Customer rule management  
- `useRateRules()` - Rate rule management
- `useCargoData(page, limit)` - Cargo data with pagination
- `useColumnMappings()` - Column mapping management
- `useInvoices()` - Invoice management

## Database Operations

All database operations are available through the operations modules:

```typescript
import { 
  customerOperations, 
  customerRulesOperations, 
  rateRulesOperations,
  cargoDataOperations,
  invoiceOperations 
} from '@/lib/supabase-operations'

// Example: Create a new customer
const result = await customerOperations.create({
  name: "New Customer",
  code: "NEW001",
  email: "contact@newcustomer.com",
  // ... other fields
})

if (result.error) {
  console.error('Failed to create customer:', result.error)
} else {
  console.log('Customer created:', result.data)
}
```

## Security Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Service Role Key**: Only use this server-side, never in client code
3. **Row Level Security**: The database has RLS enabled - adjust policies as needed
4. **Authentication**: Consider adding Supabase Auth for user management

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check your environment variables
   - Ensure the Supabase project is active
   - Verify the URL and keys are correct

2. **Database Errors**:
   - Check if the migration ran successfully
   - Verify table permissions in Supabase dashboard
   - Look at the Supabase logs for detailed error messages

3. **Type Errors**:
   - Make sure `@/types/database.ts` is properly imported
   - Check that your TypeScript configuration includes the types directory

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Discord](https://discord.supabase.com)
- Review error logs in your Supabase dashboard

## Next Steps

1. **Authentication**: Add user authentication with Supabase Auth
2. **Real-time**: Use Supabase real-time subscriptions for live updates
3. **Storage**: Add file upload capabilities with Supabase Storage
4. **Edge Functions**: Create serverside logic with Supabase Edge Functions

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Consider using connection pooling for high traffic
3. Set up monitoring and alerts
4. Configure backup strategies
5. Review and tighten RLS policies

Your cargo management system is now ready to use Supabase! 🚀
