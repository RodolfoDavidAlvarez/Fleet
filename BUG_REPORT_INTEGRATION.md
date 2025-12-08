# Bug Report Integration - Complete Setup Guide

## ✅ Integration Status

The bug reporting system is **fully configured** and connects AgaveFleet.com with BetterSystems.ai.

## How It Works

```
AgaveFleet User Submits Bug
          ↓
   Bug saved to database
          ↓
   Email sent to developer
          ↓
 BetterSystems.ai Admin Panel
```

## 1. Bug Report Submission (AgaveFleet.com)

### Location
Users can report bugs from any page by clicking the "Report Bug" button in the header.

### What Happens
1. User fills out title, description, and optionally uploads a screenshot
2. Form data is sent to `/api/bug-reports` endpoint
3. Screenshot is optimized (resized, converted to WebP for smaller file size)
4. Bug report is saved to Supabase database
5. Email notification is sent to developer

### Database
- **Table**: `bug_reports` in Supabase (kxcixjiafdohbpwijfmd.supabase.co)
- **Columns**:
  - `id`, `user_id`, `user_name`, `user_email`
  - `title`, `description`, `screenshot_url`
  - `status`, `admin_notes`, `application_source`
  - `created_at`, `updated_at`, `resolved_at`

## 2. Email Notifications

### Current Configuration
- **From**: `AgaveFleet Bug Reports <onboarding@resend.dev>`
- **To**: `ralvarez@bettersystems.ai`
- **Reply-To**: User's email (so you can reply directly)
- **Subject**: 🐛 New Bug Report: [Title]

### Email Content
- Title, Description, Screenshot
- Reporter name and email
- Link to admin dashboard
- Timestamp and report ID

### ⚠️ Important: Domain Verification

**Current Status**: Using `onboarding@resend.dev` (test mode)
- Can only send to `ralvarez@bettersystems.ai`
- Limited to account owner email

**To Send to Any Email**:
1. Go to https://resend.com/domains
2. Add and verify `agavefleet.com` domain
3. Update line 417 in `app/api/bug-reports/route.ts`:
   ```typescript
   from: "AgaveFleet Bug Reports <notifications@agavefleet.com>",
   to: "developer@bettersystems.ai", // Can use any email now
   ```

## 3. Admin Dashboard (BetterSystems.ai)

### Location
https://bettersystems.ai/admin/tickets

### Features
- ✅ View all bug reports from all applications
- ✅ Filter by application (Fleet Management, CRM, etc.)
- ✅ Filter by status (Pending, In Progress, Resolved, Closed)
- ✅ Update ticket status
- ✅ Add admin notes
- ✅ View screenshots
- ✅ Email reporter directly

### Database Connection
The TicketsPage connects directly to the FleetManagement Supabase:
- **URL**: https://kxcixjiafdohbpwijfmd.supabase.co
- **Uses**: Supabase REST API with anon key
- **Real-time**: Auto-refreshes on page load

## 4. Testing

### Test Email Notification
```bash
cd /Users/rodolfoalvarez/Documents/Better\ Systems\ AI/Agavefleet.com
node scripts/test-bug-report-email.mjs
```

### Test Bug Report Submission
1. Go to http://localhost:3000/mechanic/schedule (or any page)
2. Click "Report Bug" button in header
3. Fill out form with test data
4. Submit
5. Check email at ralvarez@bettersystems.ai
6. Check admin panel at https://bettersystems.ai/admin/tickets

### Verify Database
```bash
node scripts/verify-bug-reports.mjs
```

## 5. Files Modified

### AgaveFleet.com
- `app/api/bug-reports/route.ts` - API endpoint for bug submissions
- `components/BugReportDialog.tsx` - Bug report form UI
- `supabase/migrations/20250104000000_create_bug_reports.sql` - Database schema
- `supabase/migrations/000_bug_reports_complete_setup.sql` - Complete setup

### BetterSystems.ai
- `client/src/pages/admin/TicketsPage.tsx` - Admin dashboard for managing tickets

## 6. Environment Variables

### Required
```env
RESEND_API_KEY=re_DQs789VC_FzMuq52t5CFK7e8tgtvnpLQ2
NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## 7. Next Steps

### Immediate
- [x] Bug reports save to database
- [x] Email notifications work
- [x] Admin panel displays tickets
- [x] Can update ticket status

### Recommended
- [ ] Verify `agavefleet.com` domain in Resend
- [ ] Update email "from" address to use custom domain
- [ ] Change email "to" address to desired recipient
- [ ] Add email notification preferences
- [ ] Set up automatic email reminders for old tickets

### Optional Enhancements
- [ ] Add webhooks for status changes
- [ ] Create Slack notifications
- [ ] Add priority levels
- [ ] Implement SLA tracking
- [ ] Add bulk operations (close multiple tickets)

## 8. Troubleshooting

### Email Not Received
1. Check spam folder
2. Verify RESEND_API_KEY is set
3. Run test script: `node scripts/test-bug-report-email.mjs`
4. Check Resend logs: https://resend.com/emails

### Tickets Not Showing in Admin Panel
1. Verify Supabase credentials in TicketsPage.tsx
2. Check browser console for errors
3. Verify RLS policies allow access
4. Check database directly: `node scripts/verify-bug-reports.mjs`

### Screenshot Upload Failed
1. Check file size (max 10MB)
2. Verify storage bucket exists: `bug-reports`
3. Check storage policies in Supabase
4. Look at API response for specific error

## 9. Support

### Resend Dashboard
https://resend.com/

### Supabase Dashboard
https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd

### Email Logs
https://resend.com/emails

---

**Last Updated**: December 7, 2025
**Status**: ✅ Fully Functional (Test Mode)
**Next Action**: Verify domain to enable production emails
