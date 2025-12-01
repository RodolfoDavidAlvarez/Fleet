# Twilio SMS Integration Guide

This guide will help you set up Twilio SMS integration for the Fleet Management System.

## 📋 Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/try-twilio)
2. A Twilio phone number (you'll get one with a free trial)
3. Your Twilio Account SID and Auth Token

## 🔑 Getting Your Twilio Credentials

1. **Log in to Twilio Console**: https://console.twilio.com/

2. **Find Your Account SID and Auth Token**:

   - Go to the Dashboard
   - Your Account SID and Auth Token are displayed on the main dashboard
   - Click "Show" to reveal your Auth Token
   - Copy both values

3. **Get Your Twilio Phone Number**:
   - Navigate to "Phone Numbers" → "Manage" → "Active Numbers"
   - Copy your Twilio phone number (format: +1234567890)

## ⚙️ Configuration

Add your Twilio credentials to your `.env.local` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS=false
```

**Important**:

- The phone number must include the country code (e.g., +1 for US)
- Never commit your `.env.local` file to git
- Keep your Auth Token secret
- Set `ENABLE_SMS=true` in non-production only after credentials are configured

## 📱 SMS Features

The system automatically sends SMS notifications for:

### 1. Booking Confirmation

- **When**: Immediately after a customer creates a booking
- **Message**: Confirms booking details, date, time, and booking ID

### 2. Status Updates

- **When**: When a booking status changes (confirmed, in progress, completed, cancelled)
- **Message**: Notifies customer of status change with booking ID

### 3. Job Completion

- **When**: When a mechanic marks a job as completed
- **Message**: Service completion notification with total cost

### 4. Booking Reminders (Future Feature)

- **When**: 24 hours before scheduled appointment
- **Message**: Reminder with appointment details

## 🧪 Testing

### Test SMS Sending

You can test SMS functionality using the API endpoint:

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test message from Fleet Management System"
  }'
```

**Note**:

- In trial mode, you can only send SMS to verified phone numbers
- Add verified numbers in Twilio Console → Phone Numbers → Verified Caller IDs

### Test Booking Flow

1. Create a booking through the booking form
2. Check your phone for the confirmation SMS
3. Update booking status in admin dashboard
4. Check for status update SMS

## 🔒 Production Considerations

### 1. Upgrade from Trial

- Twilio trial accounts have limitations
- Upgrade to a paid account for production use
- Set up billing and payment method

### 2. Phone Number Formatting

- Always format phone numbers with country code
- Use E.164 format: `+[country code][number]`
- Example: `+14155552671` for US number

### 3. Error Handling

- The system logs errors if SMS fails to send
- Check server logs for Twilio errors
- Failed SMS won't break the booking flow

### 4. Rate Limits

- Twilio has rate limits based on your account type
- Monitor usage in Twilio Console
- Implement retry logic for production

## 📊 Monitoring

Monitor your SMS usage in Twilio Console:

- **Logs**: View all sent messages
- **Usage**: Track SMS count and costs
- **Errors**: Check for delivery failures

## 🛠️ Troubleshooting

### SMS Not Sending

1. **Check Environment Variables**:

   ```bash
   # Verify variables are set
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Check Twilio Console**:

   - Verify account is active
   - Check for account suspensions
   - Review error logs

3. **Verify Phone Number Format**:

   - Must include country code
   - No spaces or dashes
   - Example: `+1234567890` ✅
   - Example: `(123) 456-7890` ❌

4. **Trial Account Limitations**:
   - Can only send to verified numbers
   - Add verified numbers in Twilio Console
   - Upgrade account for production

### Common Errors

- **21211**: Invalid 'To' phone number
  - Solution: Check phone number format
- **21608**: Unsubscribed recipient
  - Solution: Recipient opted out, need to resubscribe
- **21408**: Permission denied
  - Solution: Check account permissions and billing

## 🔄 Future Enhancements

- [ ] Scheduled reminders (24h before appointment)
- [ ] Two-way SMS communication
- [ ] SMS templates for different languages
- [ ] Delivery status tracking
- [ ] SMS analytics dashboard
- [ ] Opt-out functionality

## 📚 Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Support](https://support.twilio.com/)

---

**Need Help?** Check the server logs for detailed error messages when SMS fails to send.






