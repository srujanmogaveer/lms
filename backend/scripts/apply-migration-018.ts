import { supabaseAdmin } from '../src/config/supabase';

async function checkTables() {
  console.log('Checking tables in Supabase...');

  const { data: anc, error: ancErr } = await supabaseAdmin
    .from('announcements')
    .select('id')
    .limit(1);

  if (ancErr) {
    console.log('❌ "announcements" table check failed:', ancErr.message);
  } else {
    console.log('✅ "announcements" table exists and is accessible. Rows found:', anc?.length);
  }

  const { data: reads, error: readsErr } = await supabaseAdmin
    .from('announcement_reads')
    .select('id')
    .limit(1);

  if (readsErr) {
    console.log('❌ "announcement_reads" table check failed:', readsErr.message);
  } else {
    console.log('✅ "announcement_reads" table exists and is accessible. Rows found:', reads?.length);
  }

  const { data: notifs, error: notifErr } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .limit(1);

  if (notifErr) {
    console.log('❌ "notifications" table check failed:', notifErr.message);
  } else {
    console.log('✅ "notifications" table exists and is accessible. Rows found:', notifs?.length);
  }
}

checkTables();
