const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const projectRef = 'kxcixjiafdohbpwijfmd';
const dbPassword = 'zuhtag-jizNoj-4gihqi';
// Using the host from the previous error message in `supabase db push`
const connectionString = `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

// Let's try both 0 and 1 if 0 fails, or just use the direct DB URL if we can guess it.
// Actually, the error in the previous turn for `supabase db push` said `host=aws-1-us-east-1.pooler.supabase.com`.
// So I will use aws-1.

const connectionStringCorrect = `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
// Note: Port 5432 is usually for Session mode (direct), 6543 for Transaction mode. 
// Schema changes (DDL) usually require Session mode (5432) because prepared statements/etc might behave differently, 
// but more importantly, Supabase poolers often restrict DDL. 
// However, connecting directly to the DB (db.projectref.supabase.co) is the most reliable for DDL.
// Let's try the direct DB host first.

const directConnectionString = `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new Client({
  connectionString: directConnectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    const sql = `
      -- Fix Trigger to avoid updating all rows (violates safety policy)
      CREATE OR REPLACE FUNCTION update_department_vehicle_counts()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update count for the new department
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          IF NEW.department IS NOT NULL THEN
            UPDATE departments 
            SET vehicle_count = (
              SELECT COUNT(*) FROM vehicles WHERE department = NEW.department
            )
            WHERE name = NEW.department;
          END IF;
        END IF;

        -- Update count for the old department if it changed
        IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
          IF OLD.department IS NOT NULL AND (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.department != NEW.department)) THEN
            UPDATE departments 
            SET vehicle_count = (
              SELECT COUNT(*) FROM vehicles WHERE department = OLD.department
            )
            WHERE name = OLD.department;
          END IF;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(sql);
    console.log('Successfully updated trigger function.');

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
  }
}

run();