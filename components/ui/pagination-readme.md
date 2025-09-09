# Pagination Component

A reusable pagination component for displaying paginated data with navigation controls.

## Usage

```tsx
import { Pagination } from "@/components/ui/pagination"

// Basic usage
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalRecords={totalRecords}
  recordsPerPage={recordsPerPage}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={handlePageChange}
  onRecordsPerPageChange={handleRecordsPerPageChange}
/>

// Customized usage
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalRecords={totalRecords}
  recordsPerPage={recordsPerPage}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={handlePageChange}
  onRecordsPerPageChange={handleRecordsPerPageChange}
  disabled={isLoading}
  showRecordsPerPage={false}
  showGoToPage={false}
  recordsLabel="items"
  recordsPerPageOptions={[10, 25, 50]}
/>
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | `number` | Current active page (1-based) |
| `totalPages` | `number` | Total number of pages |
| `totalRecords` | `number` | Total number of records |
| `recordsPerPage` | `number` | Number of records per page |
| `startIndex` | `number` | Start index for current page (0-based) |
| `endIndex` | `number` | End index for current page (0-based) |
| `onPageChange` | `(page: number) => void` | Callback when page changes |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRecordsPerPageChange` | `(recordsPerPage: number) => void` | - | Callback when records per page changes |
| `disabled` | `boolean` | `false` | Disable all pagination controls |
| `hasPrevPage` | `boolean` | `currentPage > 1` | Whether previous page exists |
| `hasNextPage` | `boolean` | `currentPage < totalPages` | Whether next page exists |
| `showRecordsPerPage` | `boolean` | `true` | Show records per page selector |
| `showGoToPage` | `boolean` | `true` | Show go to page input |
| `showPageNumbers` | `boolean` | `true` | Show numbered page buttons |
| `recordsPerPageOptions` | `number[]` | `[25, 50, 100, 200]` | Options for records per page |
| `className` | `string` | `""` | Additional CSS classes |
| `recordsLabel` | `string` | `"records"` | Label for records (e.g., "items", "users") |
| `showingLabel` | `string` | `"Showing"` | Label for showing text |
| `ofLabel` | `string` | `"of"` | Label for "of" text |
| `perPageLabel` | `string` | `"per page"` | Label for per page text |
| `goToPageLabel` | `string` | `"Go to page:"` | Label for go to page input |

## Examples

### Basic Database Table
```tsx
const [currentPage, setCurrentPage] = useState(1)
const [recordsPerPage, setRecordsPerPage] = useState(50)
const totalRecords = data.length
const totalPages = Math.ceil(totalRecords / recordsPerPage)
const startIndex = (currentPage - 1) * recordsPerPage
const endIndex = startIndex + recordsPerPage

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalRecords={totalRecords}
  recordsPerPage={recordsPerPage}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={setCurrentPage}
  onRecordsPerPageChange={setRecordsPerPage}
/>
```

### Simple List (No Records Per Page)
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalRecords={items.length}
  recordsPerPage={20}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={setCurrentPage}
  showRecordsPerPage={false}
  recordsLabel="items"
/>
```

### Loading State
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalRecords={totalRecords}
  recordsPerPage={recordsPerPage}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={handlePageChange}
  disabled={isLoading}
/>
```

## Features

- **Responsive Design**: Works on desktop and mobile
- **Customizable Labels**: Change text labels for internationalization
- **Flexible Controls**: Show/hide different pagination elements
- **Loading States**: Disable controls during data loading
- **Smart Page Numbers**: Shows up to 7 page numbers with smart ellipsis
- **Keyboard Accessible**: Proper ARIA labels and keyboard navigation
- **Type Safe**: Full TypeScript support

## Components Used Internally

- `Button` from `@/components/ui/button`
- Standard HTML `select` and `input` elements

## Styling

The component uses Tailwind CSS classes and follows the design system. It's fully styled and ready to use without additional CSS.
