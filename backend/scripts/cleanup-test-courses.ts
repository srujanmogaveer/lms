import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { supabaseAdmin } from '../src/config/supabase';

async function cleanup() {
  const { data: courses, error } = await supabaseAdmin
    .from('courses')
    .select('id, title')
    .ilike('title', '%Assignment Reattempt Test Course%');

  if (error) {
    console.error('Error fetching test courses:', error);
    return;
  }

  console.log(`Found ${courses?.length || 0} test courses to delete.`);

  if (courses && courses.length > 0) {
    for (const c of courses) {
      console.log(`Cleaning up course: ${c.title} (${c.id})`);
      const { data: asgs } = await supabaseAdmin.from('assignments').select('id').eq('course_id', c.id);
      const asgIds = (asgs || []).map((a) => a.id);
      if (asgIds.length > 0) {
        await supabaseAdmin.from('assignment_submissions').delete().in('assignment_id', asgIds);
        await supabaseAdmin.from('assignment_reattempt_requests').delete().in('assignment_id', asgIds);
        await supabaseAdmin.from('assignments').delete().in('id', asgIds);
      }
      await supabaseAdmin.from('enrollments').delete().eq('course_id', c.id);
      await supabaseAdmin.from('courses').delete().eq('id', c.id);
    }
    console.log('All test courses removed successfully!');
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
