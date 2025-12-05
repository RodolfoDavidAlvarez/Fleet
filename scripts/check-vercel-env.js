#!/usr/bin/env node

/**
 * Vercel Environment Variable Verification Script
 * Compares Vercel production environment variables with local .env.local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load local environment variables
require('dotenv').config({ path: '.env.local' });

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'ENABLE_SMS',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'ENABLE_EMAIL',
  'NEXT_PUBLIC_APP_URL'
];

const OPTIONAL_VARS = [
  'NEXTAUTH_URL',
  'ANTHROPIC_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PHONE_NUMBER',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID'
];

console.log('\n🔍 Fetching Vercel Environment Variables...\n');
console.log('=' .repeat(80));

try {
  // Fetch Vercel environment variables for production
  const output = execSync('vercel env ls production', {
    encoding: 'utf-8',
    cwd: process.cwd()
  });

  console.log('\n✅ Successfully connected to Vercel!\n');

  // Parse the output to get variable names
  const lines = output.split('\n');
  const vercelVars = new Set();

  // Extract variable names from the output (skip header lines)
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('Environment') && !trimmed.startsWith('─') && !trimmed.startsWith('name')) {
      // Extract the variable name (first column)
      const parts = trimmed.split(/\s+/);
      if (parts.length > 0 && parts[0] && !parts[0].includes('─')) {
        vercelVars.add(parts[0]);
      }
    }
  });

  console.log(`📊 Found ${vercelVars.size} environment variables in Vercel (Production)\n`);

  // Check required variables
  console.log('✅ REQUIRED VARIABLES:\n');
  let allRequiredPresent = true;
  const missingRequired = [];

  for (const varName of REQUIRED_VARS) {
    const inVercel = vercelVars.has(varName);
    const inLocal = !!process.env[varName];
    const status = inVercel ? '✅' : '❌';

    console.log(`  ${status} ${varName}`);
    console.log(`     Vercel: ${inVercel ? 'SET' : 'MISSING'} | Local: ${inLocal ? 'SET' : 'MISSING'}`);

    if (!inVercel) {
      allRequiredPresent = false;
      missingRequired.push(varName);
    }
  }

  // Check optional variables
  console.log('\n\n⚙️  OPTIONAL VARIABLES:\n');
  const missingOptional = [];

  for (const varName of OPTIONAL_VARS) {
    const inVercel = vercelVars.has(varName);
    const inLocal = !!process.env[varName];
    const status = inVercel ? '✅' : '⚠️';

    console.log(`  ${status} ${varName}`);
    console.log(`     Vercel: ${inVercel ? 'SET' : 'NOT SET'} | Local: ${inLocal ? 'SET' : 'NOT SET'}`);

    if (!inVercel && inLocal) {
      missingOptional.push(varName);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 SUMMARY:\n');

  if (allRequiredPresent) {
    console.log('✅ All required variables are present in Vercel!');
  } else {
    console.log(`❌ Missing ${missingRequired.length} required variable(s) in Vercel:`);
    missingRequired.forEach(v => console.log(`   - ${v}`));
  }

  if (missingOptional.length > 0) {
    console.log(`\n⚠️  Missing ${missingOptional.length} optional variable(s) in Vercel:`);
    missingOptional.forEach(v => console.log(`   - ${v}`));
  }

  // Check for extra variables in Vercel
  console.log('\n📋 ALL VARIABLES IN VERCEL (Production):\n');
  const sortedVars = Array.from(vercelVars).sort();
  sortedVars.forEach(v => {
    const isRequired = REQUIRED_VARS.includes(v);
    const isOptional = OPTIONAL_VARS.includes(v);
    const marker = isRequired ? '[REQUIRED]' : isOptional ? '[OPTIONAL]' : '[EXTRA]';
    console.log(`  ${marker} ${v}`);
  });

  console.log('\n' + '=' .repeat(80));

  if (allRequiredPresent) {
    console.log('\n✅ Vercel environment is properly configured!');
    console.log('\n💡 If you\'re still seeing errors:');
    console.log('   1. Verify the VALUES are correct (not just the keys)');
    console.log('   2. Redeploy your application');
    console.log('   3. Check Vercel deployment logs for errors\n');
    process.exit(0);
  } else {
    console.log('\n❌ Action Required: Add missing variables to Vercel');
    console.log('   Use: vercel env add <VARIABLE_NAME> production\n');
    process.exit(1);
  }

} catch (error) {
  if (error.message.includes('not linked')) {
    console.error('\n❌ Error: This project is not linked to Vercel');
    console.error('   Run: vercel link\n');
  } else if (error.message.includes('not authenticated')) {
    console.error('\n❌ Error: Not authenticated with Vercel');
    console.error('   Run: vercel login\n');
  } else {
    console.error('\n❌ Error fetching Vercel environment variables:');
    console.error(error.message);
    console.error('\nTry running: vercel env ls production\n');
  }
  process.exit(1);
}
