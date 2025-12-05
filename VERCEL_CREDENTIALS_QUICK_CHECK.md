# Vercel Credentials Quick Check

## 🚀 Production Deployment Status

✅ **Code pushed to main branch** - This will trigger automatic production deployment in Vercel.

---

## ⚡ Quick Action: Verify Environment Variables

### Step 1: Open Vercel Dashboard
👉 **Go to:** https://vercel.com/dashboard
👉 **Select project:** `fleet-management-system-c7t0cfntn`
👉 **Navigate to:** Settings → Environment Variables

### Step 2: Verify These Critical Variables (PRODUCTION)

Copy and paste this checklist in Vercel:

#### ✅ Required Variables (Must Have)

```
[ ] NEXT_PUBLIC_SUPABASE_URL
    Value: https://kxcixjiafdohbpwijfmd.supabase.co
    Environment: Production ✅

[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
    Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs
    Environment: Production ✅

[ ] SUPABASE_SERVICE_ROLE_KEY
    ⚠️  ACTION REQUIRED: Get this from Supabase Dashboard
    How: Supabase → Settings → API → service_role key (secret)
    Environment: Production ✅

[ ] NEXT_PUBLIC_APP_URL
    Value: https://fleet-management-system-c7t0cfntn.vercel.app
    Environment: Production ✅

[ ] RESEND_API_KEY
    Value: re_DQs789VC_FzMuq52t5CFK7e8tgtvnpLQ2
    Environment: Production ✅

[ ] RESEND_FROM_EMAIL
    Value: ralvarez@bettersystems.ai
    Environment: Production ✅

[ ] ENABLE_EMAIL
    Value: true
    Environment: Production ✅

[ ] ADMIN_EMAIL
    Value: ralvarez@bettersystems.ai
    Environment: Production ✅
```

---

## 🔑 How to Get Missing Credentials

### SUPABASE_SERVICE_ROLE_KEY (Critical!)

1. Go to: https://kxcixjiafdohbpwijfmd.supabase.co
2. Click: **Settings** (gear icon) → **API**
3. Find: **service_role** key (under "Project API keys")
4. **⚠️ WARNING:** This is a secret key - keep it secure!
5. Copy the key
6. Paste it in Vercel as `SUPABASE_SERVICE_ROLE_KEY` for **Production**

---

## ✅ After Setting Variables

1. **Redeploy the application:**
   - Go to **Deployments** tab in Vercel
   - Find the latest deployment
   - Click **⋯** (three dots) → **Redeploy**
   - Select **Use existing Build Cache** (optional)
   - Click **Redeploy**

2. **Verify deployment:**
   - Wait for build to complete (usually 2-5 minutes)
   - Check deployment status shows "Ready" ✅
   - Visit: https://fleet-management-system-c7t0cfntn.vercel.app

3. **Test the application:**
   - Try logging in
   - Test core features
   - Check for any errors in Vercel function logs

---

## 🧪 Quick Test Endpoints

After deployment, test these to verify credentials:

### Test Database Connection
```
https://fleet-management-system-c7t0cfntn.vercel.app/api/auth/heartbeat
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### Test Application Load
```
https://fleet-management-system-c7t0cfntn.vercel.app
```
**Expected:** Login page or dashboard (if logged in)

---

## 📋 Full Checklist

See `VERCEL_PRODUCTION_DEPLOYMENT_CHECKLIST.md` for complete details.

---

## 🆘 Troubleshooting

### Issue: "Supabase environment variables are missing"
- ✅ Check `NEXT_PUBLIC_SUPABASE_URL` is set
- ✅ Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- ✅ Verify they're set for **Production** environment

### Issue: "SUPABASE_SERVICE_ROLE_KEY is missing"
- ✅ Get the key from Supabase Dashboard → Settings → API
- ✅ Add it to Vercel as `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Set for **Production** environment

### Issue: Emails not sending
- ✅ Verify `RESEND_API_KEY` is correct
- ✅ Check `ENABLE_EMAIL=true` is set
- ✅ Verify `RESEND_FROM_EMAIL` is a verified domain in Resend

### Issue: Build fails
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure all required environment variables are set
- ✅ Verify no syntax errors in code

---

## 📞 Support Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/dashboard/[your-team]/fleet-management-system-c7t0cfntn/settings
- **Environment Variables:** https://vercel.com/dashboard/[your-team]/fleet-management-system-c7t0cfntn/settings/environment-variables
- **Supabase Dashboard:** https://kxcixjiafdohbpwijfmd.supabase.co
- **Production URL:** https://fleet-management-system-c7t0cfntn.vercel.app
