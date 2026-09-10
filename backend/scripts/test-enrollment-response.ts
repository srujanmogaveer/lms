import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { supabaseAdmin } from '../src/config/supabase';
import { enrollmentService } from '../src/services/enrollment.service';

async function test() {
  const { data: instructors } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'instructor');

  for (const inst of instructors || []) {
    const res = await enrollmentService.getInstructorEnrollments(inst.id);
    if (res.students.length > 0) {
      console.log(`Instructor: ${inst.full_name} (${inst.id})`);
      console.log('Students count:', res.students.length);
      for (const s of res.students) {
        console.log({
          studentName: s.studentName,
          lastLogin: s.lastLogin,
          lastLessonCompleted: s.lastLessonCompleted,
          lastAssignmentSubmitted: s.lastAssignmentSubmitted,
          lastQuizAttempt: s.lastQuizAttempt,
        });
      }
    }
  }
}

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
