const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Construct Supabase connection string
const projectRef = 'kxcixjiafdohbpwijfmd';
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('❌ SUPABASE_DB_PASSWORD not found in .env.local');
  process.exit(1);
}

// Supabase connection string format
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('🔧 Running migration: Allow NULL customer_email in bookings table...');
    
    const sql = 'ALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;';
    console.log('📝 SQL:', sql);
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ The customer_email column in bookings table now allows NULL values');
    console.log('✅ Booking flow should now work for repair requests without email addresses\n');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ All done! You can now test the booking flow.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Failed to run migration');
    process.exit(1);
  });
