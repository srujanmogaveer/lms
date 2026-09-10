import { supabaseAdmin } from '../src/config/supabase';

async function run() {
  console.log('=== SUPABASE EGRESS & PAYLOAD DIAGNOSTIC ===');
  const tables = [
    'profiles',
    'courses',
    'curriculum_sections',
    'curriculum_lessons',
    'assignments',
    'assignment_submissions',
    'quizzes',
    'quiz_questions',
    'quiz_attempts',
    'orders',
    'student_ai_conversations',
    'student_ai_messages',
    'chat_conversations',
    'chat_messages',
    'announcements',
    'notifications',
    'certificates'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`Table [${table}]: Error - ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`Table [${table}]: 0 rows`);
        continue;
      }

      const totalJsonBytes = JSON.stringify(data).length;
      const avgBytesPerRow = Math.round(totalJsonBytes / data.length);
      console.log(`Table [${table}]: ${data.length} rows | Total Payload: ${(totalJsonBytes / 1024).toFixed(1)} KB | Avg: ${avgBytesPerRow} bytes/row`);

      // Check for columns containing base64 or large text (> 50KB)
      for (const row of data) {
        for (const [key, val] of Object.entries(row)) {
          if (typeof val === 'string' && (val.startsWith('data:') || val.length > 50000)) {
            console.log(`  🚨 FOUND BLOAT in table '${table}', column '${key}', row ID '${(row as any).id}': string length ${val.length} chars (approx ${(val.length / 1024).toFixed(1)} KB)`);
          }
        }
      }
    } catch (e: any) {
      console.log(`Table [${table}]: Exception - ${e?.message}`);
    }
  }
}

run().catch(console.error);
