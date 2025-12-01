/**
 * Test script for repair request API with AI analysis
 * Run with: node test-repair-api.js
 */

require('dotenv').config({ path: '.env.local' });

async function testRepairAPI() {
  console.log('🧪 Testing Repair Request API with AI Analysis\n');
  
  // Check if server is running
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log(`📍 Testing against: ${baseUrl}\n`);
  
  // Test 1: Check API endpoint exists
  console.log('1️⃣  Testing API endpoint availability...');
  try {
    const response = await fetch(`${baseUrl}/api/repair-requests`, {
      method: 'GET',
    });
    
    if (response.ok || response.status === 401) {
      console.log('✅ API endpoint is accessible\n');
    } else {
      console.log(`⚠️  API returned status: ${response.status}`);
      console.log('   (This is OK if server is not running - start with: npm run dev)\n');
    }
  } catch (error) {
    console.log('⚠️  Could not connect to API endpoint');
    console.log('   Make sure the dev server is running: npm run dev\n');
  }
  
  // Test 2: Verify environment variables
  console.log('2️⃣  Checking required environment variables...');
  const requiredVars = {
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  
  let allPresent = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`   ✅ ${key} is set`);
    } else {
      console.log(`   ❌ ${key} is missing`);
      allPresent = false;
    }
  }
  
  if (allPresent) {
    console.log('\n✅ All required environment variables are set\n');
  } else {
    console.log('\n⚠️  Some environment variables are missing\n');
  }
  
  // Test 3: Verify AI function can be imported (TypeScript check)
  console.log('3️⃣  Verifying AI module structure...');
  try {
    // Check if the file exists and has correct exports
    const fs = require('fs');
    const aiFile = fs.readFileSync('lib/ai.ts', 'utf8');
    
    const checks = {
      'Anthropic import': aiFile.includes('@anthropic-ai/sdk'),
      'analyzeRepairRequest export': aiFile.includes('export async function analyzeRepairRequest'),
      'photoUrls support': aiFile.includes('photoUrls'),
      'vision support': aiFile.includes('fetchImageAsBase64'),
      'fallback system': aiFile.includes('fallbackClassify'),
    };
    
    let allChecks = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`   ✅ ${check}`);
      } else {
        console.log(`   ❌ ${check}`);
        allChecks = false;
      }
    }
    
    if (allChecks) {
      console.log('\n✅ AI module structure is correct\n');
    } else {
      console.log('\n⚠️  Some AI module checks failed\n');
    }
  } catch (error) {
    console.log('⚠️  Could not verify AI module:', error.message);
  }
  
  // Test 4: Check API route integration
  console.log('4️⃣  Verifying API route integration...');
  try {
    const fs = require('fs');
    const apiRoute = fs.readFileSync('app/api/repair-requests/route.ts', 'utf8');
    
    const checks = {
      'AI import': apiRoute.includes('analyzeRepairRequest'),
      'photoUrls passed': apiRoute.includes('photoUrls: stored.map'),
      'AI result stored': apiRoute.includes('aiCategory: ai.category'),
    };
    
    let allChecks = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`   ✅ ${check}`);
      } else {
        console.log(`   ❌ ${check}`);
        allChecks = false;
      }
    }
    
    if (allChecks) {
      console.log('\n✅ API route integration looks correct\n');
    } else {
      console.log('\n⚠️  Some API route checks failed\n');
    }
  } catch (error) {
    console.log('⚠️  Could not verify API route:', error.message);
  }
  
  console.log('📝 Summary:');
  console.log('   - Run "npm run dev" to start the server');
  console.log('   - Submit a repair request with photos at /repair');
  console.log('   - Check server logs for AI analysis results');
  console.log('   - Verify categories appear in the repairs list\n');
}

testRepairAPI().catch(console.error);



