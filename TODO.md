# Agave Fleet — TODO

> Prioritized backlog. Add items here, build when ready.

---

## Booking System

### Reschedule & Cancel Appointments

**Goal:** Let admins and drivers reschedule or cancel a booked appointment without calling anyone.

**Admin side (Booking section in dashboard):**
- [ ] Add **Reschedule** button on each booking — opens date/time picker, re-checks availability, updates booking, notifies driver via SMS + email
- [ ] Add **Cancel** button on each booking — marks booking as `cancelled`, frees the slot, notifies driver via SMS + email
- [ ] Show cancellation/reschedule history on booking detail view

**Driver side (via SMS reminder link):**
- [ ] When sending reminder SMS to driver, include a unique self-service link (e.g. `agavefleet.com/booking/manage/[token]`)
- [ ] That link shows their appointment details with two actions: **Reschedule** and **Cancel**
- [ ] Reschedule → shows available slots, driver picks new time, confirms, all parties notified
- [ ] Cancel → driver confirms cancellation, slot freed, admin + Alex notified via SMS + email
- [ ] Link should be tokenized (short-lived, single-use) so it's secure

**Notifications when rescheduled or cancelled:**
- [ ] SMS to driver confirming the change
- [ ] SMS to Alex (`+16029193335`) and Danny (`+16023205485`)
- [ ] Email to `ralvarez@bettersystems.ai` (Rodo)
- [ ] Update booking status in Supabase (`rescheduled`, `cancelled`)

**Files to touch when building:**
- `app/booking-link/[id]/page.tsx` — existing booking UI (reference)
- `app/api/bookings/[id]/route.ts` — add PATCH for reschedule/cancel
- `lib/twilio.ts` — add `sendRescheduleNotice()`, `sendCancellationNotice()`
- `lib/email.ts` — add reschedule/cancellation email templates
- New page: `app/booking/manage/[token]/page.tsx` — driver self-service page
- New API: `app/api/bookings/[id]/reschedule/route.ts`
- New API: `app/api/bookings/[id]/cancel/route.ts`

---

## Realtime Updates

- [x] Supabase Realtime wired into DashboardLayout (deployed Mar 1, 2026)
- [x] Run SQL in Supabase dashboard to activate broadcasting (done Mar 2, 2026 via psql)

---

*Last updated: March 1, 2026*
