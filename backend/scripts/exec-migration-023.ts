/**
 * Execute Migration 023 on Supabase (Assignment Reattempt Requests)
 * Run: npx tsx scripts/exec-migration-023.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import fs from 'fs';
import { supabaseAdmin, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../src/config/supabase';

async function migrate() {
  const serviceKey = SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseUrl = SUPABASE_URL || process.env.SUPABASE_URL || '';

  console.log('Connecting to Supabase at:', supabaseUrl);

  const migrationPath = path.join(__dirname, '../supabase/migrations/023_create_assignment_reattempt_requests.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Attempt RPC exec if available
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    console.log('RPC Exec status:', res.status);
  } catch (e: any) {
    console.log('RPC Exec error:', e.message);
  }

  // Check direct table access with supabaseAdmin
  const { data: testData, error: testErr } = await supabaseAdmin
    .from('assignment_reattempt_requests')
    .select('id')
    .limit(1);

  if (testErr) {
    console.log('Note on assignment_reattempt_requests table query:', testErr.message);
  } else {
    console.log('Successfully verified assignment_reattempt_requests table via supabaseAdmin! Rows:', testData?.length);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
