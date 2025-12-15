import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

async function testBookingSMS() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const smsEnabled = process.env.ENABLE_SMS?.trim().toLowerCase() === 'true';

  console.log('Configuration check:');
  console.log('- TWILIO_ACCOUNT_SID:', accountSid ? 'SET' : 'MISSING');
  console.log('- TWILIO_AUTH_TOKEN:', authToken ? 'SET' : 'MISSING');
  console.log('- TWILIO_PHONE_NUMBER:', phoneNumber || 'MISSING');
  console.log('- ENABLE_SMS:', smsEnabled);

  if (!smsEnabled) {
    console.error('\n❌ SMS is disabled. Set ENABLE_SMS=true in .env.local');
    process.exit(1);
  }

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('\n❌ Twilio credentials missing');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  // Get base URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agavefleet.com';

  // Create a test booking link with your details
  const testRequestId = 'test-' + Date.now();
  const bookingLink = `${baseUrl}/booking-link/bd52e8e1-e530-4de7-bf6d-e2e51e6224d2?name=${encodeURIComponent('Rodolfo Alvarez')}&phone=9285501649`;

  // Helper function to wrap URLs in angle brackets
  function wrapUrlsInAngleBrackets(message) {
    const urlPattern = /(?<!<)(https?:\/\/[^\s<>]+)(?!>)/gi;
    return message.replace(urlPattern, '<$1>');
  }

  // Create the message (same format as sendRepairBookingLink)
  const rawMessage = `Book your repair (#1e6224d2): ${bookingLink}
Issue: Test message to verify SMS link formatting works correctly`;

  // Wrap URLs in angle brackets
  const processedMessage = wrapUrlsInAngleBrackets(rawMessage);

  console.log('\n📤 Sending test SMS to: 928-550-1649');
  console.log('\nMessage content:');
  console.log('─'.repeat(60));
  console.log(processedMessage);
  console.log('─'.repeat(60));

  try {
    const message = await client.messages.create({
      body: processedMessage,
      from: phoneNumber,
      to: '+19285501649',
    });

    console.log('\n✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('\n📱 Check your phone (928-550-1649) for the message');
    console.log('The link should be clickable and properly formatted');
  } catch (error) {
    console.error('\n❌ Error sending SMS:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

testBookingSMS();
