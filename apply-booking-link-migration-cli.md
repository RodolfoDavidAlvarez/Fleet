# Apply booking_link_sent_at Migration

## Quick Apply via Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new

2. **Copy and paste this SQL:**

```sql
-- Add booking_link_sent_at field to repair_requests table
-- This tracks when the booking link was sent to prevent duplicate sends

ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS booking_link_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_repair_requests_booking_link_sent_at 
ON repair_requests(booking_link_sent_at);

-- Add comment
COMMENT ON COLUMN repair_requests.booking_link_sent_at IS 'Timestamp when booking link was sent to driver';
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify the migration:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'repair_requests' 
     AND column_name = 'booking_link_sent_at';
   ```

## Alternative: Using Supabase CLI

If you have the project linked and database password:

```bash
# Link project (if not already linked)
supabase link --project-ref kxcixjiafdohbpwijfmd

# Apply migration
supabase db execute -f supabase/add_booking_link_sent_at.sql
```

## What This Migration Does

- ✅ Adds `booking_link_sent_at` column to `repair_requests` table
- ✅ Creates index for efficient queries
- ✅ Adds documentation comment
- ✅ Uses `IF NOT EXISTS` to prevent errors if column already exists

## Verification

After applying, you can verify with:

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'repair_requests' 
  AND column_name = 'booking_link_sent_at';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'repair_requests' 
  AND indexname = 'idx_repair_requests_booking_link_sent_at';
```

