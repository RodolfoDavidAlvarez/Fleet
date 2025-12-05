# Vercel Production Deployment Checklist

## 🎯 Production Deployment Steps

### Step 1: Merge to Main Branch (Required for Production)
To deploy to production, you need to merge your feature branch to `main`:

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/enhanced-announcements

# Push to main (this triggers production deployment)
git push origin main
```

**OR** if you want to deploy the feature branch directly to production:
- Go to Vercel Dashboard → Project Settings → Git
- Set Production Branch to `feature/enhanced-announcements` (temporary)

---

## 🔐 Required Environment Variables for Production

All these must be set in **Vercel Dashboard → Settings → Environment Variables** with **Production** environment selected.

### ✅ Critical (Required for App to Work)

#### 1. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
**⚠️ IMPORTANT:** Replace `your_service_role_key_here` with your actual service role key from Supabase Dashboard → Settings → API → service_role key

#### 2. Application URL
```bash
NEXT_PUBLIC_APP_URL=https://fleet-management-system-c7t0cfntn.vercel.app
```

#### 3. Email Configuration (Resend)
```bash
RESEND_API_KEY=re_DQs789VC_FzMuq52t5CFK7e8tgtvnpLQ2
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
ADMIN_EMAIL=ralvarez@bettersystems.ai
```

### ⚙️ Optional but Recommended

#### 4. SMS Configuration (Twilio) - Optional
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ADMIN_PHONE_NUMBER=+1234567890
ENABLE_SMS=false
```
**Note:** Set `ENABLE_SMS=false` if you don't want SMS functionality

#### 5. AI Analysis (Anthropic Claude) - Optional
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```
**Note:** Only needed if using AI-powered repair request analysis

#### 6. Airtable Integration - Optional
```bash
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=appms3yBT9I2DEGl3
```
**Note:** Only needed for Airtable data import functionality

#### 7. JWT Secret - Optional
```bash
JWT_SECRET=your_jwt_secret_key_here
```
**Note:** Generate a secure random string for production

---

## 📋 How to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `fleet-management-system-c7t0cfntn`

2. **Navigate to Environment Variables**
   - Go to **Settings** → **Environment Variables**

3. **Add Each Variable**
   - Click **Add New**
   - Enter the **Key** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the **Value** (your actual value)
   - **IMPORTANT:** Select **Production** environment (and optionally Preview/Development)
   - Click **Save**

4. **Verify All Variables**
   - Scroll through the list and ensure all required variables are present
   - Check that they're set for **Production** environment

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger automatic deployment

---

## ✅ Verification Checklist

Before considering deployment complete, verify:

- [ ] All required environment variables are set in Vercel (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (not placeholder)
- [ ] `NEXT_PUBLIC_APP_URL` matches your production URL
- [ ] `RESEND_API_KEY` is valid
- [ ] Code is merged to `main` branch (or production branch is configured)
- [ ] Latest deployment shows "Ready" status
- [ ] No build errors in deployment logs

---

## 🔍 How to Verify Credentials Are Working

### Test Supabase Connection
1. Visit: `https://fleet-management-system-c7t0cfntn.vercel.app/api/auth/heartbeat`
2. Should return: `{"status":"ok","timestamp":"..."}`

### Test Email Configuration
1. Try registering a new user or resetting password
2. Check if email is received

### Test Database Access
1. Try logging in with admin credentials
2. Check if data loads correctly

---

## 🚨 Common Issues

### Issue: "Supabase environment variables are missing"
**Solution:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Production environment

### Issue: "SUPABASE_SERVICE_ROLE_KEY is missing"
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables (Production)

### Issue: Emails not sending
**Solution:** 
- Verify `RESEND_API_KEY` is correct
- Check `ENABLE_EMAIL=true` is set
- Verify `RESEND_FROM_EMAIL` is a verified domain in Resend

### Issue: Deployment fails
**Solution:**
- Check build logs in Vercel dashboard
- Ensure all required environment variables are set
- Verify no syntax errors in code

---

## 📞 Quick Reference

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project URL:** https://fleet-management-system-c7t0cfntn.vercel.app
- **Supabase Dashboard:** https://kxcixjiafdohbpwijfmd.supabase.co
- **GitHub Repo:** https://github.com/RodolfoDavidAlvarez/Fleet

---

## 🎯 Next Steps After Deployment

1. **Test Production URL**
   - Visit: https://fleet-management-system-c7t0cfntn.vercel.app
   - Verify site loads correctly

2. **Test Authentication**
   - Try logging in
   - Test registration flow

3. **Test Core Features**
   - Create a booking
   - Send an announcement
   - Test notifications

4. **Monitor Logs**
   - Check Vercel function logs for errors
   - Monitor Supabase logs for database issues
