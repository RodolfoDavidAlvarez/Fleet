#!/usr/bin/env node
// Test script to verify bug report email notifications
import { Resend } from 'resend';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing bug report email notification...\n');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('✓ Resend API key found');
  console.log('  From: AgaveFleet Bug Reports <onboarding@resend.dev>');
  console.log('  To: ralvarez@bettersystems.ai (account owner email)');
  console.log('  Note: Using resend.dev domain - verify agavefleet.com to send to any email\n');

  const testEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #fef3c7; color: #92400e; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🐛 New Bug Report [TEST]</h2>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Fleet Management System</p>
          </div>
          <div class="content">
            <div style="margin-bottom: 20px;">
              <span class="badge">PENDING</span>
            </div>

            <div class="field">
              <div class="label">Title</div>
              <div class="value"><strong>Test Bug Report - Email Notification Check</strong></div>
            </div>

            <div class="field">
              <div class="label">Description</div>
              <div class="value">This is a test email to verify that bug report notifications are working correctly. If you receive this email, the integration between AgaveFleet and BetterSystems.ai is working properly!</div>
            </div>

            <div class="field">
              <div class="label">Reported By</div>
              <div class="value">
                Test User<br>
                <a href="mailto:test@example.com">test@example.com</a>
              </div>
            </div>

            <div class="field">
              <div class="label">Report ID</div>
              <div class="value"><code>test-${Date.now()}</code></div>
            </div>

            <div class="footer">
              <p>This bug report was submitted on ${new Date().toLocaleString()}</p>
              <p>Manage this ticket in your <a href="https://bettersystems.ai/admin/tickets" style="color: #667eea;">Developer Dashboard</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    console.log('Sending test email...');

    const { data, error } = await resend.emails.send({
      from: 'AgaveFleet Bug Reports <onboarding@resend.dev>',
      to: 'ralvarez@bettersystems.ai', // Must use account owner email in test mode
      subject: '🐛 Test Bug Report: Email Notification Check',
      html: testEmailHtml,
      reply_to: 'test@example.com',
    });

    if (error) {
      console.error('\n❌ Failed to send email:');
      console.error('  Error:', error.message);
      console.error('\n  Possible issues:');
      console.error('  1. Domain not verified in Resend');
      console.error('  2. Invalid API key');
      console.error('  3. Email address not allowed');
      console.error('\n  Solution: Verify domain in Resend dashboard:');
      console.error('  https://resend.com/domains');
      process.exit(1);
    }

    console.log('\n✅ Email sent successfully!');
    console.log('  Email ID:', data.id);
    console.log('\n  Check your inbox at developer@bettersystems.ai');
    console.log('  Also check the BetterSystems.ai admin tickets page:');
    console.log('  https://bettersystems.ai/admin/tickets\n');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testEmail().catch(console.error);
