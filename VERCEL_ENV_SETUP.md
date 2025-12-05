# Vercel Environment Variables Setup

## Required Environment Variables for Production

When deploying to Vercel, make sure to set these environment variables in:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

### Production URL
```bash
NEXT_PUBLIC_APP_URL=https://fleet-management-system-c7t0cfntn.vercel.app
```

### Email Configuration
```bash
RESEND_API_KEY=re_DQs789VC_FzMuq52t5CFK7e8tgtvnpLQ2
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
```

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `fleet-management-system-c7t0cfntn`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://fleet-management-system-c7t0cfntn.vercel.app`
   - **Environment**: Select "Production", "Preview", and "Development" (or just Production)
5. Click **Save**
6. Redeploy your application for changes to take effect

## Important Notes

- `NEXT_PUBLIC_APP_URL` is used in all email links (invitations, confirmations, etc.)
- Make sure to set it to the production URL before deploying
- The app will use `http://localhost:3000` as fallback if not set
- After setting environment variables, trigger a new deployment


