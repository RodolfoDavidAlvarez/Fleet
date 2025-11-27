// Apply Supabase migrations via API using service role key
// This script applies all necessary schema changes for Airtable import

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
  process.exit(1);
}

// This client is for data ops, not SQL execution directly usually, 
// but we can try to use the RPC or just inform user. 
// Since we are in a CLI agent, we can't really "use the dashboard".
// However, we can try to use `supabase db push` if configured, but we don't have the DB password in env usually.
// The user provided the service role key. 

// IMPORTANT: Supabase JS client DOES NOT support running raw SQL strings like migrations.
// We must assume the user has run the migrations or we need to instruct them.
// BUT, we can check if the constraints exist by querying pg_catalog through RPC if available, or just try to insert.

// For this specific task ("ensure constraints"), since we cannot run SQL via JS Client directly without a custom RPC function:
// We will just output the instructions clearly.

console.log('⚠️  Automatic SQL execution via `apply-migrations-via-api.js` is not supported by Supabase JS Client.');
console.log('   Please copy the content of `supabase/ensure_constraints.sql` and run it in the Supabase SQL Editor.');
console.log('   https://supabase.com/dashboard/project/_/sql/new');

// If we had a Postgres connection string, we could use `pg` library.
// Let's check if we have POSTGRES_URL.
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (POSTGRES_URL) {
    console.log('🚀 Found POSTGRES_URL, attempting to apply migrations via `pg`...');
    const { Client } = require('pg');
    const client = new Client({
        connectionString: POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    async function run() {
        try {
            await client.connect();
            const sql = fs.readFileSync('supabase/ensure_constraints.sql', 'utf8');
            await client.query(sql);
            console.log('✅ Constraints applied successfully via Postgres connection!');
        } catch (err) {
            console.error('❌ Failed to apply SQL:', err.message);
        } finally {
            await client.end();
        }
    }
    run();
} else {
    console.log('❌ No POSTGRES_URL found. Cannot apply SQL automatically.');
}
