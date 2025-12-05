// Test script to verify Resend API key is working
require('dotenv').config({ path: '.env.local' });
const { sendInvitationEmail } = require('../lib/email.ts');

async function testEmail() {
  console.log('🧪 Testing Resend API key...\n');
  
  // Use a test email - replace with your actual email for testing
  const testEmail = process.env.TEST_EMAIL || 'ralvarez@bettersystems.ai';
  const testRole = 'admin';
  
  console.log(`📧 Sending test invitation email to: ${testEmail}`);
  console.log(`📝 Role: ${testRole}`);
  console.log(`📤 From: ${process.env.RESEND_FROM_EMAIL || 'ralvarez@bettersystems.ai'}\n`);
  
  try {
    const result = await sendInvitationEmail(testEmail, testRole);
    
    if (result) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log(`\n📬 Check the inbox for: ${testEmail}`);
      console.log('   (Also check spam folder if not in inbox)');
    } else {
      console.log('❌ FAILED: Email was not sent');
      console.log('   Check your RESEND_API_KEY and RESEND_FROM_EMAIL configuration');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testEmail();


