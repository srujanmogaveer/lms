import { supabaseAdmin } from '../src/config/supabase';

async function seedAdmin() {
  const adminEmail = 'srujan2.mca.2024@pim.ac.in';
  const adminPassword = '9945631447';

  console.log(`Setting up Admin user: ${adminEmail}...`);

  // Check if user already exists
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  let existingUser = userList?.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());

  let userId: string;

  if (existingUser) {
    console.log(`User exists (${existingUser.id}). Updating password and metadata...`);
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Srujan Administrator',
        role: 'admin',
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to update admin auth user');
    }
    userId = data.user.id;
  } else {
    console.log('Creating new admin user...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Srujan Administrator',
        role: 'admin',
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to create admin auth user');
    }
    userId = data.user.id;
  }

  // Ensure public.profiles record has role = 'admin' and active status
  console.log(`Updating public.profiles record for user ${userId}...`);
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: adminEmail,
      full_name: 'Srujan Administrator',
      role: 'admin',
      status: 'active',
      instructor_approval_status: 'approved',
      admin_permissions: ['all'],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (profileError) {
    console.error('Error upserting profile in database:', profileError.message);
  } else {
    console.log('✓ Successfully upserted Admin profile in public.profiles:');
    console.log(profileData);
  }

  console.log('\n========================================');
  console.log(' ADMIN ACCOUNT PROVISIONED SUCCESSFULLY');
  console.log(` Email:    ${adminEmail}`);
  console.log(` Role:     admin`);
  console.log(` Status:   active`);
  console.log('========================================');
}

seedAdmin().catch(console.error);
