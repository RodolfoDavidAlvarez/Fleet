# Notifications System Summary

This document provides a comprehensive overview of all notifications implemented in the Fleet Management System.

## 📧 Email Notifications (Resend)

### Configuration
- **API Key**: `RESEND_API_KEY` (configured: `re_gnAJmZCo_KVU3pd3a4WoG4LS2dQDWx21Y`)
- **From Email**: `ralvarez@bettersystems.ai`
- **Admin Email**: `ADMIN_EMAIL` environment variable (defaults to `ralvarez@bettersystems.ai`)

### Email Notification Types

#### 1. Booking Confirmation Email
- **Trigger**: When a new booking is created
- **Recipients**: Customer
- **Includes**: Service type, date, time, booking ID, vehicle info, notes
- **Location**: `app/api/bookings/route.ts`

#### 2. Booking Status Update Email
- **Trigger**: When booking status changes (pending → confirmed → in_progress → completed/cancelled)
- **Recipients**: Customer
- **Includes**: Booking ID, new status, service type
- **Location**: `app/api/bookings/[id]/route.ts`

#### 3. Job Completion Email
- **Trigger**: When a job is marked as completed with total cost
- **Recipients**: Customer
- **Includes**: Service type, total cost, booking ID
- **Location**: `app/api/jobs/[id]/route.ts`

#### 4. Repair Request Submission Email
- **Trigger**: When a repair request is submitted
- **Recipients**: Driver (if email provided)
- **Includes**: Request ID, summary, urgency
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/route.ts`

#### 5. Repair Booking Link Email
- **Trigger**: When a repair request is scheduled and booking link is generated
- **Recipients**: Driver (if email provided)
- **Includes**: Booking link, request ID, issue summary, suggested time slot
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/[id]/schedule/route.ts`

#### 6. Repair Completion Email
- **Trigger**: When a repair is completed and report is submitted
- **Recipients**: Driver (if email provided)
- **Includes**: Request ID, summary, total cost
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/[id]/report/route.ts`

#### 7. Admin Notification - New Booking
- **Trigger**: When a new booking is created
- **Recipients**: Admin (configured via `ADMIN_EMAIL`)
- **Includes**: Booking ID, customer details, service type, date/time, vehicle info
- **Location**: `app/api/bookings/route.ts`

#### 8. Admin Notification - New Repair Request
- **Trigger**: When a repair request is submitted
- **Recipients**: Admin (configured via `ADMIN_EMAIL`)
- **Includes**: Request ID, driver details, urgency, summary, vehicle identifier
- **Location**: `app/api/repair-requests/route.ts`

#### 9. Mechanic Assignment Email
- **Trigger**: When a job is assigned to a mechanic
- **Recipients**: Assigned mechanic
- **Includes**: Job ID, booking ID, customer name, service type, date/time, priority, vehicle info
- **Location**: `app/api/jobs/route.ts`

## 📱 SMS Notifications (Twilio)

### Configuration
- **Account SID**: `TWILIO_ACCOUNT_SID`
- **Auth Token**: `TWILIO_AUTH_TOKEN`
- **Phone Number**: `TWILIO_PHONE_NUMBER`
- **Enable Flag**: `ENABLE_SMS` (set to `true` to enable)

### SMS Notification Types

#### 1. Booking Confirmation SMS
- **Trigger**: When a new booking is created (if SMS consent given)
- **Recipients**: Customer
- **Location**: `app/api/bookings/route.ts`

#### 2. Booking Status Update SMS
- **Trigger**: When booking status changes
- **Recipients**: Customer
- **Location**: `app/api/bookings/[id]/route.ts`

#### 3. Job Completion SMS
- **Trigger**: When a job is marked as completed
- **Recipients**: Customer
- **Location**: `app/api/jobs/[id]/route.ts`

#### 4. Repair Submission Notice SMS
- **Trigger**: When a repair request is submitted
- **Recipients**: Driver
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/route.ts`

