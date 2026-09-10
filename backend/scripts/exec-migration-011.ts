/**
 * Execute SQL migration on Supabase using postgres connection / service role
 * npx tsx scripts/exec-migration-011.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function migrate() {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vghcflwcfsgukwamqxdu.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('Connecting to Supabase...');

  // Try pg / rpc endpoints
  const sqlCommands = [
    `ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1);`,
    `ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1 CHECK (attempt_number >= 1);`,
    `UPDATE public.assignment_submissions SET attempt_number = 1 WHERE attempt_number IS NULL;`,
    `ALTER TABLE public.assignment_submissions ALTER COLUMN attempt_number SET NOT NULL;`,
    `ALTER TABLE public.assignment_submissions DROP CONSTRAINT IF EXISTS unique_student_assignment;`,
    `ALTER TABLE public.assignment_submissions ADD CONSTRAINT unique_assignment_student_attempt UNIQUE (assignment_id, student_id, attempt_number);`,
    `CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_assignment_attempt ON public.assignment_submissions(assignment_id, student_id, attempt_number);`
  ];

  for (const sql of sqlCommands) {
    console.log('\nExecuting:', sql);
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
      console.log('Status:', res.status);
    } catch (e: any) {
      console.log('Error:', e.message);
    }
  }
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
