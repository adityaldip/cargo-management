# Update Excel Modules

This folder contains components for updating Excel files and managing column mappings in the cargo management system.

## Components

### UpdateExcel.tsx
A comprehensive component for uploading and processing updated Excel files. Based on the import-mail-agent.tsx component but adapted for update operations.

**Features:**
- File upload with drag & drop support
- Progress tracking during file processing
- Column mapping integration
- Ignore rules configuration
- Session persistence
- Database integration

**Props:**
- `onDataProcessed`: Callback when data is processed
- `onContinue`: Callback for continue action

### UpdateMapping.tsx
A component for managing column mappings for updated Excel files. Based on the column-mapping.tsx component but adapted for update operations.

**Features:**
- Interactive column mapping interface
- Conflict detection and resolution
- Progress tracking
- Mapping persistence
- Validation

**Props:**
- `excelColumns`: Array of Excel column names
- `sampleData`: Sample data for preview
- `onMappingComplete`: Callback when mapping is complete
- `onCancel`: Callback for cancel action
- `dataSource`: Data source identifier
- `totalRows`: Total number of rows being processed

## Usage

These components are integrated into the review-merged-excel.tsx component as new tabs:

1. **Update Excel Tab**: Allows users to upload and process updated Excel files
2. **Update Mapping Tab**: Allows users to modify existing column mappings

## Data Flow

1. User uploads Excel file in Update Excel tab
2. System processes file and extracts columns/sample data
3. User maps columns in Update Mapping tab
4. System processes mapped data and saves to database
5. User can configure ignore rules and view ignored data

## Integration

The components are integrated into the main review interface through the review-tab-store.tsx store, which manages the active tab state and persistence.
