# AgaveFleet Project Log

## Session: March 4, 2026

### Compact Admin Headers
- Vehicles, Repairs, Members pages: replaced bulky stat cards and descriptions with inline badge-style stats
- All pages now jump straight into records with minimal vertical space consumed by headers
- Consistent pattern across all admin pages

### "Small Equipment" Vehicle Type
- Added as 4th vehicle type (Vehicle, Heavy Equipment, Small Equipment, Trailer)
- Updated: EditableVehicleType component, VehicleFilters, types/index.ts, Add Vehicle form

### Vehicle Sorting & Filter Persistence
- Vehicles with complete records (make + model filled) now sort before incomplete records
- All filter preferences (department, status, type, usage, days since use) persist in localStorage

### Inspection Health Status Fix
- Fixed `app/api/inspections/overview/route.ts` — `healthStatus` now based ONLY on inspection recency (green/yellow/red = timing)
- `hasCriticalIssues` is a separate flag for condition problems (poor/critical components, warning lights)
- Vehicle #3333 no longer shows "Overdue" when it has a recent inspection with poor body condition

### Members Page — Overdue Driver Highlighting
- Fetches inspection overview data to identify drivers with overdue vehicles
- Drivers with overdue vehicles show red "Overdue" badge next to their name
- Click badge sends inspection form SMS to that driver via `/api/inspections/send-reminder`
- New API: `POST /api/inspections/send-reminder` — sends single SMS with inspection form link

### Compliance Dashboard (NEW PAGE)
- New admin page at `/admin/compliance` with sidebar nav entry
- Vehicle-type-aware completeness: trailers don't need mileage, small equipment doesn't need VIN/plate, etc.
- Field requirements: Vehicle (8 fields), Equipment (5), Trailer (6), Small Equipment (4)
- Overall score with type breakdown cards
- Clickable field bars to filter by specific missing field
- Inline editing: expand any vehicle, click "Edit Fields", fill in missing data directly
- Saves via PATCH to `/api/vehicles/[id]`

### Compliance Report Email
- `POST /api/compliance/report` generates and sends HTML email report
- Includes: overall completeness score, inspection health stats, field breakdown with progress bars, worst vehicles table
- Email-client safe: all table-based layout, no CSS flex/transform
- "Send Report" button on compliance page (currently sends to rodolfo@bettersystems.ai for testing)
- Subject: `Fleet Report — March 2026 | 78% Compliance`

### Files Created
- `app/admin/compliance/page.tsx` — Compliance dashboard
- `app/api/compliance/route.ts` — Compliance data API (vehicle-type-aware)
- `app/api/compliance/report/route.ts` — Monthly report email
- `app/api/inspections/send-reminder/route.ts` — Single driver inspection SMS

### Files Modified
- `app/admin/vehicles/page.tsx` — Compact header, Small Equipment, sort complete first, persist filters
- `app/repairs/page.tsx` — Compact header with inline stats
- `app/admin/drivers/page.tsx` — Compact header, overdue highlighting, send inspection
- `app/api/inspections/overview/route.ts` — Fixed health status vs critical issues separation
- `components/Sidebar.tsx` — Added Compliance nav item
- `components/EditableVehicleType.tsx` — Added Small Equipment
- `components/VehicleFilters.tsx` — Added Small Equipment filter
- `types/index.ts` — Updated vehicleType union

---

## Session: March 1, 2026

### SMS & Notifications Overhaul

#### 1. Root Cause: Erasmo & All Drivers Never Receiving SMS
**Problem:** Erasmo Serrano and all Nov 2025 batch drivers had `sms_consent: false` — never received SMS confirmations.
**Root Cause:** Nov 2025 records were bulk-imported from Airtable without setting the consent field; older records predated the checkbox; form defaulted to `false`.
**Fix:** Removed SMS consent checkbox entirely from repair form. Hardcoded `smsConsent: true`. Internal employees always receive SMS — no opt-in gate needed.

**Files changed:**
- `app/repair/page.tsx` — removed `smsConsent` state, validation, and checkbox UI; hardcoded `fd.append("smsConsent", "true")`
- `app/api/repair-requests/route.ts` — removed consent gate; changed `if (record.driverPhone && parsed.data.smsConsent)` → `if (record.driverPhone)`

