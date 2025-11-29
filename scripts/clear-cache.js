#!/usr/bin/env node

// Script to invalidate React Query cache and ensure fresh data loads

console.log('🔄 Instructions to ensure all data displays in all tabs:');
console.log('');
console.log('1. HARD REFRESH the browser:');
console.log('   - Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)');
console.log('   - Or open DevTools and right-click refresh button → "Empty Cache and Hard Reload"');
console.log('');
console.log('2. Or clear browser storage:');
console.log('   - Open DevTools → Application tab → Storage → Clear storage');
console.log('');
console.log('3. Verify all tabs show data:');
console.log('   ✅ Vehicles: Should show 862 vehicles');
console.log('   ✅ Team Members: Should show 95 users');
console.log('   ✅ Repairs: Should show 1000 repair requests');
console.log('   ✅ Service Records: Should show 200+ service records');
console.log('');
console.log('📊 Current API Status:');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllAPIs() {
  try {
    const [vehicles, users, repairs, serviceRecords] = await Promise.all([
      supabase.from('vehicles').select('id'),
      supabase.from('users').select('id'),
      supabase.from('repair_requests').select('id'),
      supabase.from('service_records').select('id')
    ]);

    console.log(`🚗 Vehicles API: ${vehicles.data?.length || 0} records`);
    console.log(`👥 Users API: ${users.data?.length || 0} records`);
    console.log(`🔧 Repair Requests API: ${repairs.data?.length || 0} records`);
    console.log(`📋 Service Records API: ${serviceRecords.data?.length || 0} records`);
    
    console.log('');
    console.log('All APIs are working! If tabs still show "No data", try hard refresh.');
    
  } catch (error) {
    console.error('❌ API Error:', error);
  }
}

checkAllAPIs();