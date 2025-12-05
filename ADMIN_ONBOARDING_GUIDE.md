# Admin Onboarding & Account Management Guide

## 📋 Test Credentials

Based on your `SETUP.md` file, here are the demo/test credentials:

### Admin Account
- **Email**: `admin@fleetpro.com`
- **Password**: `admin123`

### Mechanic Account  
- **Email**: `mechanic@fleetpro.com`
- **Password**: `mechanic123`

> **Note**: These credentials work with the legacy login system that accepts default passwords if no password hash exists in the database. The system is now using Supabase Auth, so these accounts may need to be recreated or have passwords reset.

---

## 🔄 Account Creation & Approval Workflow

### Option 1: Self-Registration (Requires Admin Approval)

1. **User registers** at `/register`
   - Creates account with Supabase Auth
   - Default role: `driver`
   - Default approval status: `pending_approval`

2. **User cannot login** until approved (they'll see: "Your account is pending approval. Please contact an administrator.")

3. **Admin approves account**:
   - Login as admin
   - Go to `/admin/settings`
   - Click "Users" tab
   - Find pending user
   - Change role to `admin` if needed
   - Approve the account
   - System sends approval email automatically

### Option 2: Admin Invites User (Auto-Approved)

This is the **recommended workflow** for onboarding admins:

1. **Admin invites user**:
   - Login as admin
   - Go to `/admin/settings`
   - Click "Users" tab
   - Click "Invite User" button
   - Enter email and select role (`admin`, `mechanic`, `driver`, or `customer`)
   - System sends invitation email

2. **User receives email**:
   - Email contains registration link with pre-filled email
   - User clicks link → goes to `/register?email=invited@example.com`
   - User completes registration

3. **User is automatically approved**:
   - Invited users have `approval_status: 'approved'`
   - Can login immediately after registration
   - Role is set to what admin specified

---

## ✅ Verifying the Workflow is Set Up Properly

### Step 1: Test Login with Admin Credentials

1. Go to `/login`
2. Try logging in with:
   - Email: `admin@fleetpro.com`
   - Password: `admin123`

**If login fails:**
- The account might not exist in Supabase Auth yet
- You may need to create it manually or use the registration flow

### Step 2: Create a Test Admin Account

**Option A: Create via Registration (then promote)**
1. Go to `/register`
2. Register with your email
3. Login as existing admin (`admin@fleetpro.com`)
4. Go to `/admin/settings` → Users tab
5. Find your new account
6. Change role to `admin`
7. Approve the account

**Option B: Use Admin Invite (Recommended)**
1. Login as admin
2. Go to `/admin/settings` → Users tab
3. Click "Invite User"
4. Enter your email and select role: `admin`
5. Check your email for invitation
6. Complete registration
7. You'll be auto-approved and can login immediately

### Step 3: Verify Admin Settings Page Access

1. Login as admin
2. Navigate to `/admin/settings`
3. You should see three tabs:
   - **Users**: Manage user accounts, roles, and approvals
   - **Notification Recipients**: Manage notification settings
   - **Calendar Settings**: Configure booking calendar

### Step 4: Test User Management Features

In `/admin/settings` → Users tab, verify you can:

- ✅ **View all users** (admins and mechanics listed)
- ✅ **Invite new users** (button in top right)
- ✅ **Edit user roles** (click edit icon)
- ✅ **Approve/reject users** (change approval status)
- ✅ **Send password reset** (password icon button)
- ✅ **See online status** (green dot if user active in last 5 minutes)

---

## 🎯 Recommended Workflow for Onboarding New Admins

### Step-by-Step Process:

1. **Existing Admin logs in**
   ```
   /login → admin@fleetpro.com / admin123
   ```

2. **Navigate to Admin Settings**
   ```
   /admin/settings
   ```

3. **Invite New Admin**
   - Click "Users" tab
   - Click "Invite User" button
   - Enter new admin's email
   - Select role: `admin`
   - Submit

4. **New Admin Receives Email**
   - Email contains registration link
   - Link pre-fills email address

5. **New Admin Completes Registration**
   - Clicks link in email
   - Fills out name, password, phone (optional)
   - Submits registration

6. **New Admin Can Login Immediately**
   - Account is auto-approved
   - Role is already set to `admin`
   - Can access all admin features

---

## 🔍 Troubleshooting

### Issue: Cannot login with test credentials

**Possible causes:**
- Account doesn't exist in Supabase Auth
- Account exists but has different password
- Account is not approved (check approval_status in database)

**Solutions:**
1. Check if user exists in Supabase dashboard → Authentication → Users
2. Try password reset flow
3. Use admin invite system to create new account
4. Manually approve in database if needed

### Issue: New registration can't login

**Check:**
- User's `approval_status` in database (should be `approved`)
- User's `role` is correct
- Email is confirmed in Supabase Auth

**Solution:**
- Admin needs to approve in `/admin/settings` → Users tab
- Change approval status from `pending_approval` to `approved`

### Issue: Admin Settings page not accessible

**Check:**
- User role is `admin` in database
- User's `approval_status` is `approved`
- User is logged in with valid session

**Solution:**
- Verify in Supabase dashboard → Table Editor → users table
- Update role and approval_status if needed

---

## 📝 Database Schema Reference

### Users Table Key Fields:

- `id`: UUID (linked to Supabase Auth user)
- `email`: String (unique, lowercase)
- `name`: String
- `role`: Enum (`admin`, `mechanic`, `driver`, `customer`)
- `approval_status`: Enum (`pending_approval`, `approved`)
- `last_seen_at`: Timestamp (for online status)
- `phone`: String (optional)
- `notify_on_repair`: Boolean (for notifications)

### Default Values on Registration:

- `role`: `driver`
- `approval_status`: `pending_approval`

### Invited Users Defaults:

- `approval_status`: `approved` (auto-approved)
- `role`: Set by admin during invite

---

## 🚀 Quick Checklist for Setting Up Admin Onboarding

- [ ] Test login with `admin@fleetpro.com` / `admin123`
- [ ] If login fails, create admin account via invite system
- [ ] Verify `/admin/settings` page loads correctly
- [ ] Test "Invite User" functionality
- [ ] Test user approval workflow
- [ ] Test role change functionality
- [ ] Verify email notifications are working
- [ ] Document any custom admin email addresses

---

## 📧 Email Configuration

The system sends emails for:
- Account invitations (via Supabase Auth)
- Account approval notifications
- Password reset requests

Make sure these environment variables are set:
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_from_email
ENABLE_EMAIL=true
```

Check `lib/email.ts` for email templates and configuration.

---

## 🔐 Security Notes

1. **Admin approval is required** - New registrations cannot login until approved
2. **Only approved admins** can access admin routes
3. **Role-based access control** - Routes check user role and approval status
4. **Password reset** - Admins can trigger password reset emails
5. **Invited users are auto-approved** - Use carefully for admin invites

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs for API errors
3. Verify database connection in Supabase dashboard
4. Verify environment variables are set correctly
5. Check Supabase Auth configuration

For database queries, use Supabase SQL Editor to:
- View all users: `SELECT * FROM users ORDER BY created_at DESC;`
- Check approval status: `SELECT email, role, approval_status FROM users;`
- Approve user manually: `UPDATE users SET approval_status = 'approved' WHERE email = 'user@example.com';`


