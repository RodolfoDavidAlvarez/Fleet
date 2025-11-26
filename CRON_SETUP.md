# Cron Job Setup for Booking Reminders

This document explains how to set up automated SMS and email reminders for bookings.

## Overview

The system includes an endpoint `/api/bookings/reminders` that sends reminders 24 hours before confirmed appointments. This endpoint should be called daily by a cron job.

## Endpoint Details

- **URL**: `/api/bookings/reminders`
- **Method**: `GET` (for cron jobs) or `POST` (for manual testing)
- **Authentication**: Optional Bearer token (set `CRON_SECRET` env variable)

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add this to your `vercel.json`:

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

This runs daily at 9 AM UTC. Adjust the schedule as needed:
- `0 9 * * *` - Daily at 9 AM UTC
- `0 14 * * *` - Daily at 2 PM UTC
- `0 */6 * * *` - Every 6 hours

**Note**: Vercel Cron requires a Pro plan or higher.

### Option 2: GitHub Actions

Create `.github/workflows/booking-reminders.yml`:

```yaml
name: Send Booking Reminders

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Reminders
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/bookings/reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 3: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **Cronitor** (free tier available)

Configure them to call:
```
GET https://your-domain.com/api/bookings/reminders
Authorization: Bearer YOUR_CRON_SECRET
```

### Option 4: Server Cron (for self-hosted)

Add to your server's crontab:

```bash
# Run daily at 9 AM
0 9 * * * curl -X GET "https://your-domain.com/api/bookings/reminders" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Add to your `.env.local` or production environment:

```env
# Optional: Secret to protect the cron endpoint
CRON_SECRET=your-secret-key-here

# App URL (for external cron services)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Testing

### Manual Test (Single Booking)

```bash
curl -X POST https://your-domain.com/api/bookings/reminders \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "your-booking-id"}'
```

### Test All Tomorrow's Bookings

```bash
curl -X GET https://your-domain.com/api/bookings/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## What Gets Sent

For each confirmed booking scheduled for tomorrow:

1. **Email Reminder** (if customer email exists)
   - Sent via Resend
   - Includes booking details and appointment time

2. **SMS Reminder** (if customer phone exists AND SMS consent given)
   - Sent via Twilio
   - Includes service type, date, and time

## Monitoring

The endpoint returns:
```json
{
  "message": "Reminder processing completed",
  "remindersSent": 5,
  "totalBookings": 5,
  "errors": []
}
```

Monitor the response to ensure reminders are being sent successfully.

## Troubleshooting

1. **No reminders sent**: Check that bookings are confirmed and scheduled for tomorrow
2. **SMS not sent**: Verify `ENABLE_SMS=true` and customer has given SMS consent
3. **Email not sent**: Verify Resend API key is configured
4. **401 Unauthorized**: Check that `CRON_SECRET` matches in both cron job and environment

## Best Practices

1. **Run during business hours**: Schedule for a time when your team can monitor (e.g., 9 AM local time)
2. **Monitor logs**: Check application logs after each run
3. **Test first**: Use the POST endpoint to test with a single booking before enabling cron
4. **Set up alerts**: Configure error notifications if reminders fail

