/**
 * Apply storage RLS policies using supabase admin rpc with raw SQL
 * npx tsx scripts/apply-storage-policies.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vghcflwcfsgukwamqxdu.supabase.co';
const SERVICE_KEY = 'sb_secret_Ffn6-ExWIR_TqFel2fUprg_L_mQXxlj';

// Create admin client
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    headers: { 'X-Client-Info': 'supabase-js-node/0' }
  }
});

async function run() {
  // Use Supabase's postgrest to call a stored procedure that runs SQL
  // Since exec_sql doesn't exist, we use the admin client's from() to insert directly
  // into pg_policies by calling Supabase's auth.admin API

  // Actually: use the Service Role with the `sql` endpoint via the Supabase client
  // The correct way in @supabase/supabase-js v2 is: admin.rpc('your_function', args)
  // But we can also do: fetch directly with service key to /rest/v1/rpc

  // The correct Supabase way to run raw SQL as service role is via the
  // Postgres connection through the supabase-js client's special admin methods.
  // Let's try the pg HTTP endpoint that Supabase exposes:
  const queries = [
    `CREATE POLICY IF NOT EXISTS "Allow authenticated student uploads to assignment-submissions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignment-submissions')`,
    `CREATE POLICY IF NOT EXISTS "Allow authenticated users to read assignment-submissions" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'assignment-submissions')`,
  ];

  for (const query of queries) {
    console.log('Executing:', query.substring(0, 80) + '...');
    try {
      // Try the Supabase v2 way - use the raw pg fetch
      const res = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const text = await res.text();
      console.log(`  Status: ${res.status}`, text.substring(0, 200));
    } catch (e: any) {
      console.log('  Error:', e.message);
    }
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
