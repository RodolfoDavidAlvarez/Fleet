# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS=false

# JWT Secret (for production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# App Configuration
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

### Admin Login
- **Email**: `admin@fleetpro.com`
- **Password**: `admin123`

### Mechanic Login
- **Email**: `mechanic@fleetpro.com`
- **Password**: `mechanic123`

## Twilio Setup

1. Sign up for a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number or use a trial number
4. Add credentials to `.env.local`

## Project Structure

```
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   │   ├── admin/        # Admin dashboard
│   │   └── mechanic/     # Mechanic dashboard
│   ├── booking/          # Public booking page
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                  # Utility functions
├── types/                # TypeScript types
└── public/               # Static assets
```

## Development Tips

1. **Hot Reload**: Changes are automatically reflected in the browser
2. **TypeScript**: All files use TypeScript for type safety
3. **Tailwind CSS**: Use utility classes for styling
4. **API Routes**: Located in `app/api/` directory

## Common Issues

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Twilio Not Working
- Verify credentials in `.env.local`
- Check Twilio account balance
- Ensure phone number is verified (for trial accounts)

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Configure environment variables
4. Set up reverse proxy (nginx recommended)

## Next Steps

1. Set up production database (PostgreSQL recommended)
2. Implement proper authentication
3. Add error monitoring (Sentry)
4. Set up analytics
5. Configure backups