#### 5. Repair Booking Link SMS
- **Trigger**: When a repair request is scheduled
- **Recipients**: Driver
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/[id]/schedule/route.ts`

#### 6. Repair Completion SMS
- **Trigger**: When a repair is completed
- **Recipients**: Driver
- **Supports**: English and Spanish
- **Location**: `app/api/repair-requests/[id]/report/route.ts`

#### 7. Admin Notification SMS
- **Trigger**: When a repair request is submitted
- **Recipients**: Admin (configured via `ADMIN_PHONE_NUMBER`)
- **Location**: `app/api/repair-requests/route.ts`

## 🔔 In-App Notifications (Database)

### Configuration
- **Table**: `notifications`
- **Recipients Table**: `notification_recipients`
- **API Endpoint**: `/api/admin/notifications`
- **UI**: Admin Settings → Notifications Tab

### Notification Types
- **info**: General information notifications
- **warning**: Warning notifications
- **error**: Error notifications
- **success**: Success notifications
- **booking**: Booking-related notifications
- **repair_request**: Repair request notifications

### Features
- Role-based notifications (send to all users with specific roles)
- User-specific notifications (send to specific user IDs)
- Read/unread tracking
- Timestamp tracking

## 📋 Notification Flow Summary

### Booking Flow
1. **Customer creates booking** →
   - ✅ Email: Booking confirmation to customer
   - ✅ Email: Admin notification of new booking
   - ✅ SMS: Booking confirmation to customer (if consented)

2. **Admin updates booking status** →
   - ✅ Email: Status update to customer
   - ✅ SMS: Status update to customer

3. **Mechanic completes job** →
   - ✅ Email: Job completion to customer
   - ✅ SMS: Job completion to customer

### Repair Request Flow
1. **Driver submits repair request** →
   - ✅ Email: Submission confirmation to driver (if email provided)
   - ✅ Email: Admin notification of new repair request
   - ✅ SMS: Submission notice to driver
   - ✅ SMS: Admin notification

2. **Admin schedules repair** →
   - ✅ Email: Booking link to driver (if email provided)
   - ✅ SMS: Booking link to driver

3. **Mechanic completes repair** →
   - ✅ Email: Completion notice to driver (if email provided)
   - ✅ SMS: Completion notice to driver

### Job Assignment Flow
1. **Admin assigns job to mechanic** →
   - ✅ Email: Job assignment notification to mechanic

## 🔧 Environment Variables Required

```env
# Resend Email Configuration
RESEND_API_KEY=re_gnAJmZCo_KVU3pd3a4WoG4LS2dQDWx21Y
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ADMIN_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE_NUMBER=+1234567890
ENABLE_SMS=false
```

## ✅ Implementation Status

### Email Notifications
- ✅ Booking confirmation
- ✅ Booking status updates
- ✅ Job completion
- ✅ Repair request submission
- ✅ Repair booking link
- ✅ Repair completion
- ✅ Admin notifications (bookings & repairs)
- ✅ Mechanic assignment

### SMS Notifications
- ✅ Booking confirmation
- ✅ Booking status updates
- ✅ Job completion
- ✅ Repair request submission
- ✅ Repair booking link
- ✅ Repair completion
- ✅ Admin notifications

### In-App Notifications
- ✅ Database schema
- ✅ API endpoints
- ✅ Admin UI for creating notifications
- ⚠️ Automatic notification creation (can be added as needed)

## 🚀 Future Enhancements

### Planned
- [ ] Booking reminder emails (24 hours before appointment)
- [ ] Scheduled maintenance reminders
- [ ] Vehicle inspection due notifications
- [ ] Parts inventory low alerts
- [ ] Mechanic availability notifications
- [ ] Customer feedback requests after service completion

### Potential Improvements
- [ ] Email templates customization
- [ ] Notification preferences per user
- [ ] Batch notification sending
- [ ] Notification analytics
- [ ] Webhook support for external integrations

## 📝 Notes

1. **Email is enabled by default** if `RESEND_API_KEY` is set (unless `ENABLE_EMAIL=false`)
2. **SMS requires explicit consent** from customers (SMS compliance)
3. **Bilingual support** is available for repair-related notifications (English/Spanish)
4. **Admin notifications** are sent to both email and SMS (if configured)
5. **All email notifications** include HTML templates with proper styling
6. **Error handling** is implemented - notification failures don't break the main flow




