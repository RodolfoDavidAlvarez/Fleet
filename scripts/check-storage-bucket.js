// Script to check if Supabase storage bucket exists
// Run with: node scripts/check-storage-bucket.js

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

async function checkBucket() {
  console.log('🔍 Checking Supabase storage buckets...\n');

  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }

    if (!buckets || buckets.length === 0) {
      console.log('⚠️  No buckets found in storage');
      return;
    }

    console.log(`✅ Found ${buckets.length} bucket(s):\n`);
    
    buckets.forEach((bucket) => {
      console.log(`  📦 ${bucket.name}`);
      console.log(`     - Public: ${bucket.public ? '✅ Yes' : '❌ No'}`);
      console.log(`     - Created: ${bucket.created_at}`);
      console.log(`     - Updated: ${bucket.updated_at}`);
      if (bucket.file_size_limit) {
        console.log(`     - File size limit: ${(bucket.file_size_limit / 1024 / 1024).toFixed(2)} MB`);
      }
      console.log('');
    });

    // Check specifically for 'public' bucket
    const publicBucket = buckets.find((b) => b.name === 'public');
    
    if (publicBucket) {
      console.log('✅ "public" bucket exists!');
      if (!publicBucket.public) {
        console.log('⚠️  WARNING: The "public" bucket is not set to public. Images may not be accessible.');
      }
    } else {
      console.log('❌ "public" bucket NOT found');
      console.log('\n💡 To create it, run the SQL in: supabase/create_storage_bucket.sql');
      console.log('   Or create it via Supabase Dashboard: Storage → Buckets → New bucket');
    }

    // Test upload capability
    if (publicBucket) {
      console.log('\n🧪 Testing upload capability...');
      const testKey = `test/${Date.now()}-test.txt`;
      const testContent = Buffer.from('test file');
      
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(testKey, testContent, {
          contentType: 'text/plain',
        });

      if (uploadError) {
        console.log('❌ Upload test failed:', uploadError.message);
      } else {
        console.log('✅ Upload test successful!');
        
        // Clean up test file
        await supabase.storage.from('public').remove([testKey]);
        console.log('🧹 Cleaned up test file');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBucket();

