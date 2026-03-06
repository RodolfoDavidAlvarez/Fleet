# Agave Environmental - Client Log

## Client Summary

| Item | Details |
|------|---------|
| **Company** | Agave Environmental Contracting, Inc. |
| **Primary Contact** | Victoria Rosales (victoria.rosales@agave-inc.com) |
| **Admin Contact** | Alexandra Rosales (alexandra.rosales@agave-inc.com) |
| **Operations** | Danny Figueroa (danny.figueroa@agave-inc.com) |
| **Project** | Fleet Management System (AgaveFleet) |
| **Live URL** | https://agavefleet.com |
| **Stripe Customer** | cus_TYuVbRoiHkfPhI |

---

## Strategy: Proof-of-Concept Client

**Goal:** Use Agave as a "guinea pig" to develop and prove the fleet management product, then scale pricing once value is demonstrated.

### Current Phase: Value Building
- Charge only what's fair and justifiable now
- Build trust by delivering exceptional value
- Avoid looking like we're taking advantage
- Document wins and value delivered

### Future Phase: Scaled Pricing
- **Target:** $25/admin user/month
- **Trigger:** After demonstrating significant value with:
  - Fraud detection/protection features
  - Cost savings documentation
  - Operational efficiency improvements
  - Full team adoption (Alex, Danny, drivers)

---

## Billing Status

### Current Invoice (NOHUGMBD-0001)
| Item | Amount | Type |
|------|--------|------|
| Domain (agavefleet.com) | $23.00 | One-time |
| Lanyards with NFC cards | $57.00 | One-time |
| SMS and AI usage | $20.00 | Monthly |
| Maintaining and handling | $51.00 | Monthly |
| Email (Resend) | $20.00 | Monthly |
| Hosting (Vercel) | $31.00 | Monthly |
| Database (Supabase) | $20.00 | Monthly |
| **Subtotal** | **$222.00** | |
| Tax (~9.1%) | $20.20 | |
| **TOTAL DUE** | **$242.20** | |

**Status:** Open, NOT YET SENT to Victoria
**Due Date:** December 15, 2025 (overdue)

### Monthly Subscription
| Service | Cost | Notes |
|---------|------|-------|
| SMS/AI | $20 | Twilio usage |
| Maintenance | $51 | Bug fixes, updates |
| Email | $20 | Resend transactional |
| Hosting | $31 | Vercel Pro |
| Database | $20 | Supabase |
| **Monthly Total** | **$142** | |

### Voided Invoices
- NOHUGMBD-0002 ($154.92) - Voided Jan 24, 2026 (was duplicate/confusing)

---

## Onboarding Status

| User | Role | Email | Phone | Login | Status |
|------|------|-------|-------|-------|--------|
| Alexandra Rosales | Admin | alexandra.rosales@agave-inc.com | - | ? | Needs verification |
| Danny Figueroa | Operations | danny.figueroa@agave-inc.com | (602) 320-5485 | Jan 13, 2026 | Active + Daily Brief |
| Victoria Rosales | Billing | victoria.rosales@agave-inc.com | - | ? | Billing contact only |

### Onboarding Goals
- [ ] Verify Alex has working login
- [ ] Train Alex on admin dashboard
- [ ] Train Danny on operations features
- [ ] Get drivers using repair request system
- [ ] Document usage and value delivered

---

## System Delivered

### Features Built
| Feature | Status |
|---------|--------|
| Fleet inventory (262 vehicles) | Live |
| Service records (370+ records) | Live |
| Driver repair requests | Live |
| SMS notifications | Live |
| Email notifications | Live |
| Admin dashboard | Live |
| Booking/scheduling system | Live |
| User authentication (roles) | Live |
| Data migration from Airtable | Complete |
| Daily Brief (6 AM email + SMS) | Live |
| Mobile Bookings Page (/my-bookings) | Live |

### Technical Stack
- Next.js 14 + React + TailwindCSS
- Supabase (PostgreSQL + Auth)
- Twilio SMS
- Resend Email
- Vercel hosting

---

## Value to Demonstrate (Future Billing Justification)

Before scaling to $25/admin pricing, we need to show:

### Operational Improvements
- [ ] Time saved on fleet tracking
- [ ] Faster repair request processing
- [ ] Better maintenance scheduling
- [ ] Reduced vehicle downtime

### Cost Savings
- [ ] Document any fraud/misuse detection
- [ ] Track maintenance cost trends
- [ ] Show efficiency gains

### Advanced Features (Planned)
- [ ] Fraud detection/protection
- [ ] Predictive maintenance alerts
- [ ] Cost analytics dashboard
- [ ] Driver performance metrics

---

## Activity Log

### January 24, 2026 (Evening)
- **Danny Notifications System Implemented**
  - Updated Danny's phone in database: +16023205485
  - Created Daily Brief API endpoint (`/api/bookings/daily-brief`)
  - Daily Brief runs at 6 AM MST (13:00 UTC) via Vercel Cron
  - Sends email + SMS summary of today's bookings
  - Created mobile-friendly `/my-bookings` page for Danny
  - Tested with Rodo's phone - both email and SMS working
- Deployed to production

### January 24, 2026
- Audited Stripe invoices
- Voided NOHUGMBD-0002 (Jan invoice, $154.92) - was causing confusion
- Confirmed NOHUGMBD-0001 ($242.20) is correct and includes one-time + first month
- Invoice still NOT SENT to Victoria - needs to be sent
- Created this CLIENT_LOG.md

### January 13, 2026
- **Vehicle Duplicate Cleanup**
  - Cleaned 147 duplicate records (409 → 262 unique vehicles)
  - Removed AIRTABLE placeholder records
- **Service Notes Migration**
  - Migrated "Repairs" field from Airtable to Supabase
  - 365 service records updated with mechanic notes
- **Danny Figueroa Account Created**
  - Supabase Auth + profile with admin role
  - Credentials: danny.figueroa@agave-inc.com / AgaveFleet2026!
- **Email Sent to Alex & Danny** about system improvements

### December 8, 2025
- Created Stripe customer for Victoria
- Created subscription ($142/month for 5 services)
- Added one-time items (domain $23, lanyards $57)
- Invoice auto-created but NOT SENT

### December 2025 - Initial Deployment
- Agavefleet.com deployed to production
- Migrated data from Airtable to Supabase
- Set up authentication system (Supabase Auth)
- Configured Twilio SMS notifications
- Created admin, mechanic, and driver dashboards
- Key fixes: SMS reliability, bug reports visibility, timezone bug

---

## Next Actions

1. **SEND** the December invoice ($242.20) to Victoria
2. **VERIFY** Alex has working login access
3. **SCHEDULE** training session with Alex and Danny
4. **TRACK** system usage to document value
5. **PLAN** fraud detection feature development

---

*Last Updated: January 24, 2026*
