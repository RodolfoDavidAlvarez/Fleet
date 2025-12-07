# Bug Reports Database Setup Guide

## 🚨 Issue

The `bug_reports` table is missing from your database, causing 500 errors when submitting bug reports.

## ✅ Quick Fix (Recommended)

### Method 1: Supabase SQL Editor (Easiest)

1. **Open Supabase SQL Editor:**

   - Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new

2. **Run the Complete Migration:**

   - Open the file: `supabase/migrations/000_bug_reports_complete_setup.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **"Run"** (or press `Cmd/Ctrl + Enter`)
   - Wait for the success message

3. **Verify:**

   ```sql
   -- Check if table exists
   SELECT table_name FROM information_schema.tables WHERE table_name = 'bug_reports';

   -- Check if bucket exists
   SELECT id, name FROM storage.buckets WHERE id = 'bug-reports';
   ```

### Method 2: Run Individual Migrations

If you prefer to run migrations separately:

1. Run `supabase/migrations/20250104000000_create_bug_reports.sql`
2. Run `supabase/migrations/20250105000000_add_application_source_to_bug_reports.sql`
3. Run `supabase/migrations/20250106000000_create_bug_reports_storage_bucket.sql`

### Method 3: Using Scripts

```bash
# Option A: Show SQL to copy/paste
node scripts/apply-bug-reports-migration-sql.js

# Option B: Attempt automated migration (may require manual steps)
node scripts/apply-bug-reports-migration.js
```

## 📋 What Gets Created

### Database Table: `bug_reports`

- Stores bug report data (title, description, screenshot URL, status)
- Includes user information and timestamps
- Has proper indexes for performance
- Includes Row Level Security (RLS) policies

### Storage Bucket: `bug-reports`

- Stores uploaded screenshots
- Public read access for displaying images
- Authenticated users can upload
- Admins can delete

## ✅ Verification

After running the migration, test the bug report feature:

1. Go to any page in your app
2. Click the bug report button (🐛 icon in header)
3. Fill out the form and submit
4. Check that it saves successfully (no 500 error)

## 🔧 Troubleshooting

### Error: "relation does not exist"

- The migration didn't run successfully
- Check the SQL Editor for error messages
- Ensure you're running the complete migration file

### Error: "permission denied"

- Make sure you're using the Supabase SQL Editor (has full permissions)
- Or ensure your service role key has proper permissions

### Storage bucket errors

- Verify the bucket was created: `SELECT id FROM storage.buckets WHERE id = 'bug-reports';`
- Check storage policies are in place

## 📞 Need Help?

If migrations fail:

1. Check the error message in Supabase SQL Editor
2. Verify your database connection
3. Ensure you have admin access to the Supabase project