#### 2. Phone Number Normalization (Enforced Going Forward)
**Problem:** Mixed formats in DB (`(602) 555-1234`, `6025551234`, `+16025551234`) causing Twilio failures.
**Fix:** Added `normalizePhoneNumber()` at two entry points:

| File | Where Added |
|------|------------|
| `app/api/repair-requests/route.ts` | Before DB insert — normalize `driverPhone` |
| `app/api/auth/register/route.ts` | On registration — normalize user phone |

All new phone numbers stored as `+1XXXXXXXXXX` (E.164).

#### 3. Professional Admin Email on Repair Request Submission
**Problem:** Rodo's notification was plain text. Alex submits requests with photos — Rodo needs to see everything.
**Fix:** Upgraded `notifyAdminNewRepairRequest()` in `lib/email.ts` with full HTML template:
- Subject: `[Urgency] Repair Request #N — DriverName | VehicleID`
- Urgency color coding (red/orange/yellow/blue)
- Photo grid (clickable, 180×140px thumbnails)
- Driver info table, vehicle details, description block
- "View in Dashboard" CTA button

---

### Calendar / Booking Bug Fixes

#### 4. Weekly Limit Bug — Only 1 Day Showing Available
**Problem:** Calendar showed only 1 available day for the whole month. Weekly booking limit was calculated once for the first week and applied to all dates.
**Fix:** `app/api/calendar/dates-availability/route.ts` — full rewrite:
- Added `getWeekMonday()` helper
- Built `bookingsByWeek` map keyed by Monday date string
- Each date checks its own week's count against `maxBookingsPerWeek`
- Fetches bookings for ±7 days beyond month boundary to handle week crossings

#### 5. N+1 Query Bug — Availability Route
**Problem:** `availability/route.ts` queried DB once per time slot (inside the loop).
**Fix:** Moved single query outside the slot loop; check in memory.

#### 6. Timezone Bug — `getUTCDay()` vs `getDay()`
**Problem:** `new Date("YYYY-MM-DD")` parsed as UTC midnight → Arizona (UTC-7) near midnight returned wrong day-of-week.
**Fix:** All date parsing now uses `T12:00:00` (noon) so local day always matches regardless of timezone. Replaced all `getUTCDay()` calls with `getDay()`.

**Files changed:**
- `app/api/calendar/dates-availability/route.ts` — full rewrite (weekly limit + timezone fix)
- `app/api/calendar/availability/route.ts` — rewrite (N+1 fix + timezone fix)

---

### Realtime Live Updates

#### 7. Supabase Realtime — Dashboard Auto-Refresh
**Problem:** Submitting a repair request or booking doesn't update the dashboard without a manual page refresh.
**Fix:** Created `hooks/use-realtime-sync.ts` — subscribes to `postgres_changes` on `repair_requests`, `bookings`, and `vehicles` tables. On any change, invalidates React Query cache → UI auto-refreshes.
Wired into `components/DashboardLayout.tsx` via `useRealtimeSync()` — covers all admin pages.

**⚠️ PENDING ACTION:** Must run SQL in Supabase SQL Editor to activate broadcasting:
```sql
ALTER TABLE repair_requests REPLICA IDENTITY FULL;
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER TABLE vehicles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE repair_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
```
Supabase project: `kxcixjiafdohbpwijfmd.supabase.co`

**Files created/changed:**
- `hooks/use-realtime-sync.ts` — NEW
- `components/DashboardLayout.tsx` — added `useRealtimeSync()` call

---

### Bug Report Resolved

**Alex's bug report "Not Receiving repair request" (Feb 10, 2026):** Marked resolved with admin notes explaining root cause (smsConsent gate) and fix applied.

---

### TODO Documented

Created `TODO.md` in project root with full spec for:
- **Reschedule & Cancel** — Admin buttons + driver self-service link in SMS reminders
- Tokenized `/booking/manage/[token]` page for drivers
- Notifications on reschedule/cancel (SMS to driver + Alex + Danny, email to Rodo)
- All files to touch when building

---

### Deployment

All changes deployed to production via `vercel --prod`.

---

*Last Updated: March 1, 2026*

---

## Session: January 26, 2026

### Bug Fixes & Cleanup

