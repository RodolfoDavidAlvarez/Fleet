# Production Deployment URL

## Production URL
**Production URL:** `https://fleet-management-system-c7t0cfntn.vercel.app`

## Environment Variable Configuration

### For Local Development (.env.local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (Vercel Environment Variables)
Set in Vercel Dashboard → Settings → Environment Variables:
```bash
NEXT_PUBLIC_APP_URL=https://fleet-management-system-c7t0cfntn.vercel.app
```

## Usage
This URL is used in:
- Email invitations (registration links)
- Email notifications (login links, booking confirmations, etc.)
- Any absolute URLs in emails

## Important Notes
- **Local Development**: Uses `http://localhost:3000`
- **Production**: Uses `https://fleet-management-system-c7t0cfntn.vercel.app`
- Make sure to set `NEXT_PUBLIC_APP_URL` in Vercel environment variables before deploying
- The URL is automatically used by `lib/email.ts` for all email links


