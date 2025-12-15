import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function finalSMSTest() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const client = twilio(accountSid, authToken);
  const baseUrl = 'https://agavefleet.com';
  const bookingLink = `${baseUrl}/booking-link/bd52e8e1-e530-4de7-bf6d-e2e51e6224d2?name=${encodeURIComponent('Rodolfo Alvarez')}&phone=9285501649`;

  // NEW FORMAT: URL on its own line with angle brackets + blank line separator
  const newFormatMessage = `Book your repair (#42):
<${bookingLink}>

Issue: Engine making strange noise when accelerating`;

  console.log('\n📱 FINAL SMS TEST - Improved Format\n');
  console.log('Message format:');
  console.log('─'.repeat(80));
  console.log(newFormatMessage);
  console.log('─'.repeat(80));
  console.log('\nKey improvements:');
  console.log('✓ URL on its own line for better recognition');
  console.log('✓ Wrapped in angle brackets to prevent breaking');
  console.log('✓ Blank line separates URL from issue description');
  console.log('✓ Cleaner, more professional appearance\n');

  try {
    const message = await client.messages.create({
      body: newFormatMessage,
      from: phoneNumber,
      to: '+19285501649',
    });

    console.log('✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('\n📱 Check your phone (928-550-1649)');
    console.log('The link should be:');
    console.log('  ✓ On its own line');
    console.log('  ✓ Clickable (blue/underlined)');
    console.log('  ✓ Opens the booking page when tapped');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalSMSTest();