#### 1. Bug Reports API 404 Fix
**Problem:** Bug reports page showing "Error loading bug reports" - API endpoint returning 404.
**Cause:** `app/api/admin/bug-reports/route.ts` was never committed to git.
**Fix:** Added file to git and deployed.

#### 2. Sidebar Mobile Issues (Comprehensive Fix)
**Problem:** Sidebar blocking content on mobile and not closing properly across multiple pages.

**Root Causes:**
1. `useEffect` in Sidebar.tsx had `onClose` in dependency array - caused unwanted closures on re-renders
2. Multiple pages missing `sidebarOpen` state and proper props
3. Vehicle detail page (`app/admin/vehicles/[id]/page.tsx`) main return missing `isOpen`, `onClose`, `onMenuClick` props

**Fixes Applied:**

| File | Fix |
|------|-----|
| `components/Sidebar.tsx` | Removed `onClose` from useEffect deps |
| `components/Header.tsx` | Improved hamburger tap target (44px min) |
| `components/DashboardLayout.tsx` | Changed toggle to explicit `setSidebarOpen(true)` |
| `app/admin/vehicles/[id]/page.tsx` | Added missing sidebar props to main return |
| `app/admin/analytics/page.tsx` | Added `sidebarOpen` state and props |
| `app/admin/bug-reports/page.tsx` | Added `sidebarOpen` state and props |
| `app/admin/settings/page.tsx` | Added `sidebarOpen` state and props |
| `app/admin/announcements/page.tsx` | Added `sidebarOpen` state and props |
| `app/admin/mechanics/page.tsx` | Added `sidebarOpen` state and props |
| `app/mechanic/notifications/page.tsx` | Added `sidebarOpen` state and props |
| `app/mechanic/schedule/page.tsx` | Added `sidebarOpen` state and props |

#### 3. Outdated Booking Page Hidden
**Problem:** `/booking` page was outdated - actual flow uses `/repair-request` → SMS → `/booking-link/[id]`.
**Fix:** Replaced with informational redirect page explaining new booking flow.
**File:** `app/booking/page.tsx`

#### 4. "New Booking" Button Hidden
**Problem:** Button suggested manual booking creation, but system uses repair request flow.
**Fix:** Commented out button and FAB in `app/admin/bookings/page.tsx`.

---

### Client Communication

**Email Sent:** AgaveFleet Updates - Daily Briefs & Mobile Access
- **To:** Danny Figueroa (danny.figueroa@agave-inc.com), Alexandra Rosales (alexandra.rosales@agave-inc.com)
- **CC:** Mike McMahon (mike.mcmahon@agave-inc.com)
- **Content:** Daily brief SMS feature, mobile accessibility, Danny's login credentials
- **Status:** ✅ Sent January 26, 2026

---

### Deployment
All fixes deployed to production via Vercel.

---

*Last Updated: January 26, 2026*

---

## Session: January 25, 2026

### Mobile Optimization Overhaul

**Problem:** Application was not optimized for mobile devices. Sidebar blocked content, pages were cramped, and touch targets were too small.

**Changes Made:**

#### 1. Sidebar Mobile Fix
- Added `sidebarOpen` state management to all pages
- Sidebar now hidden by default on mobile
- Hamburger menu (☰) toggles sidebar
- Tap outside or X to close
- **Files:** `app/admin/bookings/page.tsx`, `app/admin/vehicles/page.tsx`, `app/repairs/page.tsx`, `app/service-records/page.tsx`, `app/admin/drivers/page.tsx`

#### 2. Mobile CSS Utilities (`app/globals.css`)
- Added `.touch-target` (44px minimum tap targets)
- Added `.mobile-stats-scroll` (horizontal scrollable stats on mobile)
- Added `.mobile-fab` (floating action button)
- Added `.safe-area-inset-bottom` (for notched phones)
- Added `.no-scrollbar` utility

#### 3. Mobile Detection Hook (`hooks/useMediaQuery.ts`)
- NEW: Custom hook for detecting device type
- Returns: `isMobile`, `isTablet`, `isDesktop`, `deviceType`
- SSR-safe implementation

#### 4. Page-by-Page Mobile Optimization
- **Dashboard:** Stats cards horizontally scrollable on mobile
- **Bookings:** Calendar shows vertical list on mobile, FAB for new booking
- **Vehicles:** Stats scrollable, responsive header
- **Repairs:** FAB for new repair request
- **Service Records:** FAB for new record, stats scrollable

