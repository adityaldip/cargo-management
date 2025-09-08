# Assign Custom Modules

Folder ini berisi komponen-komponen untuk fitur "Assign Customers" yang telah dimodularisasi.

## Komponen

### ConfigureColumns
- **File**: `configure-columns.tsx`
- **Fungsi**: Mengatur konfigurasi kolom dengan drag & drop dan edit label
- **Fitur**:
  - Drag & drop untuk mengubah urutan kolom
  - Edit label kolom
  - Skeleton loading
  - Local storage persistence
  - Button untuk switch ke Database Preview

### DatabasePreview
- **File**: `database-preview.tsx`
- **Fungsi**: Menampilkan preview data dari database dengan pagination
- **Fitur**:
  - Server-side pagination
  - Filter data
  - Export data
  - Clear data
  - Statistics display
  - Responsive table

## Struktur

```
assign-custom-modules/
├── configure-columns.tsx    # Komponen konfigurasi kolom
├── database-preview.tsx     # Komponen preview database
├── index.ts                 # Export semua komponen
└── README.md               # Dokumentasi
```

## Penggunaan

```tsx
import { ConfigureColumns, DatabasePreview } from './assign-custom-modules'

// Configure Columns
<ConfigureColumns onSwitchToPreview={() => setActiveStep("preview")} />

// Database Preview
<DatabasePreview 
  columnConfigs={[]} 
  onClearData={handleClearData}
/>
```

## Dependencies

- React hooks (useState, useEffect)
- UI components dari `@/components/ui/`
- Icons dari `lucide-react`
- Supabase operations dari `@/lib/supabase-operations`
- Filter store dari `@/store/filter-store`
