import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/config/supabase';
import { curriculumService } from '../src/services/curriculum.service';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🔄 Checking / Applying Migration 004 in Supabase...');
  const migrationPath = path.join(__dirname, '../supabase/migrations/004_create_curriculum_and_content.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Check if course_modules table exists
  const { error: testErr } = await supabaseAdmin.from('course_modules').select('id').limit(1);
  if (testErr && testErr.message.includes('relation "course_modules" does not exist')) {
    console.log('⚡ Executing migration 004_create_curriculum_and_content.sql...');
    // We can execute SQL statements through Supabase RPC or direct client
    // Let's verify if postgres function exec_sql exists, or we use rpc
    const { error: rpcErr } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (rpcErr) {
      console.warn('⚠️ Could not run via rpc(exec_sql):', rpcErr.message);
    }
  } else {
    console.log('✅ Table `course_modules` is already accessible in Supabase.');
  }
}

async function runAll17Tests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING 17 VERIFICATION TESTS FOR CURRICULUM & CONTENT');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    await runMigration();

    // 1. Setup Test Instructor Profile and Course
    console.log('\n--- Setup Test Data ---');
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    const testInstructorEmail = `instructor_${randomSuffix}@edusphere.local`;
    const otherInstructorEmail = `other_inst_${randomSuffix}@edusphere.local`;

    const testAuth = await supabaseAdmin.auth.admin.createUser({
      email: testInstructorEmail,
      password: 'Password123!Secure',
      email_confirm: true,
      user_metadata: { full_name: 'Main Test Instructor', role: 'instructor' },
    });

    if (testAuth.error || !testAuth.data.user) {
      throw new Error(`Failed to create test instructor: ${testAuth.error?.message}`);
    }
    const testInstructorId = testAuth.data.user.id;

    // Ensure instructor profile is approved and active
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'instructor', status: 'active', instructor_approval_status: 'approved' })
      .eq('id', testInstructorId);

    const otherAuth = await supabaseAdmin.auth.admin.createUser({
      email: otherInstructorEmail,
      password: 'Password123!Secure',
      email_confirm: true,
      user_metadata: { full_name: 'Other Instructor', role: 'instructor' },
    });
    const otherInstructorId = otherAuth.data.user?.id || 'other-id';
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'instructor', status: 'active', instructor_approval_status: 'approved' })
      .eq('id', otherInstructorId);

    // Fetch or create a category
    let { data: cat } = await supabaseAdmin.from('categories').select('id').limit(1).single();
    if (!cat) {
      const { data: newCat } = await supabaseAdmin.from('categories').insert({ name: 'Curriculum Dev', slug: `curriculum-dev-${Date.now()}` }).select().single();
      cat = newCat;
    }

    // Create test course
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .insert({
        instructor_id: testInstructorId,
        category_id: cat?.id,
        title: 'Mastering Advanced Curriculum & Content Architecture',
        slug: `mastering-curriculum-${Date.now()}`,
        short_description: 'Test course for curriculum and content management verification.',
        course_status: 'Published',
        approval_status: 'Approved',
        lessons_count: 0,
        duration_hours: 0,
      })
      .select()
      .single();

    if (courseErr || !course) {
      throw new Error(`Failed to create test course: ${courseErr?.message}`);
    }
    const courseId = course.id;
    console.log(`Created test course: ${course.title} (ID: ${courseId})`);

    // TEST 0: Instructor profile resolution (profiles.id = auth.uid() and role = 'instructor')
    console.log('\n--- Running Tests: Instructor Profile Resolution ---');
    const resolvedProfileId = await curriculumService.resolveInstructorProfileId(testInstructorId);
    assert(resolvedProfileId === testInstructorId, `Test 0: Resolve instructor profile via profiles.id = auth.uid() (resolved: ${resolvedProfileId})`);

    // TEST 1: Module creation with title and description
    console.log('\n--- Running Tests 1 to 7: Module Lifecycle & Ordering ---');
    const mod1 = await curriculumService.createModule(testInstructorId, courseId, {
      title: 'Module 1: Introduction to Framework',
      description: 'Foundations and concepts',
    });
    assert(mod1.title === 'Module 1: Introduction to Framework' && mod1.position === 1, 'Test 1: Module creation with title and description');

    // TEST 2: Module position auto-increment
    const mod2 = await curriculumService.createModule(testInstructorId, courseId, {
      title: 'Module 2: Advanced Topics',
      description: 'Deep dives and patterns',
    });
    const mod3 = await curriculumService.createModule(testInstructorId, courseId, {
      title: 'Module 3: Production Deployment',
      description: 'CI/CD and monitoring',
    });
    assert(mod2.position === 2 && mod3.position === 3, 'Test 2: Module position auto-increment (1 -> 2 -> 3)');

    // TEST 3: Module reordering (contiguous positions 1, 2, 3...)
    const reorderedMods = await curriculumService.reorderModules(testInstructorId, courseId, [
      { id: mod3.id, position: 1 },
      { id: mod1.id, position: 2 },
      { id: mod2.id, position: 3 },
    ]);
    const p1 = reorderedMods.find((m) => m.id === mod3.id)?.position;
    const p2 = reorderedMods.find((m) => m.id === mod1.id)?.position;
    const p3 = reorderedMods.find((m) => m.id === mod2.id)?.position;
    assert(p1 === 1 && p2 === 2 && p3 === 3, 'Test 3: Module reordering with contiguous positions');

    // TEST 4: Module update (title/description)
    const updatedMod1 = await curriculumService.updateModule(testInstructorId, mod1.id, {
      title: 'Module 1: Modern Fundamentals Updated',
      description: 'Updated description for module 1',
    });
    assert(updatedMod1.title === 'Module 1: Modern Fundamentals Updated', 'Test 4: Module title and description update');

    // TEST 5, 6, 7: Cascade and Reorder on Module Delete
    // Add lessons to mod3 first so we can verify cascade deletion
    const lesForMod3 = await curriculumService.createLesson(testInstructorId, mod3.id, {
      title: 'Temporary Lesson to be cascaded',
      lessonType: 'Video',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 30,
    });

    await curriculumService.deleteModule(testInstructorId, mod3.id);
    const { data: cascadedLessons } = await supabaseAdmin.from('lessons').select('*').eq('id', lesForMod3.id);
    assert(cascadedLessons?.length === 0, 'Test 5: Module deletion cascades and removes child lessons');

    const remainingMods = await curriculumService.getInstructorCourseModules(testInstructorId, courseId);
    const hasMod1 = remainingMods.some((m) => m.id === mod1.id && m.position === 1);
    const hasMod2 = remainingMods.some((m) => m.id === mod2.id && m.position === 2);
    assert(remainingMods.length === 2 && hasMod1 && hasMod2, 'Test 6: Module deletion recalculates contiguous positions for remaining modules (1, 2)');

    // Reset module order back for subsequent tests
    const activeMod = mod1;

    console.log('\n--- Running Tests 8 to 11: All 4 Lesson Content Types ---');
    // TEST 8: Lesson creation with lessonType = 'Video'
    const lesVideo = await curriculumService.createLesson(testInstructorId, activeMod.id, {
      title: 'Deep Dive into React 19 Compiler',
      shortDescription: 'Comprehensive video lecture on compiler internals',
      lessonType: 'Video',
      videoUrl: 'https://www.youtube.com/watch?v=8pDqJVdNa44',
      durationMinutes: 45,
      isPreview: true,
    });
    assert(lesVideo.lessonType === 'Video' && Boolean(lesVideo.videoUrl?.includes('youtube')), 'Test 8: Lesson creation with lessonType = Video & videoUrl');

    // TEST 9: Lesson creation with lessonType = 'PDF'
    const lesPdf = await curriculumService.createLesson(testInstructorId, activeMod.id, {
      title: 'Architecture Blueprint Document',
      shortDescription: 'Official PDF specification guide',
      lessonType: 'PDF',
      documentUrl: 'https://example.supabase.co/storage/v1/object/public/lesson-documents/blueprint.pdf',
      durationMinutes: 20,
      isPreview: false,
    });
    assert(lesPdf.lessonType === 'PDF' && Boolean(lesPdf.documentUrl?.endsWith('.pdf')), 'Test 9: Lesson creation with lessonType = PDF & documentUrl');

    // TEST 10: Lesson creation with lessonType = 'Text'
    const lesText = await curriculumService.createLesson(testInstructorId, activeMod.id, {
      title: 'Modern State Management Comparison',
      shortDescription: 'Technical reading guide',
      lessonType: 'Text',
      content: '# State Management Guide\n\nDetailed breakdown of React 19 actions, Zustand, and Server State.',
      durationMinutes: 15,
      isPreview: false,
    });
    assert(lesText.lessonType === 'Text' && Boolean(lesText.content?.includes('# State Management Guide')), 'Test 10: Lesson creation with lessonType = Text & article content');

    // TEST 11: Lesson creation with lessonType = 'Resource'
    const lesResource = await curriculumService.createLesson(testInstructorId, activeMod.id, {
      title: 'Starter Code & Asset Bundle',
      shortDescription: 'Zip archive containing exercise source code',
      lessonType: 'Resource',
      resourceUrl: 'https://example.supabase.co/storage/v1/object/public/lesson-resources/starter-kit.zip',
      durationMinutes: 10,
      isPreview: false,
    });
    assert(lesResource.lessonType === 'Resource' && Boolean(lesResource.resourceUrl?.endsWith('.zip')), 'Test 11: Lesson creation with lessonType = Resource & resourceUrl');

    console.log('\n--- Running Tests 12 to 16: Lesson Lifecycle, Positions & Metrics ---');
    // TEST 12: Lesson update (title, duration, content)
    const updatedLesText = await curriculumService.updateLesson(testInstructorId, lesText.id, {
      title: 'Modern State Management Comparison (2026 Edition)',
      durationMinutes: 25,
      content: '# State Management Guide (Updated Edition)',
    });
    assert(updatedLesText.title.includes('2026 Edition') && updatedLesText.durationMinutes === 25, 'Test 12: Lesson update modifies title, duration, and content');

    // TEST 13: Lesson position auto-increment within module
    const allModLessons = await curriculumService.getInstructorModuleLessons(testInstructorId, activeMod.id);
    const positions = allModLessons.map((l) => l.position).sort((a, b) => a - b);
    assert(positions.join(',') === '1,2,3,4', `Test 13: Lesson position auto-increment within module (found: ${positions.join(',')})`);

    // TEST 14: Lesson reordering within module
    const reorderedLessons = await curriculumService.reorderLessons(testInstructorId, activeMod.id, [
      { id: lesResource.id, position: 1 },
      { id: lesText.id, position: 2 },
      { id: lesPdf.id, position: 3 },
      { id: lesVideo.id, position: 4 },
    ]);
    const lp1 = reorderedLessons.find((l) => l.id === lesResource.id)?.position;
    const lp4 = reorderedLessons.find((l) => l.id === lesVideo.id)?.position;
    assert(lp1 === 1 && lp4 === 4, 'Test 14: Lesson reordering with contiguous positions 1, 2, 3, 4 within module');

    // TEST 15 & 16: Course Metrics recalculation accuracy (lessons_count, duration_hours)
    // Currently we have: 45 + 20 + 25 + 10 = 100 minutes. 100 / 60 = 1.67 hours. 4 lessons.
    const { data: courseMetricsBefore } = await supabaseAdmin
      .from('courses')
      .select('lessons_count, duration_hours')
      .eq('id', courseId)
      .single();

    assert(
      courseMetricsBefore?.lessons_count === 4 && Number(courseMetricsBefore?.duration_hours) === 1.67,
      `Test 16: Recalculate metrics trigger accuracy (lessons: ${courseMetricsBefore?.lessons_count}, duration: ${courseMetricsBefore?.duration_hours}h)`
    );

    // Delete 1 lesson and check metrics update
    await curriculumService.deleteLesson(testInstructorId, lesResource.id);
    const { data: courseMetricsAfter } = await supabaseAdmin
      .from('courses')
      .select('lessons_count, duration_hours')
      .eq('id', courseId)
      .single();

    // After deleting 10 min lesson: remaining 3 lessons, 90 mins -> 1.50 hours
    assert(
      courseMetricsAfter?.lessons_count === 3 && Number(courseMetricsAfter?.duration_hours) === 1.5,
      `Test 15: Lesson deletion triggers course metrics recalculation (remaining lessons: ${courseMetricsAfter?.lessons_count}, duration: ${courseMetricsAfter?.duration_hours}h)`
    );

    console.log('\n--- Running Test 17: Security & Ownership Protection ---');
    // TEST 17.1: Instructor B cannot create module in Instructor A's course
    let caughtOtherInst = false;
    try {
      await curriculumService.createModule(otherInstructorId, courseId, {
        title: 'Intruder Module',
      });
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes('permission')) {
        caughtOtherInst = true;
      }
    }
    assert(caughtOtherInst, 'Test 17.1: Instructor B cannot create module in Instructor A course');

    // TEST 17.2: Student cannot manage curriculum
    const testStudentAuth = await supabaseAdmin.auth.admin.createUser({
      email: `student_${randomSuffix}@edusphere.local`,
      password: 'Password123!Secure',
      email_confirm: true,
      user_metadata: { full_name: 'Test Student', role: 'student' },
    });
    const testStudentId = testStudentAuth.data.user?.id || 'std-test-id';
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'student', status: 'active' })
      .eq('id', testStudentId);

    let caughtStudent = false;
    try {
      await curriculumService.resolveInstructorProfileId(testStudentId);
    } catch (err: any) {
      if (err.statusCode === 403 && err.message.includes('Only instructors')) {
        caughtStudent = true;
      }
    }
    assert(caughtStudent, 'Test 17.2: Student cannot manage curriculum (Only instructors can manage curriculum)');

    // TEST 17.3: Non-existent course throws "Course not found"
    let caughtNotFound = false;
    try {
      await curriculumService.createModule(testInstructorId, '00000000-0000-0000-0000-000000000000', {
        title: 'Ghost Module',
      });
    } catch (err: any) {
      if (err.statusCode === 404 && err.message.includes('Course not found')) {
        caughtNotFound = true;
      }
    }
    assert(caughtNotFound, 'Test 17.3: Non-existent course throws "Course not found"');

    // TEST 17.4: Instructor ownership security on update
    let caughtUnauthorized = false;
    try {
      await curriculumService.updateModule(otherInstructorId, activeMod.id, {
        title: 'Malicious Hijack Attempt',
      });
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes('Forbidden') || err.message.includes('permission')) {
        caughtUnauthorized = true;
      }
    }
    assert(caughtUnauthorized, 'Test 17.4: Security ownership validation prohibits modifying another instructor’s curriculum');

    // Public curriculum access check
    const publicCurriculum = await curriculumService.getCourseCurriculum(course.slug);
    assert(
      publicCurriculum.courseId === courseId && publicCurriculum.modules.length > 0,
      'Bonus Verification: Public student curriculum endpoint serves structured course syllabus'
    );

    await supabaseAdmin.auth.admin.deleteUser(testStudentId);

    // Cleanup test data
    console.log('\n--- Cleaning up test artifacts ---');
    await supabaseAdmin.from('courses').delete().eq('id', courseId);
    await supabaseAdmin.auth.admin.deleteUser(testInstructorId);
    await supabaseAdmin.auth.admin.deleteUser(otherInstructorId);
    console.log('Cleanup completed.');

  } catch (error: any) {
    console.error('❌ Test suite fatal error:', error);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll17Tests();
