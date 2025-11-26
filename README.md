# Fleet Management System

A modern, full-featured fleet management system built with Next.js, TypeScript, and Tailwind CSS. This system replaces Airtable interfaces, Calendly bookings, and JotForms with a unified, beautiful web application.

## 🚀 Features

### Admin Dashboard
- **Fleet Overview**: Complete view of all vehicles with status, maintenance schedules, and history
- **Vehicle Management**: Add, edit, and manage fleet vehicles
- **Booking Management**: View and manage all service bookings
- **Mechanic Management**: Assign mechanics to jobs and track their workload
- **Analytics & Reports**: Dashboard with key metrics, charts, and insights
- **SMS Integration**: Send automated SMS notifications via Twilio

### Mechanic Dashboard
- **Job Queue**: View assigned jobs and their priorities
- **Job Details**: Complete job information with vehicle history
- **Status Updates**: Update job status and add notes
- **Schedule View**: Calendar view of assigned jobs
- **Parts & Inventory**: Track parts needed and used

### Booking System
- **Public Booking Form**: Beautiful, user-friendly booking interface
- **Service Selection**: Choose from available services
- **Time Slot Selection**: Real-time availability checking
- **SMS Confirmations**: Automated SMS confirmations and reminders
- **Booking Management**: Full CRUD operations for bookings
- **Consent-first Messaging**: Dedicated SMS compliance page with HELP/STOP guidance

### SMS Integration (Twilio)
- **Booking Confirmations**: Automatic SMS when bookings are created
- **Status Updates**: Notify customers of job status changes
- **Job Completion**: SMS notifications when service is completed
- **Reminders**: SMS reminders before scheduled appointments (coming soon)
- **Two-Way Communication**: Receive and respond to customer messages (coming soon)

📖 **See [TWILIO_SETUP.md](./TWILIO_SETUP.md) for detailed setup instructions**

## 📋 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI**: Modern, mobile-first cards and responsive tables
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **SMS**: Twilio API
- **Authentication**: JWT-based auth system

## 🏗️ Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── vehicles/
│   │   │   ├── bookings/
│   │   │   ├── mechanics/
│   │   │   └── analytics/
│   │   └── mechanic/
│   │       ├── dashboard/
│   │       ├── jobs/
│   │       └── schedule/
│   ├── booking/
│   ├── api/
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── bookings/
│   │   ├── mechanics/
│   │   └── sms/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── admin/
│   ├── mechanic/
│   └── booking/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── twilio.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── public/
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- Twilio account (for SMS features)

### Installation

1. **Clone the repository**
   ```bash
   cd "Fleet Magement System APP"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase database**
   - Go to your Supabase project dashboard: https://kxcixjiafdohbpwijfmd.supabase.co
   - Navigate to the SQL Editor
   - Run the SQL script from `supabase/schema.sql` to create all necessary tables
   - This will create tables for: users, vehicles, bookings, jobs, mechanics, service_records, and parts

4. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ENABLE_SMS=false

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # App Configuration
   NEXTAUTH_URL=http://localhost:3000
   ```
   
   **Getting Supabase Keys:**
   - Go to your Supabase project settings
   - Under "API Settings", find your "anon/public" key (already provided)
   - For production, you'll also need the "service_role" key (keep this secret!)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 User Roles

### Admin
- Full system access
- Manage vehicles, bookings, and mechanics
- View analytics and reports
- Configure system settings

### Mechanic
- View assigned jobs
- Update job status
- Add job notes and parts used
- View schedule

### Customer
- Book service appointments
- Receive SMS notifications
- View booking status

## 🔐 Authentication

The system uses JWT-based authentication:
- Secure login/logout
- Role-based access control
- Protected API routes
- Session management

## 🗄️ Database Setup

This project uses **Supabase** (PostgreSQL) as the database. The schema includes:

- **users**: System users (admin, mechanic, customer)
- **vehicles**: Fleet vehicles with status and maintenance info
- **bookings**: Service appointments and customer bookings
- **jobs**: Work orders assigned to mechanics
- **mechanics**: Mechanic profiles and availability
- **service_records**: Vehicle service history
- **parts**: Parts used in services and jobs
- **job_parts**: Parts inventory for jobs

All tables include proper foreign key relationships, indexes for performance, and automatic timestamp updates.

## 📊 Database Schema

### Vehicles
- Vehicle ID, Make, Model, Year
- VIN, License Plate
- Status (Active, In Service, Retired)
- Last Service Date, Next Service Due
- Mileage, Service History

### Bookings
- Booking ID, Vehicle ID
- Customer Information
- Service Type, Date/Time
- Status (Pending, Confirmed, In Progress, Completed, Cancelled)
- Assigned Mechanic
- Notes

### Mechanics
- Mechanic ID, Name, Email
- Specializations
- Current Jobs
- Availability

### Jobs
- Job ID, Booking ID
- Vehicle ID, Mechanic ID
- Status, Priority
- Start/End Time
- Parts Used, Labor Hours
- Notes

## 🔔 SMS Flow

1. **Booking Created**: Customer receives confirmation SMS
2. **24h Reminder**: Reminder sent 24 hours before appointment
3. **Status Updates**: SMS when job status changes
4. **Completion**: SMS when job is completed with summary

## 🎨 Design Principles

- **Modern & Clean**: Minimalist design with focus on usability
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessible**: WCAG compliant with proper ARIA labels
- **Fast**: Optimized performance with Next.js optimizations
- **Intuitive**: User-friendly navigation and workflows

## 📈 Future Enhancements

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Inventory management system
- [ ] Customer portal
- [ ] Multi-location support
- [ ] Integration with accounting software
- [ ] Automated maintenance scheduling
- [ ] GPS tracking integration

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For technical support or questions:
- Check the documentation
- Review the code comments
- Contact the development team

---

**Built with ❤️ for efficient fleet management**
