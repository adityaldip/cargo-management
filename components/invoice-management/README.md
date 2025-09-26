# Invoice Management Components

This directory contains modular components for invoice management functionality, extracted from the main `review-invoices.tsx` component.

## Components

### InvoiceTable
- **File**: `InvoiceTable.tsx`
- **Purpose**: Displays a table of invoices with selection capabilities
- **Props**:
  - `invoices`: Array of invoice objects
  - `selectedInvoices`: Array of selected invoice IDs
  - `selectedInvoice`: Currently selected invoice object
  - `loading`: Loading state
  - `onSelectInvoice`: Handler for individual invoice selection
  - `onSelectAll`: Handler for selecting all invoices
  - `onInvoiceClick`: Handler for invoice row clicks

### PaginationControls
- **File**: `PaginationControls.tsx`
- **Purpose**: Provides pagination controls for the invoice table
- **Props**:
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `itemsPerPage`: Number of items per page
  - `total`: Total number of items
  - `startIndex`: Starting index of current page
  - `loading`: Loading state
  - `onPageChange`: Handler for page changes
  - `onItemsPerPageChange`: Handler for items per page changes

### LoadingSkeleton
- **File**: `LoadingSkeleton.tsx`
- **Purpose**: Displays loading skeleton while data is being fetched
- **Props**:
  - `showPdfPreview`: Whether to show PDF preview skeleton (optional)

### ErrorBanner
- **File**: `ErrorBanner.tsx`
- **Purpose**: Displays error messages
- **Props**:
  - `error`: Error message string (null if no error)
  - `className`: Additional CSS classes (optional)

## Usage

```tsx
import { 
  InvoiceTable, 
  PaginationControls, 
  LoadingSkeleton, 
  ErrorBanner 
} from "@/components/invoice-management"

// Use in your component
<ErrorBanner error={error} />
{loading ? (
  <LoadingSkeleton showPdfPreview={true} />
) : (
  <InvoiceTable
    invoices={invoices}
    selectedInvoices={selectedInvoices}
    selectedInvoice={selectedInvoice}
    loading={loading}
    onSelectInvoice={handleSelectInvoice}
    onSelectAll={handleSelectAll}
    onInvoiceClick={handleInvoiceClick}
  />
)}
```

## Benefits of Modular Structure

1. **Reusability**: Components can be reused across different parts of the application
2. **Maintainability**: Easier to maintain and update individual components
3. **Testability**: Each component can be tested in isolation
4. **Separation of Concerns**: Each component has a single responsibility
5. **Code Organization**: Better code organization and structure