#### 5. Booking Sorting Fix
- Bookings now show upcoming dates first (soonest), then past dates (most recent)
- Same logic applied to Repairs and Service Records pages

---

### Booking Calendar Mobile Enhancement

**Problem:** The booking link calendar (`/booking-link/[id]`) was too large on mobile phones - drivers access this from SMS.

**Solution:** Created compact 7-day list view for mobile.

**File:** `app/booking-link/[id]/page.tsx`

**Features:**
- Mobile: Shows next 10 available dates as a vertical list with slot counts
- Desktop: Keeps existing calendar dropdown
- Time slots: Horizontal scrollable chips on mobile, grid on desktop
- Pre-fill: Already working (name, email, phone from repair request)

---

### Photo Gallery Lightbox

**Problem:** Photos in repair details opened in new tab - poor mobile UX.

**Solution:** Created fullscreen photo gallery with swipe support.

**File:** `components/PhotoGallery.tsx` (NEW)

**Features:**
- Full-screen modal with dark overlay
- Swipe left/right to navigate (mobile)
- Arrow keys + Escape (desktop)
- Tap/click to zoom
- Thumbnail strip at bottom
- Prevents body scroll when open

**Integration:** `app/repairs/page.tsx` - photos now open in gallery

---

### Daily Brief Weekend Skip

**Problem:** Daily briefs were being sent on weekends (Saturday/Sunday).

**Solution:**
1. Updated cron schedule in `vercel.json`: `0 13 * * 1-5` (Monday-Friday only)
2. Added weekend check in `app/api/bookings/daily-brief/route.ts`

---

### Danny Figueroa Setup (Confirmed Working)

**Status:** ✅ Fully enabled and receiving notifications

| Setting | Value |
|---------|-------|
| Phone | +16023205485 |
| Email | danny.figueroa@agave-inc.com |
| Role | admin |
| Approval | approved |
| Daily Brief | ✅ Receiving (confirmed via Twilio logs) |
| New Repair SMS | ✅ In notification_assignments |

**Twilio Log Confirmation:**
- Jan 25, 2026 6:00 AM MST: "Good morning Danny Figueroa! You have 1 booking..."

---

### Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `app/globals.css` | Modified | Added mobile CSS utilities |
| `hooks/useMediaQuery.ts` | NEW | Mobile detection hook |
| `app/admin/bookings/page.tsx` | Modified | Sidebar state, mobile layout, sorting |
| `app/admin/vehicles/page.tsx` | Modified | Sidebar state, mobile layout |
| `app/admin/drivers/page.tsx` | Modified | Sidebar state |
| `app/repairs/page.tsx` | Modified | Sidebar state, photo gallery, sorting |
| `app/service-records/page.tsx` | Modified | Sidebar state, FAB, sorting |
| `app/booking-link/[id]/page.tsx` | Modified | Mobile compact date picker, time chips |
| `components/PhotoGallery.tsx` | NEW | Fullscreen photo gallery |
| `components/Sidebar.tsx` | Modified | Mobile overlay and state props |
| `app/api/bookings/daily-brief/route.ts` | Modified | Weekend skip logic |
| `vercel.json` | Modified | Cron schedule Monday-Friday only |

---

### Testing Checklist

- [ ] Mobile sidebar toggle works (hamburger menu)
- [ ] Booking calendar shows compact list on mobile
- [ ] Time slots are horizontal scrollable on mobile
- [ ] Photo gallery opens on tap (repairs page)
- [ ] Swipe navigation works in gallery
- [ ] FAB buttons visible on mobile pages
- [ ] Daily brief not sent on weekends
- [ ] Danny receives daily briefs (Monday-Friday)

---

### Deployment Notes

```bash
# Deploy to production
cd Agavefleet.com && vercel --prod

# Test URLs
- Dashboard: https://agavefleet.com/dashboard
- Bookings: https://agavefleet.com/admin/bookings
- My Bookings (Danny): https://agavefleet.com/my-bookings
- Test booking link: https://agavefleet.com/booking-link/[repair-id]
```

---

*Last Updated: January 25, 2026*
