# Supabase Migration Guide for Airtable Import

## ✅ Project Status

- ✅ Supabase CLI installed (v2.24.3)
- ✅ Project linked: `kxcixjiafdohbpwijfmd`
- ✅ Config file created: `supabase/config.toml`

## 📋 Required Migrations

To complete the Airtable import setup, you need to apply these migrations in order:

### 1. Base Schema (Required)
**File:** `supabase/schema.sql`
- Creates all base tables (users, vehicles, bookings, mechanics, etc.)
- Sets up relationships and indexes
- **Status:** Must be applied first

### 2. Enhanced Data Migration (Required for Airtable)
**File:** `supabase/migration_enhanced_data_fixed.sql`
- Adds `departments` table
- Adds enhanced columns to `vehicles` table (vehicle_number, department, supervisor, etc.)
- Adds `airtable_id` columns to all tables for sync
- Creates department sync triggers
- **Status:** Required for Airtable import

### 3. RLS Policies (Recommended)
**File:** `supabase/fix_rls_policies.sql`
- Sets up Row Level Security policies
- Ensures proper access control
- **Status:** Recommended for production

### 4. Additional Migrations (Optional)
- `supabase/add_vehicle_photos.sql` - Vehicle photo support
- `supabase/add_repair_request_fields.sql` - Repair request enhancements
- `supabase/migration_admin_system.sql` - Admin system features

## 🚀 How to Apply Migrations

### Method 1: Supabase SQL Editor (Recommended - Easiest)

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Apply migrations in order:**
   - Copy the entire content of `supabase/schema.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for success message

   - Repeat for `supabase/migration_enhanced_data_fixed.sql`
   - Repeat for `supabase/fix_rls_policies.sql`

3. **Verify:**
   - Check that tables exist: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
   - Verify columns: `SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles';`

### Method 2: Supabase CLI (Requires Database Password)

```bash
# Make sure you're in the project directory
cd "/Users/rodolfoalvarez/Documents/Better Systems AI/Fleet Magement System APP"

# Option A: Push local migrations (if you have a migrations folder)
supabase db push

# Option B: Execute SQL files directly
# You'll need to create migration files first:
supabase migration new base_schema
# Then copy schema.sql content into the new migration file
# Then push:
supabase db push
```

**Note:** This method requires your database password. You can reset it from:
https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database

### Method 3: Using psql (Advanced)

If you have the PostgreSQL connection string:

```bash
# Get connection string from Supabase Dashboard → Settings → Database
# Use the "Connection string" → "URI" format (non-pooling, port 5432)

psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -f supabase/schema.sql

psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -f supabase/migration_enhanced_data_fixed.sql
```

## ✅ Verification Steps

After applying migrations, verify the schema:

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should include:
-- - users
-- - vehicles
-- - vehicle_drivers
-- - departments
-- - bookings
-- - mechanics
-- - service_records
-- - jobs
-- - parts
-- - repair_requests

-- Check enhanced vehicle columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name IN ('vehicle_number', 'department', 'supervisor', 'airtable_id', 'photo_urls');

-- Check departments table
SELECT * FROM departments LIMIT 5;
```

## 🎯 Quick Start Checklist

- [ ] Apply `supabase/schema.sql` via SQL Editor
- [ ] Apply `supabase/migration_enhanced_data_fixed.sql` via SQL Editor
- [ ] Apply `supabase/fix_rls_policies.sql` via SQL Editor
- [ ] Verify tables exist (run verification SQL above)
- [ ] Test Airtable import at `/admin/airtable-import`

## 🔧 Troubleshooting

### "relation already exists" errors
- Some tables may already exist. The migrations use `CREATE TABLE IF NOT EXISTS`, so this is usually safe to ignore.

### "column already exists" errors
- The enhanced migration checks for existing columns before adding them. If you see this, the column already exists - that's fine!

### "permission denied" errors
- Make sure you're using the SQL Editor (which uses your project's service role)
- Or ensure your database user has proper permissions

### Migration order matters
- Always apply `schema.sql` first
- Then `migration_enhanced_data_fixed.sql`
- Then other migrations as needed

## 📞 Next Steps

After migrations are applied:

1. **Test the schema:**
   ```bash
   node test-db-connection.js
   ```

2. **Run Airtable import:**
   - Go to: http://localhost:3000/admin/airtable-import
   - Or use the API: `POST /api/airtable/import-enhanced`

3. **Verify imported data:**
   - Check vehicles table
   - Check departments table
   - Check service_records table

## 🔗 Useful Links

- **SQL Editor:** https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new
- **Database Settings:** https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database
- **Table Editor:** https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/editor

---

**Status:** Ready to apply migrations!  
**Recommended Method:** Supabase SQL Editor (Method 1)



