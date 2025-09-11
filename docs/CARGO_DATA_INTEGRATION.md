# Cargo Data Integration with Review Invoices

This document describes the integration of the `cargo_data` database table with the Review Invoices component.

## Overview

The `cargo_data` table has been integrated into the invoice review system, allowing users to:
- View real cargo data from the database
- Generate invoices based on actual cargo records
- Switch between sample data and real data for testing
- See detailed invoice information with cargo-specific details

## Database Schema

The `cargo_data` table includes the following key fields:
- `id`: UUID primary key
- `rec_id`: Record identifier
- `orig_oe`, `dest_oe`: Origin and destination codes
- `total_kg`: Weight in kilograms
- `assigned_customer`: Customer assigned to the cargo
- `assigned_rate`: Rate applied to the cargo
- `rate_currency`: Currency for the rate
- `created_at`, `updated_at`: Timestamps
- `rate_id`: Foreign key to rates table

## API Endpoints

### GET /api/cargo-data
Fetches cargo data with pagination and filtering options:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (default: 'created_at')
- `sortOrder`: Sort direction (default: 'desc')
- `customer`: Filter by customer
- `dateFrom`, `dateTo`: Date range filters

### GET /api/cargo-data/invoices
Generates invoice summaries from cargo data:
- Groups cargo records by customer
- Calculates totals (amount, weight, items)
- Returns paginated invoice data
- Includes detailed item breakdowns

## Component Changes

### ReviewInvoices Component
- Added toggle between sample and real data
- Integrated with `useCargoInvoices` hook
- Updated pagination to work with both data sources
- Enhanced table display with currency information
- Added loading states and error handling

### New Hook: useCargoInvoices
- Fetches invoice data from the API
- Handles pagination, filtering, and loading states
- Provides refetch functionality
- Returns structured data for the component

## Type Definitions

### New Types Added
- `DatabaseCargoData`: Matches the database schema
- `CargoInvoice`: Invoice structure for cargo data
- `CargoInvoiceItem`: Individual cargo items in invoices

### Updated Types
- `Invoice`: Extended with currency and itemsDetails fields

## PDF Generation

The PDF generator has been updated to:
- Use real cargo data when available
- Display currency information
- Show detailed item breakdowns
- Fall back to sample data when needed

## Usage

1. **Switch to Real Data**: Click the "Real Data" button to load actual cargo records
2. **View Invoices**: Browse through generated invoices based on cargo data
3. **Generate PDFs**: Click on invoices to preview and generate PDFs
4. **Filter and Paginate**: Use the controls to navigate through large datasets

## Error Handling

- Network errors are displayed in a red banner
- Loading states prevent multiple requests
- Fallback to sample data if real data fails to load
- Graceful degradation for missing fields

## Future Enhancements

- Add more filtering options (date ranges, customer types)
- Implement invoice status management
- Add export functionality for bulk operations
- Integrate with customer management system
- Add real-time updates for new cargo data
