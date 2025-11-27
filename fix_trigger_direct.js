const { Client } = require('pg');

// Use the direct connection string with the password you provided
const connectionString = 'postgres://postgres.kxcixjiafdohbpwijfmd:zuhtag-jizNoj-4gihqi@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixTrigger() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected.');

    const sql = `
      -- 1. Drop the problematic trigger first
      DROP TRIGGER IF EXISTS update_dept_counts_on_vehicle_change ON vehicles;

      -- 2. Redefine the function to be SAFE (using specific IDs)
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
            WHERE name = NEW.department; -- This WHERE clause makes it safe!
          END IF;
        END IF;

        -- Update count for the old department
        IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
          IF OLD.department IS NOT NULL AND (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.department != NEW.department)) THEN
            UPDATE departments 
            SET vehicle_count = (
              SELECT COUNT(*) FROM vehicles WHERE department = OLD.department
            )
            WHERE name = OLD.department; -- This WHERE clause makes it safe!
          END IF;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      -- 3. Recreate the trigger
      CREATE TRIGGER update_dept_counts_on_vehicle_change
      AFTER INSERT OR UPDATE OR DELETE ON vehicles
      FOR EACH ROW EXECUTE FUNCTION update_department_vehicle_counts();
    `;

    console.log('🛠️  Applying fix...');
    await client.query(sql);
    console.log('✨ Trigger fixed successfully!');

  } catch (err) {
    console.error('❌ Error fixing trigger:', err);
  } finally {
    await client.end();
  }
}

fixTrigger();
