// Script to create or update a user with specific credentials
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_EMAIL = 'ralvarez@bettersystems.ai';
const USER_PASSWORD = 'password123';
const USER_NAME = 'Rodolfo Alvarez';
const USER_ROLE = 'admin';

async function createOrUpdateUser() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`\n🔍 Checking for user: ${USER_EMAIL}...\n`);

    // Check if user exists in public.users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, approval_status')
      .eq('email', USER_EMAIL.toLowerCase())
      .single();

    let authUserId = null;

    if (existingUser) {
      console.log('✅ User found in database!');
      console.log('   ID:', existingUser.id);
      console.log('   Role:', existingUser.role);
      console.log('   Approval Status:', existingUser.approval_status);
      
      authUserId = existingUser.id;

      // Check if auth user exists
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(existingUser.id);
      
      if (authError || !authUser) {
        console.log('\n⚠️  Auth user not found, creating auth user...');
        // Create auth user
        const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
          email: USER_EMAIL.toLowerCase(),
          password: USER_PASSWORD,
          email_confirm: true,
          user_metadata: { name: USER_NAME }
        });

        if (createAuthError) {
          console.error('❌ Error creating auth user:', createAuthError.message);
          // Try to update password if user exists but password is wrong
          if (createAuthError.message.includes('already registered')) {
            console.log('\n🔄 User exists in auth, updating password...');
            const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
              password: USER_PASSWORD
            });
            if (updateError) {
              console.error('❌ Error updating password:', updateError.message);
            } else {
              console.log('✅ Password updated!');
            }
          }
        } else {
          console.log('✅ Auth user created!');
          authUserId = newAuthUser.user.id;
        }
      } else {
        console.log('\n🔄 Updating password for existing auth user...');
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: USER_PASSWORD
        });
        if (updateError) {
          console.error('❌ Error updating password:', updateError.message);
        } else {
          console.log('✅ Password updated!');
        }
      }

      // Update user profile to ensure admin role and approved status
      const updates = {};
      if (existingUser.role !== USER_ROLE) {
        updates.role = USER_ROLE;
      }
      if (existingUser.approval_status !== 'approved') {
        updates.approval_status = 'approved';
      }

      if (Object.keys(updates).length > 0) {
        console.log('\n🔄 Updating user profile...');
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message);
        } else {
          console.log('✅ Profile updated!');
        }
      }

    } else {
      console.log('📝 User not found, creating new user...\n');

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: USER_EMAIL.toLowerCase(),
        password: USER_PASSWORD,
        email_confirm: true,
        user_metadata: { name: USER_NAME }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        throw authError;
      }

      authUserId = authData.user.id;
      console.log('✅ Auth user created!');

      // Create public user profile
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name: USER_NAME,
          email: USER_EMAIL.toLowerCase(),
          role: USER_ROLE,
          approval_status: 'approved'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user profile:', createError.message);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(authUserId);
        throw createError;
      }

      console.log('✅ User profile created!');
    }

    // Final verification
    console.log('\n📋 Final User Status:');
    const { data: finalUser } = await supabase
      .from('users')
      .select('id, email, name, role, approval_status')
      .eq('email', USER_EMAIL.toLowerCase())
      .single();

    if (finalUser) {
      console.log('   Email:', finalUser.email);
      console.log('   Name:', finalUser.name);
      console.log('   Role:', finalUser.role);
      console.log('   Approval Status:', finalUser.approval_status);
    }

    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${USER_PASSWORD}`);
    console.log('\n✅ You can now login at: http://localhost:3000/login\n');

  } catch (error) {
    console.error('\n❌ Failed to create/update user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createOrUpdateUser();


