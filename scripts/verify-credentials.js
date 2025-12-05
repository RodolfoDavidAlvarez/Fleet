#!/usr/bin/env node

/**
 * Credential Verification Script
 * Checks if all required environment variables are properly configured
 */

require('dotenv').config({ path: '.env.local' });

const REQUIRED_VARS = {
  'Supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  'Email (Resend)': [
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'ENABLE_EMAIL'
  ],
  'Application URLs': [
    'NEXT_PUBLIC_APP_URL'
  ]
};

const OPTIONAL_VARS = {
  'Twilio SMS': [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'ENABLE_SMS'
  ],
  'AI Analysis': [
    'ANTHROPIC_API_KEY'
  ],
  'Airtable': [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID'
  ]
};

console.log('\n🔍 Environment Variable Verification\n');
console.log('=' .repeat(60));

let allRequiredPresent = true;
let warnings = [];

// Check required variables
console.log('\n✅ REQUIRED VARIABLES:\n');
for (const [category, vars] of Object.entries(REQUIRED_VARS)) {
  console.log(`\n${category}:`);
  for (const varName of vars) {
    const value = process.env[varName];
    const isSet = !!value;
    const status = isSet ? '✅' : '❌';
    console.log(`  ${status} ${varName}: ${isSet ? 'SET' : 'MISSING'}`);
    if (!isSet) {
      allRequiredPresent = false;
    }
  }
}

// Check optional variables
console.log('\n\n⚙️  OPTIONAL VARIABLES:\n');
for (const [category, vars] of Object.entries(OPTIONAL_VARS)) {
  console.log(`\n${category}:`);
  let categoryComplete = true;
  const results = [];

  for (const varName of vars) {
    const value = process.env[varName];
    const isSet = !!value;
    const status = isSet ? '✅' : '⚠️';
    results.push({ status, varName, isSet });
    if (!isSet) categoryComplete = false;
  }

  for (const { status, varName, isSet } of results) {
    console.log(`  ${status} ${varName}: ${isSet ? 'SET' : 'NOT SET'}`);
  }

  if (!categoryComplete) {
    warnings.push(`${category} not fully configured - some features may not work`);
  }
}

// Validate specific values
console.log('\n\n🔬 VALIDATION CHECKS:\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.log('  ⚠️  NEXT_PUBLIC_SUPABASE_URL doesn\'t look like a Supabase URL');
  warnings.push('Supabase URL format looks incorrect');
} else if (supabaseUrl) {
  console.log('  ✅ Supabase URL format valid');
}

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
if (twilioSid && !twilioSid.startsWith('AC')) {
  console.log('  ⚠️  TWILIO_ACCOUNT_SID should start with "AC"');
  warnings.push('Twilio Account SID format looks incorrect');
} else if (twilioSid) {
  console.log('  ✅ Twilio Account SID format valid');
}

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
if (twilioAuthToken && twilioAuthToken.length !== 32) {
  console.log('  ⚠️  TWILIO_AUTH_TOKEN should be 32 characters');
  warnings.push('Twilio Auth Token length looks incorrect');
} else if (twilioAuthToken) {
  console.log('  ✅ Twilio Auth Token length valid');
}

const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
if (twilioPhone && !twilioPhone.startsWith('+')) {
  console.log('  ⚠️  TWILIO_PHONE_NUMBER should start with "+"');
  warnings.push('Twilio phone number should be in E.164 format (+1234567890)');
} else if (twilioPhone) {
  console.log('  ✅ Twilio phone number format valid');
}

const enableSms = process.env.ENABLE_SMS;
const smsConfigured = twilioSid && twilioAuthToken && twilioPhone;
if (enableSms === 'true' && !smsConfigured) {
  console.log('  ❌ ENABLE_SMS is true but Twilio credentials are incomplete');
  warnings.push('SMS enabled but Twilio not fully configured - SMS will fail');
} else if (enableSms === 'true') {
  console.log('  ✅ SMS enabled and Twilio configured');
} else {
  console.log('  ℹ️  SMS disabled');
}

const resendKey = process.env.RESEND_API_KEY;
if (resendKey && !resendKey.startsWith('re_')) {
  console.log('  ⚠️  RESEND_API_KEY should start with "re_"');
  warnings.push('Resend API key format looks incorrect');
} else if (resendKey) {
  console.log('  ✅ Resend API key format valid');
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('\n📊 SUMMARY:\n');

if (allRequiredPresent && warnings.length === 0) {
  console.log('✅ All required variables are set and valid!');
  console.log('✅ All optional variables are configured!');
  console.log('\n🚀 Your environment is ready for deployment!\n');
  process.exit(0);
} else if (allRequiredPresent) {
  console.log('✅ All required variables are set!');
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  console.log('\n✅ Your environment is ready, but some optional features may not work.\n');
  process.exit(0);
} else {
  console.log('❌ Some required variables are MISSING!');
  console.log('\n📋 ACTION REQUIRED:');
  console.log('  1. Copy missing variables from VERCEL_ENV_COMPLETE.md');
  console.log('  2. Add them to your .env.local file (for local development)');
  console.log('  3. Add them to Vercel environment variables (for production)');
  console.log('  4. Run this script again to verify\n');
  process.exit(1);
}
