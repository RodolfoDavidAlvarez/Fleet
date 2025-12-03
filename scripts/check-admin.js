// Script to check and fix admin user
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkAndFixAdmin() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking admin user...\n');

    // Check if admin exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@fleetpro.com')
      .single();

    if (error) {
      console.error('Error finding admin:', error.message);
      return;
    }

    if (!user) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('📋 Current Admin Status:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Approval Status:', user.approval_status);
    console.log('');

    // Fix if needed
    let needsUpdate = false;
    const updates = {};

    if (user.role !== 'admin') {
      console.log('⚠️  Role is not "admin", fixing...');
      updates.role = 'admin';
      needsUpdate = true;
    }

    if (user.approval_status !== 'approved') {
      console.log('⚠️  Not approved, fixing...');
      updates.approval_status = 'approved';
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
      } else {
        console.log('✅ Admin user updated successfully!\n');
        console.log('📋 New Status:');
        console.log('Role: admin');
        console.log('Approval Status: approved');
      }
    } else {
      console.log('✅ Admin user is properly configured!');
    }

    console.log('\n🔑 Login Credentials:');
    console.log('Email: admin@fleetpro.com');
    console.log('Password: admin123');
    console.log('\nLogin at: http://localhost:3000/login');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndFixAdmin();
