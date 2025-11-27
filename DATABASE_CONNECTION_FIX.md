# Database Connection Fix Guide

## 🔴 Problem Identified

The application is failing to load data because **`SUPABASE_SERVICE_ROLE_KEY` is missing** from your environment variables.

## ✅ What Was Fixed

1. ✅ Added missing Supabase environment variables to `.env.local`
2. ✅ Improved error handling in API routes
3. ✅ Enhanced error messages in UI
4. ✅ Created database connection test script

## 🚨 Action Required

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase Dashboard: https://kxcixjiafdohbpwijfmd.supabase.co
2. Navigate to: **Settings** → **API**
3. Find the **"service_role"** key (NOT the anon key)
4. Copy the entire key (it's a long JWT token)

### Step 2: Add the Key to `.env.local`

Open `.env.local` and replace this line:
```
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

With your actual key:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_key_here
```

### Step 3: Restart Your Dev Server

After adding the key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the Connection

Run the test script to verify everything works:

```bash
node test-db-connection.js
```

You should see:
- ✅ Service role client connected successfully
- ✅ All tables accessible

## 🔍 Troubleshooting

### If you still see errors:

1. **Check the terminal/console** for detailed error messages
2. **Verify the key** - Make sure you copied the entire service_role key (it's very long)
3. **Check file location** - Ensure `.env.local` is in the project root directory
4. **Restart server** - Environment variables are only loaded on server start

### Common Errors:

#### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"
- **Solution**: Add the key to `.env.local` and restart the server

#### Error: "relation does not exist"
- **Solution**: Run the database migrations in Supabase SQL Editor:
  1. `supabase/schema.sql`
  2. `supabase/migration_admin_system.sql` (if needed)
  3. `supabase/fix_rls_policies.sql`

#### Error: "permission denied"
- **Solution**: Check RLS (Row Level Security) policies in Supabase
- Run `supabase/fix_rls_policies.sql` to fix policies

## 📋 Current Environment Variables Status

Your `.env.local` should now contain:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
ENABLE_SMS=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE  ← NEEDS TO BE FILLED IN
```

## 🧪 Testing

After fixing the environment variables:

1. **Test database connection:**
   ```bash
   node test-db-connection.js
   ```

2. **Test API endpoint:**
   ```bash
   curl http://localhost:3000/api/jobs
   ```

3. **Test UI:**
   - Navigate to `/mechanic/jobs` or `/admin/bookings`
   - Data should load without errors

## 📞 Need Help?

If you're still experiencing issues:

1. Check the browser console (F12) for client-side errors
2. Check the terminal where `npm run dev` is running for server-side errors
3. Run `node test-db-connection.js` to see detailed database connection info




