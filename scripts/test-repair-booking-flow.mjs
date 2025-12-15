import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

async function testRepairBookingFlow() {
  console.log('\n🧪 Testing Complete Repair Booking Flow\n');
  console.log('This test simulates the exact flow that sends SMS to drivers.');
  console.log('─'.repeat(70));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agavefleet.com';
  console.log('\n1️⃣  Base URL Configuration:');
  console.log(`   ${baseUrl}`);

  // Simulate creating a repair request
  const mockRepairRequest = {
    id: 'bd52e8e1-e530-4de7-bf6d-e2e51e6224d2',
    requestNumber: 42,
    driverName: 'Rodolfo Alvarez',
    driverPhone: '9285501649',
    description: 'Test repair request to verify SMS link formatting works correctly across all devices and carriers',
    preferredLanguage: 'en',
  };

  console.log('\n2️⃣  Mock Repair Request:');
  console.log(`   Request #${mockRepairRequest.requestNumber}`);
  console.log(`   Driver: ${mockRepairRequest.driverName}`);
  console.log(`   Phone: ${mockRepairRequest.driverPhone}`);
  console.log(`   Issue: ${mockRepairRequest.description.slice(0, 60)}...`);

  // Generate booking link (same as route does)
  const bookingLink = `${baseUrl}/booking-link/${mockRepairRequest.id}?name=${encodeURIComponent(mockRepairRequest.driverName)}&phone=${encodeURIComponent(mockRepairRequest.driverPhone)}`;

  console.log('\n3️⃣  Generated Booking Link:');
  console.log(`   ${bookingLink}`);
  console.log(`   Length: ${bookingLink.length} characters`);

  // Create message exactly as sendRepairBookingLink does
  const displayId = `#${mockRepairRequest.requestNumber}`;
  const issueSummary = mockRepairRequest.description.slice(0, 120);

  const message = `Book your repair (${displayId}): <${bookingLink}>\nIssue: ${issueSummary}`;

  console.log('\n4️⃣  SMS Message (before wrapUrlsInAngleBrackets):');
  console.log('─'.repeat(70));
  console.log(message);
  console.log('─'.repeat(70));
  console.log(`   Message length: ${message.length} characters`);
  console.log(`   SMS segments: ${Math.ceil(message.length / 160)}`);

  // Apply the same URL wrapping function from twilio.ts
  function wrapUrlsInAngleBrackets(msg) {
    const urlPattern = /(?<!<)(https?:\/\/[^\s<>]+)(?!>)/gi;
    return msg.replace(urlPattern, '<$1>');
  }

  const processedMessage = wrapUrlsInAngleBrackets(message);

  console.log('\n5️⃣  SMS Message (after wrapUrlsInAngleBrackets):');
  console.log('─'.repeat(70));
  console.log(processedMessage);
  console.log('─'.repeat(70));
  console.log(`   Message length: ${processedMessage.length} characters`);
  console.log(`   SMS segments: ${Math.ceil(processedMessage.length / 160)}`);

  // Check if URL is properly wrapped
  const hasAngleBrackets = processedMessage.includes('<https://');
  const hasDoubleWrapping = processedMessage.includes('<<https://');

  console.log('\n6️⃣  Validation:');
  console.log(`   ✓ URL wrapped in angle brackets: ${hasAngleBrackets ? '✅ YES' : '❌ NO'}`);
  console.log(`   ✓ No double wrapping: ${!hasDoubleWrapping ? '✅ YES' : '❌ NO'}`);
  console.log(`   ✓ URL is clickable format: ${hasAngleBrackets && !hasDoubleWrapping ? '✅ YES' : '❌ NO'}`);

  // Now actually send the SMS if Twilio is configured
  console.log('\n7️⃣  Sending actual SMS...');

  try {
    const response = await fetch('http://localhost:3000/api/test-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '+19285501649',
        message: processedMessage,
      }),
    });

    if (!response.ok) {
      console.log('   ⚠️  Cannot send via API (server may not be running)');
      console.log('   📝 Use the standalone SMS test script instead');
    } else {
      const result = await response.json();
      console.log('   ✅ SMS sent via API!');
      console.log(result);
    }
  } catch (error) {
    console.log('   ⚠️  API not available, sending directly via Twilio...');

    // Import and use Twilio directly
    const twilio = (await import('twilio')).default;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const smsEnabled = process.env.ENABLE_SMS?.trim().toLowerCase() === 'true';

    if (!smsEnabled || !accountSid || !authToken || !phoneNumber) {
      console.log('   ❌ Twilio not configured or SMS disabled');
      console.log('\n📋 Summary: Message format validated but not sent');
      return;
    }

    const client = twilio(accountSid, authToken);

    try {
      const twilioMessage = await client.messages.create({
        body: processedMessage,
        from: phoneNumber,
        to: '+19285501649',
      });

      console.log('   ✅ SMS sent successfully!');
      console.log(`   Message SID: ${twilioMessage.sid}`);
      console.log(`   Status: ${twilioMessage.status}`);
    } catch (twilioError) {
      console.log('   ❌ Error sending SMS:', twilioError.message);
    }
  }

  console.log('\n📱 Check phone 928-550-1649 for the message');
  console.log('   The link should appear as a single clickable blue link');
  console.log('─'.repeat(70));
}

testRepairBookingFlow();
