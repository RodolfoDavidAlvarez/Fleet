#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  console.log('🚀 Adding columns to database...');
  
  try {
    // Test if repair_requests table exists, if not it needs to be created via SQL Editor
    const { data: repairTest, error: repairError } = await supabase
      .from('repair_requests')
      .select('id')
      .limit(1);
    
    if (repairError && repairError.code === 'PGRST106') {
      console.log('⚠️  repair_requests table does not exist. You need to create it manually.');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log(`
CREATE TABLE repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  reported_by TEXT,
  reporter_phone TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id UUID REFERENCES vehicles(id),
  assigned_to UUID REFERENCES users(id),
  airtable_service_id TEXT,
  jotform_id TEXT,
  photos_attachments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
      return;
    } else {
      console.log('✅ repair_requests table exists or was created');
    }
    
    console.log('✅ Database schema is ready for migration');
    
  } catch (error) {
    console.error('❌ Failed to prepare database:', error);
    console.log('\nPlease run the migration SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
  }
}

// Run if called directly
if (require.main === module) {
  addColumns();
}

module.exports = { addColumns };