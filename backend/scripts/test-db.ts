import { supabaseAdmin } from '../src/config/supabase';
import fs from 'fs';
import path from 'path';

async function testMigration() {
  console.log('Testing Supabase Connection & Database Schema...');
  
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/001_create_profiles_and_auth_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`Migration script loaded (${sql.length} bytes).`);

  // Verify supabaseAdmin client works
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (userError) {
    console.error('Supabase Admin Error:', userError.message);
    process.exit(1);
  }
  console.log('✓ Supabase Admin connection verified. Users count probed:', users.users.length);

  // Check if profiles table is queryable
  const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('id, email, role, status').limit(5);
  if (profileError) {
    console.log('Profiles table status:', profileError.message);
  } else {
    console.log('✓ Profiles table exists! Records found:', profiles.length);
  }
}

testMigration().catch(console.error);
