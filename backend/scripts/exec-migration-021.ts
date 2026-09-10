/**
 * Execute Migration 021 on Supabase
 * Run: npx ts-node scripts/exec-migration-021.ts
 */
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/config/supabase';

async function migrate() {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vghcflwcfsgukwamqxdu.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('Connecting to Supabase to apply migration 021 (Course Reviews)...');

  const migrationPath = path.join(__dirname, '../supabase/migrations/021_create_course_reviews_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Attempt RPC exec if available
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    console.log('RPC Exec status:', res.status);
  } catch (e: any) {
    console.log('RPC Exec error:', e.message);
  }

  // Verify direct table access with supabaseAdmin
  const { data: testData, error: testErr } = await supabaseAdmin.from('course_reviews').select('id').limit(1);
  if (testErr) {
    console.log('Note on course_reviews table query:', testErr.message);
  } else {
    console.log('Successfully verified course_reviews table via supabaseAdmin! Rows:', testData?.length);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
