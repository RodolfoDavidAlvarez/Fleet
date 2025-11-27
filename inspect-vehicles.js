require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectVehicles() {
  console.log('--- Inspecting Vehicles Data ---');
  
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, make, model, year, vin, license_plate, mileage, status')
    .limit(10);

  if (error) {
    console.error('Error fetching vehicles:', error);
    return;
  }

  console.log(`Found ${vehicles.length} vehicles (showing first 10):`);
  vehicles.forEach(v => {
    console.log({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      license_plate: v.license_plate,
      mileage: v.mileage
    });
  });
}

inspectVehicles().then(() => process.exit(0));




