require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

async function testSMS() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const toNumber = '+19285501649'; // Formatting with US country code
  const testMessage = 'Test message from Fleet Management System - Twilio integration test';

  console.log('Testing Twilio SMS...');
  console.log(`From: ${fromNumber}`);
  console.log(`To: ${toNumber}`);
  console.log(`Message: ${testMessage}`);
  console.log('');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('❌ Missing Twilio configuration!');
    console.log('Make sure you have in .env.local:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN');
    console.log('- TWILIO_PHONE_NUMBER');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: testMessage,
      from: fromNumber,
      to: toNumber,
    });

    console.log('✅ SMS sent successfully!');
    console.log(`Message SID: ${message.sid}`);
    console.log(`Status: ${message.status}`);
  } catch (error) {
    console.error('❌ Error sending SMS:');
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    
    if (error.code === 21211) {
      console.error('\n💡 Tip: Invalid phone number format. Make sure it includes country code (e.g., +1 for US)');
    } else if (error.code === 21608) {
      console.error('\n💡 Tip: This number is not verified. Add it in Twilio Console → Phone Numbers → Verified Caller IDs');
    }
  }
}

testSMS();

