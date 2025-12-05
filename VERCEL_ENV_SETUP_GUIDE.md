# Vercel Environment Variables Setup Guide

This guide will help you configure all required environment variables in your Vercel deployment.

## 🔧 How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable below
4. **Important**: After adding variables, you need to **redeploy** for changes to take effect

## ✅ Required Environment Variables

### Supabase Configuration (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get SUPABASE_SERVICE_ROLE_KEY:**
- Go to https://kxcixjiafdohbpwijfmd.supabase.co
- Navigate to **Settings** → **API**
- Copy the **service_role** key (keep this secret!)

### Twilio Configuration (Optional - for SMS)
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE_NUMBER=+1234567890
ENABLE_SMS=false
```

**Important Notes:**
- Set `ENABLE_SMS=false` if you don't have Twilio credentials yet
- If `ENABLE_SMS=true` but credentials are missing/incorrect, you'll see authentication errors
- To get Twilio credentials, see [TWILIO_SETUP.md](./TWILIO_SETUP.md)

**To get Twilio credentials:**
1. Sign up at https://www.twilio.com
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Get a phone number from Phone Numbers section

### Resend Email Configuration (Required)
```
RESEND_API_KEY=re_gnAJmZCo_KVU3pd3a4WoG4LS2dQDWx21Y
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ADMIN_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
```

### JWT Secret (Required)
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### App Configuration (Required)
```
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

Replace `your-vercel-app` with your actual Vercel project name.

### Optional: Airtable (for data import)
```
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=appms3yBT9I2DEGl3
```

### Optional: AI Analysis (Claude API)
```
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🚨 Common Issues and Solutions

### Issue: "Twilio authentication failed"
**Solution:**
1. Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
2. Check that credentials don't have extra spaces
3. If you don't need SMS, set `ENABLE_SMS=false`
4. Ensure credentials are set for the correct environment (Production/Preview/Development)

### Issue: "notify_on_repair column missing"
**Solution:**
1. Run the migration: `supabase/migrations/20251210000000_add_notify_on_repair_column.sql`
2. Or apply via Supabase Dashboard → SQL Editor
3. The app will work without it (with fallback), but the column is recommended

### Issue: "SUPABASE_SERVICE_ROLE_KEY missing"
**Solution:**
1. Get the service role key from Supabase Dashboard
2. Add it to Vercel environment variables
3. Redeploy the application

## 📋 Verification Checklist

After setting up environment variables:

- [ ] All Supabase variables are set
- [ ] Twilio variables are set (or ENABLE_SMS=false)
- [ ] Resend email variables are set
- [ ] JWT_SECRET is set with a secure value
- [ ] App URLs are set correctly
- [ ] Variables are set for the correct environment (Production)
- [ ] Application has been redeployed after adding variables

## 🔄 After Adding Variables

**Important**: After adding or updating environment variables in Vercel:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

Environment variables are only applied on new deployments!

## 🧪 Testing

After deployment, test these endpoints:
- `/api/auth/me` - Should return user data
- `/api/admin/users` - Should return users list (no column errors)
- `/api/admin/send-announcement` - Should handle SMS gracefully if Twilio not configured

## 📞 Support

If you continue to see errors:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Ensure you've redeployed after adding variables
4. Check that variable names match exactly (case-sensitive)
