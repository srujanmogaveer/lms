/**
 * COMPREHENSIVE DIAGNOSTIC — Run both Reminder and Pending queries against real DB
 * npx tsx scripts/full-debug.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function main() {
  const INSTRUCTOR_ID = 'beee4721-4ed9-40da-ad76-00025def32fa'; // pankaj@gmail.com

  // ============================================================
  // STEP 1 — Show instructor profile
  // ============================================================
  console.log('\n=== STEP 1: Instructor profile ===');
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, status, instructor_approval_status')
    .eq('id', INSTRUCTOR_ID)
    .single();
  console.log('Profile:', JSON.stringify(profile, null, 2));

  // ============================================================
  // STEP 2 — Get courses for instructor
  // ============================================================
  console.log('\n=== STEP 2: Courses owned by instructor ===');
  const { data: courses, error: cErr } = await supabaseAdmin
    .from('courses')
    .select('id, title, course_status, instructor_id')
    .eq('instructor_id', INSTRUCTOR_ID);
  console.log('Course error:', cErr);
  console.log('Courses:', JSON.stringify(courses, null, 2));

  const courseIds = (courses || []).map((c) => c.id);
  console.log('Course IDs:', courseIds);

  // ============================================================
  // STEP 3 — Get assignments for those courses
  // ============================================================
  console.log('\n=== STEP 3: Assignments in instructor courses ===');
  const { data: assignments, error: aErr } = await supabaseAdmin
    .from('assignments')
    .select('id, title, course_id, status')
    .in('course_id', courseIds);
  console.log('Assignment error:', aErr);
  console.log('Assignments:', JSON.stringify(assignments, null, 2));

  const asgIds = (assignments || []).map((a) => a.id);
  console.log('Assignment IDs:', asgIds);

  // ============================================================
  // STEP 4 — ALL submissions for those assignments (no filter)
  // ============================================================
  console.log('\n=== STEP 4: ALL raw submissions (no filter) ===');
  const { data: allSubs, error: allErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, assignment_id, student_id, status, score, submitted_at, created_at, updated_at, file_url, submission_text')
    .in('assignment_id', asgIds);
  console.log('All submissions error:', allErr);
  console.log('All submissions count:', allSubs?.length);
  console.log('All submissions:', JSON.stringify(allSubs, null, 2));

  // ============================================================
  // STEP 5 — REMINDER QUERY (from course.service.ts getInstructorDashboardStats)
  // ============================================================
  console.log('\n=== STEP 5: REMINDER QUERY — exact replica ===');
  const { count: reminderCount, error: reminderErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id', { count: 'exact', head: true })
    .in('assignment_id', asgIds)
    .eq('status', 'Submitted');
  console.log('Reminder query error:', reminderErr);
  console.log('Reminder count:', reminderCount);

  // Also try with 'submitted' lowercase
  const { count: reminderCountLower, error: reminderErrLower } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id', { count: 'exact', head: true })
    .in('assignment_id', asgIds)
    .eq('status', 'submitted');
  console.log('Reminder count (lowercase submitted):', reminderCountLower);

  // ============================================================
  // STEP 6 — PENDING GRADING QUERY (from assignment.service.ts — OLD broken .or())
  // ============================================================
  console.log('\n=== STEP 6: PENDING GRADING QUERY — OLD broken .or() ===');
  const { data: pendingOld, error: pendingOldErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, assignment_id, status, score')
    .in('assignment_id', asgIds)
    .or('status.eq.Submitted,status.eq.Under Review,status.neq.Graded')
    .is('score', null);
  console.log('Old pending error:', pendingOldErr);
  console.log('Old pending count:', pendingOld?.length);
  console.log('Old pending:', JSON.stringify(pendingOld, null, 2));

  // ============================================================
  // STEP 7 — PENDING GRADING QUERY — NEW fixed .neq()
  // ============================================================
  console.log('\n=== STEP 7: PENDING GRADING QUERY — NEW .neq() fix ===');
  const { data: pendingNew, error: pendingNewErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, assignment_id, status, score')
    .in('assignment_id', asgIds)
    .neq('status', 'Graded')
    .is('score', null);
  console.log('New pending error:', pendingNewErr);
  console.log('New pending count:', pendingNew?.length);
  console.log('New pending:', JSON.stringify(pendingNew, null, 2));

  // ============================================================
  // STEP 8 — Full submission with joins (as the pending query does)
  // ============================================================
  console.log('\n=== STEP 8: Full pending with joins (as getInstructorPendingSubmissions runs) ===');
  const { data: pendingFull, error: pendingFullErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select(`
      *,
      assignments:assignment_id(title, course_id, max_score, passing_score, due_date, courses:course_id(title)),
      profiles:student_id(full_name, email, avatar_url)
    `)
    .in('assignment_id', asgIds)
    .neq('status', 'Graded')
    .is('score', null)
    .order('submitted_at', { ascending: false });
  console.log('Full pending error:', JSON.stringify(pendingFullErr, null, 2));
  console.log('Full pending count:', pendingFull?.length);
  console.log('Full pending data:', JSON.stringify(pendingFull, null, 2));

  // ============================================================
  // STEP 9 — Check if 'due_date' column exists in assignments
  // ============================================================
  console.log('\n=== STEP 9: Assignments table — all columns ===');
  const { data: asgRaw, error: asgRawErr } = await supabaseAdmin
    .from('assignments')
    .select('*')
    .in('course_id', courseIds)
    .limit(1);
  console.log('Assignment raw error:', asgRawErr);
  if (asgRaw && asgRaw.length > 0) {
    console.log('Assignment columns:', Object.keys(asgRaw[0]));
    console.log('Assignment raw row:', JSON.stringify(asgRaw[0], null, 2));
  }

  // ============================================================
  // STEP 10 — Check assignment_submissions table — all columns
  // ============================================================
  console.log('\n=== STEP 10: assignment_submissions — all columns ===');
  const { data: subRaw, error: subRawErr } = await supabaseAdmin
    .from('assignment_submissions')
    .select('*')
    .in('assignment_id', asgIds)
    .limit(1);
  console.log('Submission raw error:', subRawErr);
  if (subRaw && subRaw.length > 0) {
    console.log('Submission columns:', Object.keys(subRaw[0]));
    console.log('Submission raw row:', JSON.stringify(subRaw[0], null, 2));
  }

  // ============================================================
  // STEP 11 — resolveInstructorProfileId simulation
  // ============================================================
  console.log('\n=== STEP 11: resolveInstructorProfileId simulation ===');
  // The auth user ID from supabase auth is ALSO beee4721... for pankaj
  // Check if profiles.id matches the auth user ID
  const { data: profileMatch } = await supabaseAdmin
    .from('profiles')
    .select('id, role, status, instructor_approval_status')
    .eq('id', INSTRUCTOR_ID)
    .eq('role', 'instructor')
    .maybeSingle();
  console.log('Profile match (must be non-null for instructor to be resolved):', JSON.stringify(profileMatch, null, 2));

  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
