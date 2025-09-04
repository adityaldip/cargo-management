# Assign Rates Modules

This folder contains the modular components for the Assign Rates functionality, split from the original monolithic `assign-rates.tsx` file for better maintainability.

## Structure

```
assign-rates-modules/
├── AssignRates.tsx       # Main component with tab navigation
├── SetupRates.tsx        # Rate configuration setup tab
├── ConfigureRates.tsx    # Rate rules configuration tab
├── ExecuteRates.tsx      # Rate execution and results tab
├── types.ts              # TypeScript interfaces and types
├── sample-data.ts        # Sample rate rules and configurations
├── index.ts              # Export barrel file
└── README.md            # This file
```

## Components

### AssignRates
Main container component that handles tab navigation and renders the appropriate sub-component based on the active tab.

### SetupRates
- Configure rate field visibility and order
- Drag and drop reordering
- Field label customization

### ConfigureRates
- Manage rate assignment rules
- Drag and drop rule prioritization
- Inline rule editing with Notion-style filters
- Rule activation/deactivation

### ExecuteRates
- Display rate assignment results
- Pagination controls
- CSV export functionality
- Revenue calculations

## Types

All TypeScript interfaces are defined in `types.ts`:
- `RateRule` - Rate assignment rule structure
- `RateConfig` - Rate field configuration
- `AssignRatesProps` - Main component props
- `ViewType` - Tab navigation type

## Sample Data

`sample-data.ts` contains:
- Sample rate rules with various conditions and actions
- Default rate configuration settings
- Mock data for testing and development

## Usage

The main component is imported the same way:

```tsx
import { AssignRates } from '@/components/assign-rates-modules'
```

Individual components can also be imported if needed:

```tsx
import { SetupRates, ConfigureRates, ExecuteRates } from '@/components/assign-rates-modules'
```

## Benefits of This Structure

1. **Maintainability**: Each tab is now a separate, focused component
2. **Reusability**: Components can be used independently if needed
3. **Testing**: Easier to write unit tests for individual components
4. **Code Organization**: Related functionality is grouped together
5. **Performance**: Potential for better code splitting and lazy loading
6. **Collaboration**: Multiple developers can work on different tabs simultaneously

## Features

- Rate field configuration and ordering
- Complex rule-based rate assignment
- Drag and drop functionality for rules and configurations
- Inline editing with visual feedback
- Export capabilities
- Pagination for large datasets
- Revenue calculations and statistics
