# User Onboarding & Approval System

## Overview
Your FleetPro application has a complete user onboarding and approval system already implemented. This document explains how it works.

## How It Works

### 1. Admin Invites New User

**Location**: Admin Settings → Users Tab

1. Admin clicks "Invite User" button
2. Enters email address and selects role (Admin, Mechanic, Driver, Customer)
3. System sends invitation email with registration link
4. Email includes:
   - Role they're being invited as
   - Registration link with pre-filled email and role
   - Note that account will be "Pending Approval" until admin activates it

### 2. User Registers

**Flow**:
1. User clicks registration link from email
2. Fills out registration form (name, email, password, phone)
3. Account is created with **`approval_status: 'pending_approval'`**
4. User can login but will have limited access based on role restrictions

### 3. Admin Approves User

**Location**: Admin Settings → Users Tab

1. Admin sees pending users at the top of the list (sorted by status)
2. Admin clicks "Edit" button on the user
3. Changes "Approval Status" from "Pending Approval" to "Approved"
4. Saves changes
5. **System automatically sends approval email** to user
6. User receives email notification that they're approved with login link

## Email Templates

### Invitation Email
- Subject: "Invitation to join FleetPro"
- Content:
  - Welcome message
  - Role they're invited as
  - Registration link
  - Note about pending approval status

### Approval Email
- Subject: "Account Approved - FleetPro"
- Content:
  - Congratulations message
  - Role confirmation
  - Login link

## Configuration Required

### Step 1: Get Resend API Key
1. Go to https://resend.com
2. Sign up for a free account
3. Create an API key
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Step 2: Verify Configuration
Your `.env.local` should have:
```bash
# Email Configuration
RESEND_API_KEY=your_actual_resend_api_key
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3003  # Change to production URL when deployed
```

## Testing the System

### Test Invitation Flow:
1. Login as admin
2. Go to Admin Settings → Users tab
3. Click "Invite User"
4. Enter a test email address
5. Select role (e.g., "Driver")
6. Click "Send Invitation"
7. Check the email inbox

### Test Approval Flow:
1. Register a new user (or use invited email)
2. Login as admin
3. Go to Admin Settings → Users tab
4. Find the pending user (highlighted with yellow badge)
5. Click "Edit" → Change status to "Approved" → Save
6. User receives approval email automatically

## API Endpoints

### POST `/api/admin/invite`
Send invitation email to new user
```json
{
  "email": "user@example.com",
  "role": "driver"
}
```

### PATCH `/api/admin/users`
Update user role or approval status
```json
{
  "userId": "uuid",
  "role": "driver",
  "approvalStatus": "approved"
}
```

### POST `/api/auth/register`
Register new user (sets `approval_status: 'pending_approval'` automatically)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "driver"
}
```

## Email Functions Available

Located in `lib/email.ts`:

1. `sendInvitationEmail(email, role)` - Send onboarding invitation
2. `sendAccountApprovedEmail(email, name, role)` - Send approval notification
3. `sendPasswordResetEmail(email, details)` - Password reset
4. `sendBookingConfirmationEmail(email, details)` - Booking confirmations
5. `sendRepairSubmissionEmail(email, details)` - Repair request confirmations
6. And more...

## User Roles & Permissions

### Pending Approval Restrictions
Users with `approval_status: 'pending_approval'` have limited access:
- Can login
- Can view basic dashboard
- **Cannot** access admin features
- **Cannot** perform sensitive actions

### After Approval
Users with `approval_status: 'approved'` get full access based on their role:
- **Admin**: Full access to all features
- **Mechanic**: Job management, repair requests, schedules
- **Driver**: Submit repair requests, view assigned vehicles
- **Customer**: Book services, view booking history

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set correctly
2. Check `ENABLE_EMAIL=true` in `.env.local`
3. Check Resend dashboard for sending limits (free tier: 100 emails/day)
4. Check browser console and server logs for errors

### User Not Seeing Approval
1. Verify email was sent (check Resend logs)
2. Check spam folder
3. Verify user status changed in database:
   ```sql
   SELECT email, approval_status FROM users WHERE email='user@example.com';
   ```

### Registration Link Not Working
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check link format: `/register?email=user@example.com&role=driver`

## Production Deployment

Before deploying to production:

1. **Update Environment Variables**:
   - Set `NEXT_PUBLIC_APP_URL` to your production URL
   - Add all env vars to Vercel/hosting platform

2. **Verify Email Domain**:
   - In Resend, verify your sending domain
   - Update `RESEND_FROM_EMAIL` to use verified domain

3. **Test End-to-End**:
   - Send test invitation
   - Complete registration
   - Approve user
   - Verify all emails received

## Summary

✅ **Already Implemented**:
- Admin invite system with UI
- Invitation email sending
- Automatic pending approval on registration
- Admin approval interface
- Automatic approval email notification
- Email templates for all scenarios

🔧 **You Need To Do**:
1. Get Resend API key from https://resend.com
2. Add it to `.env.local` as `RESEND_API_KEY`
3. Restart your dev server
4. Test the flow!
