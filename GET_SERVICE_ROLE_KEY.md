# How to Get Your Supabase Service Role Key

## ⚠️ Current Issue
Your `.env.local` file has a placeholder value: `YOUR_SERVICE_ROLE_KEY_HERE`
You need to replace this with your actual service role key from Supabase.

## 📋 Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to: **https://kxcixjiafdohbpwijfmd.supabase.co**
2. Log in if needed

### Step 2: Navigate to API Settings
1. Click on **"Settings"** (gear icon) in the left sidebar
2. Click on **"API"** in the settings menu

### Step 3: Find the Service Role Key
1. Scroll down to find the **"service_role"** key section
2. **IMPORTANT**: This is DIFFERENT from the "anon" key
3. The service_role key is much longer and starts with `eyJ...`
4. Click the **"Reveal"** or **"Show"** button next to it
5. Copy the ENTIRE key (it's a very long JWT token)

### Step 4: Update .env.local
1. Open `.env.local` in your project root
2. Find the line: `SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE`
3. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual key
4. Make sure there are NO spaces around the `=` sign
5. Make sure you copied the ENTIRE key (it should be very long, ~200+ characters)

### Step 5: Restart Your Server
After updating the key:
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Test the Connection
```bash
node test-db-connection.js
```

You should see:
- ✅ Service role client connected successfully
- ✅ All tables accessible

## 🔍 Common Mistakes

1. **Using the wrong key**: Make sure you're copying the **service_role** key, NOT the anon key
2. **Incomplete copy**: The key is very long - make sure you copied it entirely
3. **Extra spaces**: No spaces before or after the `=` sign
4. **Quotes**: Don't add quotes around the key value
5. **Line breaks**: Make sure the key is on a single line

## ✅ Correct Format Example

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzc1MCwiZXhwIjoyMDc5NzEzNzUwfQ.very_long_key_continues_here...
```

## 🆘 Still Having Issues?

If you're still getting "Invalid API key" errors:

1. **Double-check** you copied the service_role key (not anon)
2. **Verify** the key starts with `eyJ` (JWT tokens start this way)
3. **Check** for any hidden characters or line breaks
4. **Restart** your dev server after making changes
5. **Run** `node test-db-connection.js` to see detailed error messages



