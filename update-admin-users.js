/**
 * Script to update Jose Castellanos (mechanic) and Alex Rosales (admin) roles
 * Run with: node update-admin-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserRoles() {
  try {
    console.log('Starting user role updates...\n');

    // Find and update Jose Castellanos (mechanic)
    // Try variations of the name
    const joseVariations = [
      'Jose Castellanos',
      'Jose Calletano',
      'Jose Calletanos',
      'jose castellanos',
      'jose calletano',
      'jose calletanos',
    ];

    let joseFound = false;
    for (const name of joseVariations) {
      const { data: joseUsers, error: joseError } = await supabase
        .from('users')
        .select('*')
        .ilike('name', `%${name}%`);

      if (joseError) {
        console.error('Error searching for Jose:', joseError);
        continue;
      }

      if (joseUsers && joseUsers.length > 0) {
        for (const user of joseUsers) {
          if (user.role !== 'mechanic') {
            const { data: updatedJose, error: updateJoseError } = await supabase
              .from('users')
              .update({ role: 'mechanic' })
              .eq('id', user.id)
              .select()
              .single();

            if (updateJoseError) {
              console.error(`Error updating Jose (${user.name}):`, updateJoseError);
            } else {
              console.log(`✅ Updated ${updatedJose.name} (${updatedJose.email}) to role: mechanic`);
              joseFound = true;
            }
          } else {
            console.log(`ℹ️  ${user.name} already has role: mechanic`);
            joseFound = true;
          }
        }
        if (joseFound) break;
      }
    }

    if (!joseFound) {
      console.log('⚠️  Jose Castellanos not found. Please check the name in the database.');
    }

    // Find and update Alex Rosales (admin)
    const alexVariations = [
      'Alex Rosales',
      'Alexandra Rosales',
      'alex rosales',
      'alexandra rosales',
    ];

    let alexFound = false;
    for (const name of alexVariations) {
      const { data: alexUsers, error: alexError } = await supabase
        .from('users')
        .select('*')
        .ilike('name', `%${name}%`);

      if (alexError) {
        console.error('Error searching for Alex:', alexError);
        continue;
      }

      if (alexUsers && alexUsers.length > 0) {
        for (const user of alexUsers) {
          if (user.role !== 'admin') {
            const { data: updatedAlex, error: updateAlexError } = await supabase
              .from('users')
              .update({ role: 'admin' })
              .eq('id', user.id)
              .select()
              .single();

            if (updateAlexError) {
              console.error(`Error updating Alex (${user.name}):`, updateAlexError);
            } else {
              console.log(`✅ Updated ${updatedAlex.name} (${updatedAlex.email}) to role: admin`);
              alexFound = true;
            }
          } else {
            console.log(`ℹ️  ${user.name} already has role: admin`);
            alexFound = true;
          }
        }
        if (alexFound) break;
      }
    }

    if (!alexFound) {
      console.log('⚠️  Alex Rosales not found. Please check the name in the database.');
    }

    console.log('\n✅ User role updates completed!');
  } catch (error) {
    console.error('Error updating user roles:', error);
    process.exit(1);
  }
}

updateUserRoles();




