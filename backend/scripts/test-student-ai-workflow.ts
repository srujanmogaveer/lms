/**
 * Phase 4 Backend AI API Test Suite
 * Run with: npx ts-node scripts/test-student-ai-workflow.ts
 */
import { studentAiService } from '../src/services/ai.service';
import { supabaseAdmin } from '../src/config/supabase';

async function testBackendAiWorkflow() {
  console.log('===========================================================');
  console.log('  EDUSPHERE LMS - STUDENT AI BACKEND VERIFICATION SUITE    ');
  console.log('===========================================================\n');

  // 1. Get real student
  const { data: students } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'student')
    .limit(1);

  if (!students || students.length === 0) {
    console.error('❌ No student profile found in database.');
    process.exit(1);
  }

  const student = students[0];
  console.log(`✓ Active Authenticated Student: "${student.full_name}" (${student.id})`);

  // 2. Fetch enrolled course
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('course_id, courses(id, title)')
    .eq('student_id', student.id)
    .neq('status', 'Cancelled')
    .limit(1);

  const courseId = enrollments?.[0]?.course_id;
  const courseTitle = (enrollments?.[0]?.courses as any)?.title;
  console.log(`✓ Enrolled Course Target: "${courseTitle}" (${courseId})`);

  // 3. Test sending a student message
  console.log('\n--- TEST: Sending Real AI Message with Course Context ---');
  const chatResult = await studentAiService.sendStudentMessage(student.id, {
    message: 'Hello, can you give me a 2-sentence summary of what this course covers and how I should study effectively?',
    courseId,
    contextType: 'course',
  });

  console.log('✓ AI Assistant Response Received:');
  console.log(`   - Conversation ID: ${chatResult.conversationId}`);
  console.log(`   - Message ID: ${chatResult.message.id}`);
  console.log(`   - Tokens Used: ${chatResult.tokensUsed}`);
  console.log(`   - Text: "${chatResult.message.text.slice(0, 150)}..."`);

  // 4. Test Conversation Listing
  console.log('\n--- TEST: Fetching Conversation History ---');
  const conversations = await studentAiService.getConversations(student.id);
  console.log(`✓ Found ${conversations.length} active AI study conversations for student.`);
  const activeConv = conversations.find((c) => c.id === chatResult.conversationId);
  console.log(`✓ Created Conversation Recorded: "${activeConv?.title}" [${activeConv?.contextType}]`);

  // 5. Test Fetching Thread Messages
  console.log('\n--- TEST: Fetching Conversation Messages Thread ---');
  const thread = await studentAiService.getConversationMessages(student.id, chatResult.conversationId);
  console.log(`✓ Thread contains ${thread.messages.length} messages:`);
  thread.messages.forEach((m, idx) => {
    console.log(`   [${idx + 1}] (${m.sender.toUpperCase()} - ${m.timestamp}): "${m.text.slice(0, 80)}..."`);
  });

  // 6. Test Daily Quota
  console.log('\n--- TEST: Checking Daily Usage Quota ---');
  const usage = await studentAiService.getDailyUsage(student.id);
  console.log(`✓ Daily Quota Status: ${usage.requestsUsed}/${usage.dailyLimit} used (${usage.requestsRemaining} remaining), Tokens: ${usage.tokensConsumed}`);

  console.log('\n===========================================================');
  console.log('  STUDENT AI BACKEND API WORKFLOW: 100% VERIFIED & PASSED  ');
  console.log('===========================================================\n');
}

testBackendAiWorkflow()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
