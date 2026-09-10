import { supabaseAdmin } from '../src/config/supabase';

async function checkMigration012() {
  console.log('--- Checking Migration 012 tables in Supabase ---');
  
  const { error: cErr } = await supabaseAdmin.from('ai_conversations').select('id').limit(1);
  console.log('ai_conversations table:', cErr ? `❌ ${cErr.message}` : '✅ Available and accessible');

  const { error: mErr } = await supabaseAdmin.from('ai_messages').select('id').limit(1);
  console.log('ai_messages table:', mErr ? `❌ ${mErr.message}` : '✅ Available and accessible');

  const { error: uErr } = await supabaseAdmin.from('ai_usage_logs').select('id').limit(1);
  console.log('ai_usage_logs table:', uErr ? `❌ ${uErr.message}` : '✅ Available and accessible');

  if (!cErr && !mErr && !uErr) {
    console.log('\n🎉 Result: NO PROBLEM! Migration 012 is 100% active and healthy in Supabase.');
  }
}

checkMigration012()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
