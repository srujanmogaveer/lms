/**
 * Script to verify and test Migration 016 tables on Supabase
 * Run: npx tsx scripts/apply-migration-016.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function checkTables() {
  console.log('Checking Chat tables on Supabase...');

  const { data: convData, error: convErr } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .limit(1);

  console.log('conversations table:', { exists: !convErr, error: convErr?.message });

  const { data: partData, error: partErr } = await supabaseAdmin
    .from('conversation_participants')
    .select('id')
    .limit(1);

  console.log('conversation_participants table:', { exists: !partErr, error: partErr?.message });

  const { data: msgData, error: msgErr } = await supabaseAdmin
    .from('messages')
    .select('id')
    .limit(1);

  console.log('messages table:', { exists: !msgErr, error: msgErr?.message });

  const { data: attData, error: attErr } = await supabaseAdmin
    .from('message_attachments')
    .select('id')
    .limit(1);

  console.log('message_attachments table:', { exists: !attErr, error: attErr?.message });
}

checkTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
