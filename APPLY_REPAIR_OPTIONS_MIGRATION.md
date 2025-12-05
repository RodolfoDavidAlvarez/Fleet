# Apply Repair Request Options Migration

## ✅ Changes Made

1. **Form Updates:**

   - Changed "Vehicle Number" label to "Company Number" (both English and Spanish)
   - Updated Division dropdown options to: Construction, Salvage, Enhancements, Maintenance, Tree, Office/Sales, SSW, UFE, Misc. Use Vehicles/Fleet
   - Updated Type of vehicle dropdown options to: Vehicle, Heavy Equipment, Trailer, Not listed

2. **Migration File Created:**
   - `supabase/migrations/20251208000000_update_repair_request_options.sql`

## 🚀 Apply Migration via CLI

### Step 1: Link Your Project (If Not Already Linked)

```bash
cd "/Users/rodolfoalvarez/Documents/Better Systems AI/Fleet App Vercel v2"
supabase link --project-ref kxcixjiafdohbpwijfmd
```

When prompted:

- Enter your database password (you can reset it from: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database)

### Step 2: Push Migrations

```bash
supabase db push
```

This will apply all pending migrations, including the new one.

### Step 3: Verify

After the migration completes, verify with:

```sql
SELECT
    column_name,
    col_description((table_name::text || '.' || column_name::text)::regclass, ordinal_position) as comment
FROM information_schema.columns
WHERE table_name = 'repair_requests'
  AND column_name IN ('division', 'vehicle_type');
```

You should see the comments documenting the new valid values.

## 🔄 Alternative: Use SQL Editor (No Password Needed)

If you prefer not to use the CLI:

1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new
2. Copy and paste the SQL from: `supabase/migrations/20251208000000_update_repair_request_options.sql`
3. Click "Run" (or press Cmd/Ctrl + Enter)

### Migration SQL:

```sql
-- Update repair_requests table division and vehicle_type options
-- This migration documents the new valid values for division and vehicle_type fields
-- No schema changes needed as these are TEXT fields, but we add comments for documentation

COMMENT ON COLUMN repair_requests.division IS 'Division: Construction, Salvage, Enhancements, Maintenance, Tree, Office/Sales, SSW, UFE, Misc. Use Vehicles/Fleet';
COMMENT ON COLUMN repair_requests.vehicle_type IS 'Type of vehicle: Vehicle, Heavy Equipment, Trailer, Not listed';

-- Note: Since these are TEXT fields without constraints, existing data will not be automatically updated
-- Application layer enforces the new options in the form dropdown
```

## 📋 What This Migration Does

- Adds documentation comments to the `division` and `vehicle_type` columns
- Documents the new valid values for reference
- No schema constraints are added, so existing data remains valid
- The application form now enforces these new options in the dropdowns

## ✅ Verification

After applying, check that:

1. The repair form shows "Company Number" instead of "Vehicle Number"
2. The Division dropdown shows all 9 new options
3. The Type of vehicle dropdown shows the 4 new options
