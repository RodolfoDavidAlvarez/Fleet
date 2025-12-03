# Quick Reference: Login Credentials & Admin Setup

## 🔑 Test/Demo Credentials

### Admin Login
```
Email: admin@fleetpro.com
Password: admin123
```

### Mechanic Login
```
Email: mechanic@fleetpro.com
Password: mechanic123
```

> **Note**: These may need to be recreated if they don't exist in your Supabase Auth system.

---

## 🚀 Quick Start: Onboarding New Admins

### Method 1: Admin Invite (Recommended)

1. **Login** as existing admin → `/login`
2. **Go to** `/admin/settings`
3. **Click** "Users" tab
4. **Click** "Invite User" button
5. **Enter** new admin's email
6. **Select** role: `admin`
7. **Submit** → Email sent automatically
8. **New admin** receives email, registers, and is auto-approved

### Method 2: Self-Registration + Approval

1. **New user** registers at `/register`
2. **Admin** logs in and goes to `/admin/settings`
3. **Admin** finds user in "Users" tab
4. **Admin** changes role to `admin` and approves account
5. **User** can now login

---

## 📍 Key URLs

- **Login**: `/login`
- **Register**: `/register`
- **Admin Dashboard**: `/admin/dashboard`
- **Admin Settings** (User Management): `/admin/settings`

---

## ✅ Verify Everything Works

1. Test login with admin credentials
2. Check `/admin/settings` loads
3. Try inviting a test user
4. Verify user approval workflow
5. Test role changes

See `ADMIN_ONBOARDING_GUIDE.md` for detailed information.

