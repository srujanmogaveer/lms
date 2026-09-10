import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/config/supabase';

// Ordered tables to preserve foreign key dependencies when inserting
const RESTORE_ORDER = [
  'profiles',
  'categories',
  'courses',
  'instructor_approval_reviews',
  'course_modules',
  'lessons',
  'lesson_progress',
  'enrollments',
  'assignments',
  'assignment_submissions',
  'quizzes',
  'quiz_questions',
  'quiz_attempts',
  'wishlists',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'instructor_payouts',
  'live_classes',
  'announcements',
  'notifications'
];

async function runRestore() {
  const backupFile = process.argv[2] || path.join(__dirname, '..', 'backups', 'backup_latest.json');
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found at: ${backupFile}`);
    process.exit(1);
  }

  console.log(`=== RESTORING SUPABASE DATA FROM: ${backupFile} ===\n`);
  const rawData = fs.readFileSync(backupFile, 'utf-8');
  const backupData: Record<string, any[]> = JSON.parse(rawData);

  for (const table of RESTORE_ORDER) {
    const rows = backupData[table];
    if (!rows || rows.length === 0) {
      continue;
    }

    console.log(`Restoring [${table}] (${rows.length} records)...`);
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabaseAdmin.from(table).upsert(batch, { onConflict: 'id' });
      if (error) {
        console.warn(`  ⚠️ Warning restoring batch ${i / batchSize + 1} for ${table}:`, error.message);
      }
    }
    console.log(`  ✅ [${table}] restored.`);
  }

  console.log('\n🎉 Database restore process finished!');
}

runRestore().catch(console.error);
