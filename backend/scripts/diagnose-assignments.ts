/**
 * Diagnostic script: Test the instructor assignment API directly.
 * Run with: npx tsx scripts/diagnose-assignments.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function diagnose() {
  console.log('=== STEP 1: Find all instructor profiles ===');
  const { data: instructors, error: instErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, status, instructor_approval_status')
    .eq('role', 'instructor');

  if (instErr) {
    console.error('Error fetching instructors:', instErr);
    return;
  }

  console.log('Instructors found:', instructors?.length || 0);
  instructors?.forEach((i) => {
    console.log(`  ID: ${i.id}, Name: ${i.full_name}, Email: ${i.email}, Status: ${i.status}, Approval: ${i.instructor_approval_status}`);
  });

  for (const instructor of (instructors || [])) {
    console.log(`\n=== STEP 2: Courses for instructor ${instructor.full_name} (${instructor.id}) ===`);
    const { data: courses, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, course_status, instructor_id')
      .eq('instructor_id', instructor.id);

    if (courseErr) {
      console.error('  Error fetching courses:', courseErr);
      continue;
    }

    console.log(`  Courses found: ${courses?.length || 0}`);
    courses?.forEach((c) => {
      console.log(`    Course ID: ${c.id}, Title: "${c.title}", Status: ${c.course_status}, instructor_id: ${c.instructor_id}`);
    });

    if (!courses || courses.length === 0) continue;

    const courseIds = courses.map((c) => c.id);

    console.log(`\n=== STEP 3: Assignments in those courses ===`);
    const { data: assignments, error: asgErr } = await supabaseAdmin
      .from('assignments')
      .select('id, title, course_id, status, created_at')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (asgErr) {
      console.error('  Error fetching assignments:', asgErr);
      continue;
    }

    console.log(`  Assignments found: ${assignments?.length || 0}`);
    assignments?.forEach((a) => {
      console.log(`    Assignment ID: ${a.id}, Title: "${a.title}", CourseID: ${a.course_id}, Status: ${a.status}`);
    });

    console.log(`\n=== STEP 4: Submissions for those assignments ===`);
    if (assignments && assignments.length > 0) {
      const asgIds = assignments.map((a) => a.id);
      const { data: submissions, error: subErr } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id, assignment_id, student_id, status, score, submitted_at')
        .in('assignment_id', asgIds);

      if (subErr) {
        console.error('  Error fetching submissions:', subErr);
      } else {
        console.log(`  Submissions found: ${submissions?.length || 0}`);
        submissions?.forEach((s) => {
          console.log(`    Sub ID: ${s.id}, AssignmentID: ${s.assignment_id}, StudentID: ${s.student_id}, Status: ${s.status}, Score: ${s.score}`);
        });

        const pending = (submissions || []).filter(
          (s) => s.status === 'Submitted' || s.status === 'Under Review'
        );
        console.log(`  Pending (ungraded) submissions: ${pending.length}`);
      }
    }
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

diagnose()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Diagnostic script failed:', err);
    process.exit(1);
  });
