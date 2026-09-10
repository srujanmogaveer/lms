import { supabaseAdmin } from '../src/config/supabase';

async function verifyLiveDb() {
  console.log('Fetching profiles from live database:');
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, status, instructor_approval_status, created_at');

  if (error) {
    console.error('Error querying profiles:', error.message);
  } else {
    console.table(profiles);
  }
}

verifyLiveDb().catch(console.error);
