/**
 * Quick verification — runs the exact query now in the fixed service
 * npx tsx scripts/verify-fix.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function verify() {
  const INSTRUCTOR_ID = 'beee4721-4ed9-40da-ad76-00025def32fa';

  // Get course IDs
  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('instructor_id', INSTRUCTOR_ID);
  const courseIds = (courses || []).map((c) => c.id);

  // Get assignment IDs
  const { data: assignments } = await supabaseAdmin
    .from('assignments')
    .select('id, title, max_score, course_id, courses:course_id(title)')
    .in('course_id', courseIds);
  const assignmentIds = (assignments || []).map((a) => a.id);

  console.log('Courses:', courseIds.length, 'Assignments:', assignmentIds.length);

  // Run FIXED query (due_days instead of due_date)
  const { data: rows, error: subErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select(`
      *,
      assignments:assignment_id(title, course_id, max_score, passing_score, due_days, courses:course_id(title)),
      profiles:student_id(full_name, email, avatar_url)
    `)
    .in('assignment_id', assignmentIds)
    .neq('status', 'Graded')
    .is('score', null)
    .order('submitted_at', { ascending: false });

  console.log('\n--- FIXED QUERY RESULT ---');
  console.log('Error:', JSON.stringify(subErr));
  console.log('Count:', rows?.length);
  if (rows && rows.length > 0) {
    rows.forEach((r) => {
      console.log(`  Submission: id=${r.id}, status=${r.status}, score=${r.score}`);
      console.log(`    Student: ${(r as any).profiles?.full_name}`);
      console.log(`    Assignment: ${(r as any).assignments?.title}`);
      console.log(`    Course: ${(r as any).assignments?.courses?.title}`);
    });
  }
}

verify().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
