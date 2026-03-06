# Agave Fleet Management System

## Project Summary
Fleet management system for Agave Environmental Contracting. Tracks 262 vehicles, maintenance, repairs, and service records. Migrated from Airtable.

## Client
- **Company**: Agave Environmental Contracting, Inc.
- **Primary Contact**: Alexandra Rosales (alexandra.rosales@agave-inc.com)
- **Secondary Contact**: Danny Figueroa (danny.figueroa@agave-inc.com)

## Live URLs
- **Production**: https://agavefleet.com
- **Vercel Dashboard**: https://vercel.com/rodolfo-alvarezs-projects-5c561a46/agave-fleet

## Tech Stack
- Next.js 14 + React + TailwindCSS
- Supabase (PostgreSQL + Auth)
- Twilio SMS
- Vercel hosting

## Database

### Supabase
- **URL**: https://kxcixjiafdohbpwijfmd.supabase.co
- **Service Role Key**: In `.env.local` and Vercel env vars

### Key Tables
| Table | Purpose |
|-------|---------|
| `vehicles` | Fleet inventory (262 records) |
| `service_records` | Maintenance history with notes (370 records) |
| `repair_requests` | Driver-submitted repair requests |
| `users` | Drivers, mechanics, admins |
| `bookings` | Scheduled maintenance appointments |

### Important Fields
- `vehicles.vehicle_number` = CO. ID (unique company identifier)
- `vehicles.vin` = Vehicle Identification Number
- `service_records.description` = Mechanic notes (migrated from Airtable "Repairs" field)
- `service_records.airtable_id` = Links to original Airtable record

## Airtable (Legacy Data Source)

| Setting | Value |
|---------|-------|
| API Key | See `.env.local` (AIRTABLE_API_KEY) |
| Base ID | `appms3yBT9I2DEGl3` |
| Service Records | `tbluKRycfU6g0xufF` (field: "Repairs" = mechanic notes) |
| Equipment | `tblP0QKVJNdaDpcrD` |

## Authentication
Uses Supabase Auth. Users must exist in BOTH:
1. `auth.users` (Supabase Auth) - for login
2. `public.users` (custom table) - for profile/role

To create a new admin user:
```javascript
// 1. Create in Supabase Auth
fetch(SUPABASE_URL + '/auth/v1/admin/users', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + SERVICE_ROLE_KEY },
  body: JSON.stringify({
    email: 'user@agave-inc.com',
    password: 'SecurePassword!',
    email_confirm: true
  })
});

// 2. Create profile with SAME ID as auth user
fetch(SUPABASE_URL + '/rest/v1/users', {
  method: 'POST',
  body: JSON.stringify({
    id: AUTH_USER_ID,  // Must match!
    email: 'user@agave-inc.com',
    name: 'User Name',
    role: 'admin',
    approval_status: 'approved'
  })
});
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/migrate-service-notes.js` | Migrate Airtable "Repairs" to Supabase |
| `scripts/cleanup-vehicle-duplicates.js` | Remove duplicate vehicles by VIN |
| `scripts/sync-airtable-vehicles.js` | Sync vehicles from Airtable |

## Common Tasks

### Deploy to Production
```bash
npm run build && vercel --prod
```

### Query Vehicles
```javascript
fetch(SUPABASE_URL + '/rest/v1/vehicles?select=*', {
  headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
});
```

### Check for Duplicates
```javascript
// Group by vehicle_number to find duplicates
const byNumber = {};
vehicles.forEach(v => {
  if (v.vehicle_number) {
    if (!byNumber[v.vehicle_number]) byNumber[v.vehicle_number] = [];
    byNumber[v.vehicle_number].push(v);
  }
});
const dupes = Object.entries(byNumber).filter(([_, arr]) => arr.length > 1);
```

## SMS & Notifications

### SMS Consent
- **No opt-in gate** — Internal employees always receive SMS. `sms_consent` is hardcoded `true` on all new repair request submissions.
- Old Nov 2025 batch records have `sms_consent: false` in DB — historical artifact from bulk Airtable import. Not a real issue since the gate is now removed.

### Phone Normalization
- All phones stored as E.164: `+1XXXXXXXXXX`
- `normalizePhoneNumber()` from `lib/airtable.ts` runs on:
  - `app/api/repair-requests/route.ts` — before DB insert
  - `app/api/auth/register/route.ts` — on user registration

### Notification Assignments
- `notification_assignments` table controls who gets SMS/email for new repair requests
- Types: `sms_admin_new_repair`, `email_admin_new_repair`
- Alex (alexandra.rosales@agave-inc.com) and Danny (+16023205485) are in this table

### Admin Email (Rodo)
- `notifyAdminNewRepairRequest()` in `lib/email.ts` sends professional HTML email to `ralvarez@bettersystems.ai`
- Includes: urgency color coding, photo grid, driver info table, dashboard link
- Subject: `[Urgency] Repair Request #N — DriverName | VehicleID`

---

## Calendar / Booking System

### Known Fixed Bugs (Mar 1, 2026)
- Weekly limit was calculated once for first week → showed only 1 available day. Fixed: per-week `bookingsByWeek` map.
- N+1 query in `availability/route.ts` — now single query outside loop.
- Timezone: all dates parsed with `T12:00:00` noon, `getDay()` not `getUTCDay()`.

### Pending (TODO.md)
- Reschedule & Cancel buttons (admin)
- Driver self-service link in SMS reminders (`/booking/manage/[token]`)

---

## Realtime Updates

### Status (Mar 1, 2026)
- `hooks/use-realtime-sync.ts` created and wired into `DashboardLayout`
- Subscribes to `repair_requests`, `bookings`, `vehicles` via Supabase Realtime
- Invalidates React Query cache on any DB change → UI auto-refreshes

### ⚠️ PENDING: Run this SQL in Supabase SQL Editor
Supabase project: `kxcixjiafdohbpwijfmd.supabase.co`
```sql
ALTER TABLE repair_requests REPLICA IDENTITY FULL;
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER TABLE vehicles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE repair_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
```

---

## Known Issues / History

### Resolved
- **SMS env var trimming** - Fixed trailing whitespace in Twilio credentials
- **Vehicle duplicates** - Cleaned 147 duplicates (Jan 13, 2026)
- **Service notes missing** - Migrated from Airtable "Repairs" field (Jan 13, 2026)
- **Danny login** - Created Supabase Auth account + profile (Jan 13, 2026)
- **sms_consent always false** - Removed consent gate, hardcoded true (Mar 1, 2026)
- **Calendar showing 1 day / wrong slots** - Fixed weekly limit + timezone bugs (Mar 1, 2026)
- **Dashboard not auto-refreshing** - Supabase Realtime hook added (Mar 1, 2026)

### Watch For
- 7 orphan AIRTABLE placeholder records remain (kept intentionally)
- New records from Alex may need manual cleanup if imported incorrectly
- Supabase Realtime broadcasting SQL still needs to be run (see above)

## Key Files
- `PROJECT_LOG.md` - Detailed session logs
- `.env.local` - Local environment variables
- `.env.vercel.production` - Production env vars

---

*Last updated: March 1, 2026*
