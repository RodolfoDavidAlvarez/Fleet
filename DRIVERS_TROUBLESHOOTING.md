# Drivers Page Troubleshooting Guide

If you're seeing "No drivers found" but expect to see drivers, follow these steps:

## Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Refresh the drivers page
4. Look for log messages starting with "Driver query result" or "Error fetching drivers"
5. Check what the API is returning

## Step 2: Check API Response Directly
1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Refresh the drivers page
4. Click on the `/api/drivers` request
5. Check the Response tab to see what data is being returned

## Step 3: Check Supabase Database
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Open the `users` table
4. Check if there are any rows with `role = 'driver'`
5. Verify the data exists

## Step 4: Check Row Level Security (RLS) Policies
If drivers exist in the database but aren't showing up, RLS policies might be blocking access:

1. Go to Supabase Dashboard → Authentication → Policies
2. Check if RLS is enabled on the `users` table
3. If RLS is enabled but no policies exist, you need to create policies

### Quick Fix (Development Only):
Run this SQL in Supabase SQL Editor:
```sql
-- Disable RLS temporarily (development only!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Proper Fix (Production):
Run the SQL script in `supabase/fix_rls_policies.sql` to create proper policies.

## Step 5: Check Environment Variables
Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Important for API routes!
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set, the API will use the anon key, which might be blocked by RLS policies.

## Step 6: Test Creating a Driver
1. Click "Add Driver" on the drivers page
2. Fill in the form and submit
3. Check if the driver appears
4. Check browser console for any errors

## Common Issues:

### Issue: "No drivers found" but drivers exist in database
**Solution**: RLS policies are blocking access. See Step 4 above.

### Issue: API returns empty array `[]`
**Solution**: 
- Check if drivers exist with `role = 'driver'` (case-sensitive)
- Check RLS policies
- Verify service role key is set

### Issue: API returns error 500
**Solution**: 
- Check browser console for detailed error message
- Check Supabase logs in dashboard
- Verify database connection

### Issue: Drivers created but not showing
**Solution**: 
- Refresh the page
- Check if the create API call succeeded (check Network tab)
- Verify the driver was actually inserted into database





