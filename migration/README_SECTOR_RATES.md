# Sector Rates Migration and API Setup

This document outlines the complete setup for the sector rates functionality, including database migration, API routes, and frontend components.

## Database Migration

### 1. Run the Migration

Execute the SQL migration file to create the `sector_rates` table:

```sql
-- Run this file in your Supabase SQL editor or database client
\i migration/create-sector-rates-table.sql
```

### 2. Table Structure

The `sector_rates` table includes:

- **Primary Key**: `id` (UUID)
- **Route Information**: `origin`, `destination` (airport codes)
- **Foreign Keys**: `origin_airport_id`, `destination_airport_id` (references `airport_codes`)
- **Rate Data**: `sector_rate` (decimal), `flight_num_preview` (string)
- **Status**: `is_active` (boolean)
- **Timestamps**: `created_at`, `updated_at`

### 3. Constraints and Indexes

- **Unique Constraint**: Prevents duplicate active routes
- **Check Constraints**: Ensures origin ≠ destination and matches airport codes
- **Indexes**: Optimized for common queries (origin, destination, status)
- **Triggers**: Auto-updates `updated_at` timestamp

## API Endpoints

### Base URL: `/api/sector-rates`

#### GET `/api/sector-rates`
- **Description**: Get all sector rates
- **Response**: Array of sector rate objects

#### POST `/api/sector-rates`
- **Description**: Create new sector rate
- **Body**: 
  ```json
  {
    "origin": "JFK",
    "destination": "LAX", 
    "origin_airport_id": "uuid",
    "destination_airport_id": "uuid",
    "sector_rate": 450.00,
    "flight_num_preview": "AA123",
    "is_active": true
  }
  ```

#### GET `/api/sector-rates/[id]`
- **Description**: Get sector rate by ID
- **Response**: Single sector rate object

#### PUT `/api/sector-rates/[id]`
- **Description**: Update sector rate
- **Body**: Same as POST (all fields optional)

#### DELETE `/api/sector-rates/[id]`
- **Description**: Delete sector rate
- **Response**: `{ "success": true }`

#### PATCH `/api/sector-rates/[id]/toggle`
- **Description**: Toggle active status
- **Body**: `{ "is_active": boolean }`

## Frontend Components

### 1. Main Component: `SectorRates.tsx`
- **Location**: `components/price-assignment-modules/SectorRates.tsx`
- **Features**: 
  - List view with search and filtering
  - Create/Edit/Delete operations
  - Toggle active status
  - Skeleton loading states

### 2. Modal Component: `SectorRateModal.tsx`
- **Location**: `components/price-assignment-modules/SectorRateModal.tsx`
- **Features**:
  - Airport code dropdowns for origin/destination
  - Form validation
  - Create/Edit modes

### 3. Table Component: `SectorRateTable.tsx`
- **Location**: `components/price-assignment-modules/SectorRateTable.tsx`
- **Features**:
  - Search and filter functionality
  - Action buttons (Edit, Delete, Toggle)
  - Responsive design

## Data Hooks

### `useSectorRateData()`
- **Location**: `components/price-assignment-modules/hooks.ts`
- **Features**:
  - CRUD operations with caching
  - Error handling
  - Loading states
  - Auto-refresh capabilities

## API Client

### `sectorRatesAPI`
- **Location**: `lib/api-client.ts`
- **Methods**:
  - `getAll()` - Get all sector rates
  - `getById(id)` - Get by ID
  - `create(data)` - Create new
  - `update(id, data)` - Update existing
  - `delete(id)` - Delete
  - `toggleActive(id, isActive)` - Toggle status

## Database Operations

### `sectorRateOperations`
- **Location**: `lib/supabase-operations.ts`
- **Methods**: Same as API client but for direct database access

## Type Definitions

### `SectorRate` Interface
```typescript
interface SectorRate {
  id: string
  origin: string
  destination: string
  origin_airport_id: string
  destination_airport_id: string
  sector_rate: number
  flight_num_preview: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}
```

## Usage Example

```typescript
import { useSectorRateData } from '@/components/price-assignment-modules/hooks'

function MyComponent() {
  const {
    sectorRates,
    loading,
    error,
    createSectorRate,
    updateSectorRate,
    deleteSectorRate,
    toggleSectorRate
  } = useSectorRateData()

  // Use the data and operations...
}
```

## Testing the Setup

1. **Run the migration** in your database
2. **Start the development server**
3. **Navigate to the sector rates page**
4. **Test CRUD operations**:
   - Create a new sector rate
   - Edit an existing one
   - Toggle active status
   - Delete a sector rate
   - Search and filter

## Notes

- The migration includes proper foreign key constraints
- All API routes include error handling
- Frontend components are fully responsive
- Type safety is maintained throughout
- Caching is implemented for performance
