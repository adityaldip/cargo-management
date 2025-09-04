# Assign Customers Components

This folder contains the modular components for the Assign Customers functionality, split from the original monolithic `assign-customers.tsx` file for better maintainability.

## Structure

```
components/assign-customers/
├── README.md                    # This file
├── index.ts                     # Exports all components and types
├── types.ts                     # Shared TypeScript types and interfaces
├── hooks.ts                     # Custom React hooks for data management
├── AssignCustomers.tsx          # Main wrapper component with tab navigation
├── CustomerManagement.tsx       # Customer management tab
├── RulesConfiguration.tsx       # Rules configuration tab
└── ExecuteRules.tsx            # Execute rules tab and results view
```

## Components

### AssignCustomers.tsx
- Main wrapper component that handles tab navigation
- Manages the overall state of which tab and view is active
- Renders the appropriate child component based on the current tab

### CustomerManagement.tsx
- Handles customer CRUD operations
- Customer listing with search functionality
- Toggle customer active status
- Delete customers with confirmation

### RulesConfiguration.tsx
- Manages automation rules for customer assignment
- Drag & drop rule priority reordering
- Rule editing with conditions and actions
- Toggle rule active status

### ExecuteRules.tsx
- Preview cargo data before processing
- Execute rules against cargo data
- Display results with assignment information
- Statistics summary

## Shared Files

### types.ts
- Database types from Supabase
- Extended interfaces for component compatibility
- Shared prop interfaces

### hooks.ts
- `useCustomerData()` - Manages customer data fetching and operations
- `useCustomerRules()` - Manages rule data fetching and operations
- Includes loading states, error handling, and CRUD operations

## Usage

The main component is still imported the same way:

```tsx
import { AssignCustomers } from '@/components/assign-customers'
```

Individual components can also be imported if needed:

```tsx
import { CustomerManagement, RulesConfiguration } from '@/components/assign-customers'
```

## Benefits of This Structure

1. **Maintainability**: Each tab is now a separate, focused component
2. **Reusability**: Components can be used independently if needed
3. **Testing**: Easier to write unit tests for individual components
4. **Code Organization**: Related functionality is grouped together
5. **Performance**: Potential for better code splitting and lazy loading
6. **Collaboration**: Multiple developers can work on different tabs simultaneously

## Database Integration

All components are integrated with Supabase and use the shared hooks for:
- Real-time data fetching
- CRUD operations
- Error handling
- Loading states

The hooks abstract the database operations, making the components cleaner and more focused on UI concerns.
