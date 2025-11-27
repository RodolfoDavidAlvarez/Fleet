// Run the trigger fix migration via direct PostgreSQL connection
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxcixjiafdohbpwijfmd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running Trigger Fix Migration');
  console.log('================================\n');

  const migrationFile = path.join(__dirname, 'supabase/migrations/20250101120000_fix_trigger.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Construct connection string
  // Supabase connection string format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  // We need the database password, which is different from the service role key
  // For now, we'll provide instructions to run it manually or via SQL Editor
  
  console.log('📄 Migration SQL:');
  console.log('─'.repeat(50));
  console.log(sql);
  console.log('─'.repeat(50));
  console.log('\n');

  // Try to use Supabase Management API or provide manual instructions
  console.log('⚠️  Direct database connection requires the database password.');
  console.log('   The service role key alone is not sufficient for direct SQL execution.\n');
  console.log('📋 Please run this migration using one of these methods:\n');
  console.log('   1. Supabase SQL Editor (Recommended):');
  console.log(`      👉 https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('   2. Copy the SQL above and paste it into the SQL Editor\n');
  console.log('   3. Or use Supabase CLI if you have it configured:\n');
  console.log('      supabase db push\n');
  
  // If we have the database password in env, we could connect directly
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (dbPassword) {
    console.log('✅ Database password found. Attempting direct connection...\n');
    
    const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    
    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Connected to database');
      
      // Execute the migration
      await client.query(sql);
      console.log('✅ Migration executed successfully!');
      
      await client.end();
      console.log('\n✅ Migration complete!');
    } catch (error) {
      console.error('❌ Error executing migration:', error.message);
      if (error.message.includes('password authentication')) {
        console.error('\n💡 Tip: The database password is different from the service role key.');
        console.error('   You can find it in: Supabase Dashboard > Settings > Database > Connection string');
      }
      process.exit(1);
    }
  } else {
    console.log('💡 To run automatically, add SUPABASE_DB_PASSWORD to .env.local');
    console.log('   (Find it in: Supabase Dashboard > Settings > Database > Connection string)\n');
  }
}

runMigration().catch(console.error);
