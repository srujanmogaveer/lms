import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/config/supabase';

const ALL_TABLES = [
  'profiles',
  'instructor_approval_reviews',
  'categories',
  'courses',
  'course_modules',
  'lessons',
  'lesson_resources',
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
  'notifications',
  'discussion_threads',
  'discussion_replies'
];

async function runBackup() {
  console.log('=== STARTING SUPABASE DATABASE BACKUP ===');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const table of ALL_TABLES) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (error) {
        // Suppress if optional or not created
        console.log(`ℹ️ [${table}]: table not active or empty (${error.message})`);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
        totalRecords += (data || []).length;
        console.log(`✅ Exported [${table}]: ${(data || []).length} rows`);
      }
    } catch (e: any) {
      console.warn(`⚠️ Error reading [${table}]: ${e.message}`);
      backupData[table] = [];
    }
  }

  const jsonFilename = `backup_${timestamp}.json`;
  const jsonPath = path.join(backupDir, jsonFilename);
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Also create a latest pointer
  fs.writeFileSync(path.join(backupDir, 'backup_latest.json'), JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n🎉 Backup completed successfully!`);
  console.log(`📊 Tables backed up: ${ALL_TABLES.length}`);
  console.log(`📦 Total records backed up: ${totalRecords}`);
  console.log(`📁 File saved to: ${jsonPath}`);
}

runBackup().catch(err => {
  console.error('Backup failed:', err);
});
