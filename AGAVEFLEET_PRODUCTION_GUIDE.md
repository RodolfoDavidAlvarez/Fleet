# AgaveFleet Production Deployment Guide

## 🌐 Official Production Domain

**Domain:** `https://agavefleet.com`

This is the official production domain for the AgaveFleet Management System.

---

## 📋 Table of Contents

1. [Domain Configuration](#domain-configuration)
2. [Environment Variables](#environment-variables)
3. [Email Notifications](#email-notifications)
4. [SMS Notifications](#sms-notifications)
5. [Vercel Deployment](#vercel-deployment)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## 🌍 Domain Configuration

### Current Setup

- **Primary Domain:** `agavefleet.com`
- **Vercel Domain:** `fleet-management-system-red.vercel.app`
- **Status:** Vercel domain should redirect to agavefleet.com

### Vercel Domain Setup

1. **Add Custom Domain in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Navigate to **Settings** → **Domains**
   - Add domain: `agavefleet.com`
   - Follow DNS configuration instructions

2. **DNS Configuration**
   - Add A record: `76.76.21.21` (Vercel IP)
   - Add CNAME for www: `cname.vercel-dns.com`
   - Wait for DNS propagation (up to 48 hours, usually faster)

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Verify HTTPS is working after DNS propagation

---

## ⚙️ Environment Variables

### Required Variables for Production

Set these in **Vercel Dashboard → Settings → Environment Variables** (Production environment):

#### 1. Application URLs

```env
NEXTAUTH_URL=https://agavefleet.com
NEXT_PUBLIC_APP_URL=https://agavefleet.com
```

**Usage:**
- Used in all email links (registration, password reset, booking confirmations)
- Used in SMS messages with booking links
- Used for authentication redirects
- Used throughout the application for absolute URLs

#### 2. Supabase Database

```env
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get credentials from:**
- Supabase Dashboard → Settings → API

#### 3. Email Configuration (Resend)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
ADMIN_EMAIL=ralvarez@bettersystems.ai
```

**Get API key from:**
- [Resend Dashboard](https://resend.com/emails)
- Create API key with send permissions

#### 4. SMS Configuration (Twilio) - Optional

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+16028061439
ENABLE_SMS=true
```

**Get credentials from:**
- [Twilio Console](https://console.twilio.com/)

**Note:** Set `ENABLE_SMS=false` if not using SMS features

#### 5. Security & Authentication

```env
JWT_SECRET=your_secure_random_string
CRON_SECRET=your_cron_secret_key
```

**Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate CRON secret
openssl rand -base64 32
```

#### 6. AI Features (Optional)

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Get API key from:**
- [Anthropic Console](https://console.anthropic.com/)

---

## 📧 Email Notifications

All email notifications automatically use the production domain from `NEXT_PUBLIC_APP_URL`.

### Email Types Sent

1. **User Invitations**
   - Registration links: `https://agavefleet.com/register?email=...`
   - Includes role information

2. **Password Reset**
   - Reset links: `https://agavefleet.com/reset-password?token=...`
   - 1-hour expiration

3. **Booking Confirmations**
   - Sent when booking is created
   - Includes booking details and ID

4. **Booking Reminders**
   - Sent 24 hours before appointment (via cron)
   - Includes date, time, and service type

5. **Repair Request Notifications**
   - Sent to driver when request submitted
   - Sent to admins for new repair requests
   - Includes booking link: `https://agavefleet.com/booking/schedule/[requestId]`

6. **Status Updates**
   - Sent when booking/repair status changes
   - Includes current status and next steps

### Email Templates

All email templates are branded as "FleetPro Management System" and include:
- Professional HTML formatting
- Responsive design
- Clear call-to-action buttons
- Footer with domain information

**Template files:**
- `lib/email.ts` - All email template functions

---

## 📱 SMS Notifications

SMS messages include links using the production domain.

### SMS Types Sent

1. **Booking Confirmations**
   - Sent when booking is confirmed
   - Includes service type, date, time

2. **Booking Reminders**
   - Sent 24 hours before appointment
   - Brief message with appointment details

3. **Repair Request Confirmations**
   - Bilingual support (English/Spanish)
   - Confirmation of submission

4. **Repair Booking Links**
   - Includes link: `https://agavefleet.com/booking/schedule/[requestId]`
   - Bilingual support

5. **Admin Notifications**
   - New repair request alerts
   - Includes driver info and urgency level

### SMS Configuration

**Important Notes:**
- SMS requires active Twilio account
- Set `ENABLE_SMS=true` to enable
- Set `ENABLE_SMS=false` if not using SMS
- All SMS messages respect user consent preferences

**Template files:**
- `lib/twilio.ts` - All SMS template functions

---

## 🚀 Vercel Deployment

### Production Deployment Checklist

- [ ] Custom domain `agavefleet.com` added in Vercel
- [ ] DNS records configured correctly
- [ ] SSL certificate active (HTTPS working)
- [ ] All environment variables set for Production
- [ ] `NEXTAUTH_URL=https://agavefleet.com`
- [ ] `NEXT_PUBLIC_APP_URL=https://agavefleet.com`
- [ ] Email credentials configured (Resend)
- [ ] SMS credentials configured (Twilio) or `ENABLE_SMS=false`
- [ ] Database credentials configured (Supabase)
- [ ] Cron jobs configured (if using automated reminders)
- [ ] Latest code deployed from `main` branch

### Deploy Process

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-feature
   git push origin main
   ```

2. **Automatic Deployment**
   - Vercel automatically deploys when main branch is updated
   - Monitor deployment in Vercel Dashboard

3. **Manual Deployment**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - Or use Vercel CLI: `vercel --prod`

### Cron Jobs Configuration

Add to `vercel.json` for automated reminders:

```json
{
  "crons": [
    {
      "path": "/api/bookings/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Note:** Vercel Cron requires Pro plan or higher

---

## ✅ Testing & Verification

### 1. Domain & SSL

Test that the domain is working correctly:

```bash
# Check DNS resolution
dig agavefleet.com

# Check HTTPS
curl -I https://agavefleet.com

# Expected: HTTP/2 200 with valid SSL
```

### 2. API Endpoints

Test critical endpoints:

```bash
# Health check
curl https://agavefleet.com/api/auth/heartbeat

# Expected: {"status":"ok","timestamp":"..."}
```

### 3. Authentication

- Visit: `https://agavefleet.com/login`
- Try logging in with admin credentials
- Verify redirect URLs use `agavefleet.com`

### 4. Email Notifications

Test email functionality:

1. **Password Reset**
   - Go to: `https://agavefleet.com/forgot-password`
   - Enter email address
   - Check email for reset link
   - Verify link points to: `https://agavefleet.com/reset-password?token=...`

2. **User Invitation**
   - Create invite from admin panel
   - Check email for registration link
   - Verify link points to: `https://agavefleet.com/register?email=...`

### 5. SMS Notifications

Test SMS functionality (if enabled):

1. **Repair Request**
   - Submit repair request with phone number
   - Verify SMS received
   - Check booking link in SMS points to `agavefleet.com`

### 6. Booking Links

Test booking flow:

1. Create repair request
2. Schedule booking from admin
3. Verify email/SMS contains correct link
4. Click link and verify it opens correct page

---

## 🔧 Troubleshooting

### Issue: Domain not resolving

**Solution:**
- Check DNS configuration in domain registrar
- Verify A record points to Vercel IP: `76.76.21.21`
- Wait for DNS propagation (up to 48 hours)
- Use `dig agavefleet.com` to check DNS

### Issue: Email links use wrong domain

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL=https://agavefleet.com` in Vercel
- Ensure environment variable is set for **Production** environment
- Redeploy application after changing environment variables
- Check deployment logs for correct URL

### Issue: SMS links use wrong domain

**Solution:**
- Same as email links issue
- SMS uses `NEXT_PUBLIC_APP_URL` for booking links
- Verify environment variable is set correctly

### Issue: HTTPS not working

**Solution:**
- Vercel automatically provisions SSL certificates
- Wait a few minutes after adding domain
- Check Vercel Dashboard → Domains for SSL status
- Ensure DNS is configured correctly

### Issue: Authentication redirect errors

**Solution:**
- Verify `NEXTAUTH_URL=https://agavefleet.com`
- Ensure no trailing slashes in URL
- Check that URL matches exactly (no http vs https mismatch)
- Redeploy after changing environment variables

### Issue: API endpoints returning 404

**Solution:**
- Verify deployment was successful
- Check Vercel function logs for errors
- Ensure all dependencies are installed
- Check that API routes are in correct directory structure

---

## 📞 Quick Reference

### Important URLs

- **Production Site:** https://agavefleet.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://kxcixjiafdohbpwijfmd.supabase.co
- **Resend Dashboard:** https://resend.com/emails
- **Twilio Console:** https://console.twilio.com/

### Environment Variables Summary

```env
# Domain & URLs
NEXTAUTH_URL=https://agavefleet.com
NEXT_PUBLIC_APP_URL=https://agavefleet.com

# Database
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
ADMIN_EMAIL=ralvarez@bettersystems.ai

# SMS (Optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+16028061439
ENABLE_SMS=true

# Security
JWT_SECRET=...
CRON_SECRET=...

# AI (Optional)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Key Files

- **Email templates:** `lib/email.ts`
- **SMS templates:** `lib/twilio.ts`
- **Environment docs:**
  - `PRODUCTION_URL.md`
  - `VERCEL_ENV_SETUP.md`
  - `VERCEL_ENV_SETUP_GUIDE.md`
  - `VERCEL_PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Post-Deployment Checklist

After deploying to production:

- [ ] Visit https://agavefleet.com and verify site loads
- [ ] Test login functionality
- [ ] Test registration with email invitation
- [ ] Test password reset flow
- [ ] Submit test repair request
- [ ] Verify email notifications received with correct links
- [ ] Verify SMS notifications received with correct links (if enabled)
- [ ] Test booking flow end-to-end
- [ ] Check all links in emails/SMS point to agavefleet.com
- [ ] Monitor Vercel function logs for errors
- [ ] Test admin panel functionality
- [ ] Verify database operations working correctly
- [ ] Set up monitoring/alerts for critical errors

---

## 🔐 Security Notes

1. **Environment Variables**
   - Never commit `.env` files to git
   - Keep service role keys secure
   - Rotate secrets periodically

2. **Domain Security**
   - HTTPS enforced automatically by Vercel
   - SSL certificates auto-renewed
   - HSTS enabled by default

3. **API Security**
   - Cron endpoints protected with `CRON_SECRET`
   - Database queries use parameterized statements
   - User authentication required for sensitive endpoints

---

## 📝 Maintenance

### Regular Tasks

1. **Monitor Error Logs**
   - Check Vercel function logs daily
   - Monitor Supabase logs for database issues
   - Review failed email/SMS logs

2. **Update Dependencies**
   - Keep packages up to date
   - Test thoroughly before deploying updates
   - Review security advisories

3. **Backup Data**
   - Supabase provides automatic backups
   - Test restoration process periodically
   - Keep local backups of critical data

4. **Performance Monitoring**
   - Monitor API response times
   - Check database query performance
   - Review Vercel analytics

---

## 🆘 Support & Resources

### Documentation

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **Twilio Docs:** https://www.twilio.com/docs

### Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Vercel deployment logs
3. Check Supabase database logs
4. Review application logs
5. Test in development environment first

---

**Last Updated:** December 2024
**Domain:** agavefleet.com
**Status:** Production Ready ✅
