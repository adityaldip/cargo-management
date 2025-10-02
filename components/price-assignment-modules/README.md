# Price Assignment Modules

This module provides a comprehensive price assignment system with four main components:

## Components

### 1. Flights
- Manages flight data with filtering and search capabilities
- Displays flight information including route, airline, aircraft, timing, and pricing
- Supports status filtering (scheduled, delayed, cancelled, completed)
- Includes airline filtering and search functionality

### 2. Airport Codes
- Manages airport code data with regional organization
- Displays airport information including code, name, city, country, and region
- Supports rate multiplier configuration for pricing calculations
- Includes active/inactive status management with toggle functionality

### 3. Sector Rates
- Manages sector-specific rate configurations
- Displays route-based pricing with currency support
- Supports effective and expiry date management
- Includes active/inactive status and notes functionality

### 4. Preview
- Provides a comprehensive preview of the price assignment process
- Shows processing status with progress indicators
- Displays summary statistics and results
- Includes configuration summary and assignment results

## Features

- **Modular Design**: Each component is self-contained and reusable
- **Tab Navigation**: Consistent tab-based navigation using Zustand store
- **Filtering & Search**: Advanced filtering capabilities across all components
- **Dummy Data**: Pre-populated with realistic sample data for testing
- **Responsive Design**: Mobile-friendly layouts with proper responsive breakpoints
- **Status Management**: Toggle functionality for active/inactive states
- **Progress Tracking**: Visual progress indicators for processing operations

## Usage

```tsx
import { PriceAssignment } from "@/components/price-assignment-modules"

// Use with dummy data
<PriceAssignment 
  data={null} 
  onSave={(data) => console.log('Save:', data)}
  onExecute={() => console.log('Execute')}
/>
```

## Store

The module uses `usePriceAssignmentTabStore` for tab navigation state management with persistence to localStorage.

## Types

All TypeScript types are defined in `types.ts` including:
- `Flight` - Flight data structure
- `AirportCode` - Airport code data structure  
- `SectorRate` - Sector rate data structure
- `PriceAssignmentData` - Combined data structure
- `PriceAssignmentProps` - Component props interface
