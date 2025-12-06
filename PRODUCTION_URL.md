# Production Deployment URL

## Production URL

**Production URL:** `https://agavefleet.com`

This is the official production domain for AgaveFleet.

## Environment Variable Configuration

### For Local Development (.env.local)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (Vercel Environment Variables)

Set in Vercel Dashboard → Settings → Environment Variables:

```bash
NEXTAUTH_URL=https://agavefleet.com
NEXT_PUBLIC_APP_URL=https://agavefleet.com
```

## Usage

This URL is used in:

- Email invitations (registration links)
- Email notifications (login links, booking confirmations, etc.)
- Password reset links
- Repair booking links
- Any absolute URLs in emails and SMS messages

## Important Notes

- **Local Development**: Uses `http://localhost:3000`
- **Production**: Uses `https://agavefleet.com` (official domain)
- **Vercel Domain**: `fleet-management-system-red.vercel.app` (redirects to agavefleet.com)
- Make sure to set both `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- The URL is automatically used by `lib/email.ts` for all email links
- The URL is used by SMS notifications in `lib/twilio.ts` for booking links
