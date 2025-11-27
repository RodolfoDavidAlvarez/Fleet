# Apply Migration via Supabase CLI

## ✅ Migration File Created

The migration file has been created at:
- `supabase/migrations/20251127165024_add_booking_link_sent_at.sql`

## 🚀 Apply Migration

### Step 1: Get Your Database Password

1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database
2. Scroll to "Database Password"
3. If you don't remember it, click "Reset database password"
4. Copy the password

### Step 2: Run the Migration

```bash
cd "/Users/rodolfoalvarez/Documents/Better Systems AI/Fleet Magement System APP"
supabase db push
```

When prompted, enter your database password.

### Step 3: Verify

After the migration completes, verify with:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'repair_requests' 
  AND column_name = 'booking_link_sent_at';
```

## 🔄 Alternative: Use SQL Editor (No Password Needed)

If you prefer not to use the CLI password:

1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new
2. Copy the SQL from: `supabase/migrations/20251127165024_add_booking_link_sent_at.sql`
3. Paste and click "Run"

## 📋 Migration Contents

The migration adds:
- ✅ `booking_link_sent_at` column to `repair_requests` table
- ✅ Index for efficient queries
- ✅ Documentation comment

