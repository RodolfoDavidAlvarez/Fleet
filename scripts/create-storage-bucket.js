// Script to create Supabase storage bucket
// Run with: node scripts/create-storage-bucket.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxcixjiafdohbpwijfmd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createBucket() {
  console.log('🔧 Creating Supabase storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const publicBucket = existingBuckets?.find((b) => b.name === 'public');

    if (publicBucket) {
      console.log('✅ "public" bucket already exists!');
      console.log(`   - Public: ${publicBucket.public ? 'Yes' : 'No'}`);
      console.log(`   - Created: ${publicBucket.created_at}`);
      return;
    }

    // Create the bucket using SQL (storage API doesn't support creating buckets directly)
    console.log('⚠️  Storage API cannot create buckets directly.');
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:\n');
    console.log('---');
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '..', 'supabase', 'create_storage_bucket.sql');
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      console.log(sql);
    } else {
      console.log(`
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
      `);
    }
    console.log('---');
    console.log('\n🌐 Or create it via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/storage/buckets');
    console.log('\n   1. Click "New bucket"');
    console.log('   2. Name: public');
    console.log('   3. Make it Public: ✅');
    console.log('   4. File size limit: 5242880 (5MB)');
    console.log('   5. Click "Create bucket"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createBucket();




