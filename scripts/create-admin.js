// Script to create an admin user
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@fleetpro.com',
        password: 'admin123',
        phone: '+1234567890',
        role: 'admin',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error:', data.error);
      if (data.error.includes('already exists')) {
        console.log('\n✅ Admin user already exists!');
        console.log('Email: admin@fleetpro.com');
        console.log('Password: admin123');
        return;
      }
      throw new Error(data.error);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Role:', data.user.role);
    console.log('Approval Status:', data.user.approval_status);

    console.log('\n⚠️  Note: User is in pending_approval status. Approving now...');

    // Auto-approve the admin user
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({ approval_status: 'approved' })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Error approving user:', updateError);
    } else {
      console.log('✅ User approved!');
    }

    console.log('\n🔑 Login Credentials:');
    console.log('Email: admin@fleetpro.com');
    console.log('Password: admin123');
    console.log('\nYou can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
