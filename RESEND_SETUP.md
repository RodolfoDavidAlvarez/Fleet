# Resend Email Integration Setup

This guide explains how to set up Resend email notifications for the Fleet Management System.

## 📧 Quick Setup

### 1. Environment Variables

Add these variables to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_gnAJmZCo_KVU3pd3a4WoG4LS2dQDWx21Y
RESEND_FROM_EMAIL=ralvarez@bettersystems.ai
ADMIN_EMAIL=ralvarez@bettersystems.ai
ENABLE_EMAIL=true
```

### 2. Verify Setup

The email system is automatically enabled when `RESEND_API_KEY` is set. To disable emails, set:

```env
ENABLE_EMAIL=false
```

## 📬 Email Notifications Configured

The following email notifications are automatically sent:

### Customer Notifications
- ✅ **Booking Confirmation** - Sent when a booking is created
- ✅ **Status Updates** - Sent when booking status changes
- ✅ **Job Completion** - Sent when service is completed

### Driver Notifications
- ✅ **Repair Request Confirmation** - Sent when repair request is submitted
- ✅ **Repair Booking Link** - Sent when repair is scheduled
- ✅ **Repair Completion** - Sent when repair is completed

### Admin Notifications
- ✅ **New Booking Alert** - Sent when a new booking is created
- ✅ **New Repair Request Alert** - Sent when a repair request is submitted

### Mechanic Notifications
- ✅ **Job Assignment** - Sent when a job is assigned to a mechanic

## 🎨 Email Templates

All emails use professional HTML templates with:
- Responsive design
- Brand colors and styling
- Clear call-to-action buttons
- Mobile-friendly layout

## 🌐 Bilingual Support

Repair-related emails support both English and Spanish based on the driver's `preferredLanguage` setting.

## 🔧 Configuration Details

### From Email
- **Default**: `ralvarez@bettersystems.ai`
- **Configurable**: Set `RESEND_FROM_EMAIL` in environment variables
- **Important**: Must be verified in your Resend account

### Admin Email
- **Default**: `ralvarez@bettersystems.ai`
- **Configurable**: Set `ADMIN_EMAIL` in environment variables
- **Used for**: Admin notifications (new bookings, repair requests)

### API Key
- **Current**: `re_gnAJmZCo_KVU3pd3a4WoG4LS2dQDWx21Y`
- **Location**: Set in `RESEND_API_KEY` environment variable
- **Security**: Never commit API keys to version control

## 📋 Email Notification Flow

### Booking Flow
1. Customer creates booking → Email sent to customer + admin
2. Status changes → Email sent to customer
3. Job completed → Email sent to customer

### Repair Request Flow
1. Driver submits request → Email sent to driver + admin
2. Admin schedules repair → Email with booking link sent to driver
3. Repair completed → Email sent to driver

### Job Assignment Flow
1. Admin assigns job → Email sent to mechanic

## 🧪 Testing

To test email functionality:

1. **Create a booking** - Check customer email inbox
2. **Update booking status** - Check customer email inbox
3. **Submit repair request** - Check driver and admin email inboxes
4. **Assign job to mechanic** - Check mechanic email inbox

## 🐛 Troubleshooting

### Emails not sending?

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check From Email**: Ensure `RESEND_FROM_EMAIL` is verified in Resend
3. **Check Enable Flag**: Ensure `ENABLE_EMAIL` is not set to `false`
4. **Check Logs**: Look for email errors in server console
5. **Verify Recipient**: Ensure recipient email addresses are valid

### Common Issues

**"Email disabled" messages in logs**
- Set `ENABLE_EMAIL=true` in `.env.local`

**"Resend not configured" warnings**
- Verify `RESEND_API_KEY` is set in `.env.local`
- Restart the development server after adding environment variables

**Emails going to spam**
- Verify your domain in Resend
- Check SPF/DKIM records
- Use a verified sender email address

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/emails)
- [Notification Summary](./NOTIFICATIONS_SUMMARY.md)

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Rotate API keys periodically
- Use environment-specific API keys (development vs production)
- Monitor email sending limits and usage



