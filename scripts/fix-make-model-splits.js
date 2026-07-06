/**
 * Fix vehicle make/model fields that were mangled when names were split
 * on the first space during import (e.g. "John Deere 644k" -> make "John").
 * Only applies unambiguous brand fixes. Sync script does not touch
 * make/model, so these are persistent.
 *
 * Usage: node scripts/fix-make-model-splits.js [--dry-run]
 */
require('dotenv').config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry-run');

const HEADERS = {
  apikey: KEY,
  Authorization: 'Bearer ' + KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Returns { make, model } or null to skip
function fix(v) {
  const make = clean(v.make);
  const model = clean(v.model);

  if (make === 'Verneer') return { make: 'Vermeer', model };
  if (make === 'BC1500') return { make: 'Vermeer', model: clean('BC1500 ' + model) };
  if (make === 'freightliner') return { make: 'Freightliner', model };

  if (make === 'John' && /^Deere?\b/i.test(model)) {
    return { make: 'John Deere', model: clean(model.replace(/^Deere?\s*/i, '')) };
  }
  if ((make === 'Big' || make === 'BIG') && /^Tex\b/i.test(model)) {
    return { make: 'Big Tex', model: clean(model.replace(/^Tex\s*/i, '')) };
  }
  if (make === 'Big' && /^Dog\b/i.test(model)) {
    return { make: 'Big Dog', model: clean(model.replace(/^Dog\s*/i, '')) };
  }
  if (make === 'East' && /^Texas\b/i.test(model)) {
    return { make: 'East Texas', model: clean(model.replace(/^Texas\s*/i, '')) || 'Trailer' };
  }
  return null;
}

async function main() {
  const res = await fetch(`${URL}/rest/v1/vehicles?select=id,vehicle_number,make,model&limit=1000`, { headers: HEADERS });
  const rows = await res.json();
  let changed = 0;
  for (const v of rows) {
    const upd = fix(v);
    if (!upd || (upd.make === v.make && upd.model === v.model)) continue;
    changed++;
    console.log(`#${v.vehicle_number || '???'}: "${v.make}" / "${v.model}"  ->  "${upd.make}" / "${upd.model}"`);
    if (DRY) continue;
    const r = await fetch(`${URL}/rest/v1/vehicles?id=eq.${v.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(upd),
    });
    if (!r.ok) console.log(`  ERROR: ${r.status} ${await r.text()}`);
  }
  console.log(`\n${DRY ? '[dry-run] would update' : 'Updated'} ${changed} vehicles`);
}

main();
