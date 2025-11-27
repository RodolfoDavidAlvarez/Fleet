require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findBadRecords() {
  console.log('--- Searching for "Bad" Records ---');
  
  // Check for records with VIN starting with AIRTABLE
  const { data: airtableVins, count: airtableCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .ilike('vin', 'AIRTABLE%');

  console.log(`Found ${airtableCount} vehicles with 'AIRTABLE' in VIN.`);
  if (airtableVins && airtableVins.length > 0) {
    console.log('Sample bad record:', airtableVins[0]);
  }

  // Check for records with empty make
  const { data: emptyMake, count: makeCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .or('make.is.null,make.eq.""');

  console.log(`Found ${makeCount} vehicles with empty/null Make.`);
}

findBadRecords().then(() => process.exit(0));




