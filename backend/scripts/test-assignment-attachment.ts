import { AssignmentService } from '../src/services/assignment.service';
import { supabaseAdmin } from '../src/config/supabase';

async function testAttachmentWorkflow() {
  console.log('Testing Assignment Attachment Workflow...');

  // 1. Find a test course
  const { data: courses, error: cErr } = await supabaseAdmin
    .from('courses')
    .select('id, instructor_id, title')
    .limit(1);

  if (cErr || !courses || courses.length === 0) {
    console.error('No courses found to test:', cErr);
    return;
  }

  const course = courses[0];
  console.log(`Using course "${course.title}" (${course.id}) with instructor ${course.instructor_id}`);

  // 2. Test packing and parsing attachment metadata
  const sampleAttachment = {
    url: 'https://example.com/starter-code-template.zip',
    name: 'starter-code-template.zip',
    size: '3.4 MB',
    type: 'archive',
  };

  const packed = AssignmentService.packInstructionsWithAttachment(
    '1. Follow instructions.\n2. Submit project.',
    sampleAttachment
  );

  console.log('Packed instructions:\n', packed);

  const parsed = AssignmentService.parseAttachmentMeta({
    instructions: packed,
  });

  console.log('Parsed attachment:', parsed);

  if (
    parsed.cleanInstructions === '1. Follow instructions.\n2. Submit project.' &&
    parsed.attachmentUrl === sampleAttachment.url &&
    parsed.attachmentName === sampleAttachment.name &&
    parsed.attachmentSize === sampleAttachment.size
  ) {
    console.log('✓ Attachment packing and parsing test passed successfully!');
  } else {
    throw new Error('Attachment parsing mismatch!');
  }

  console.log('All Assignment Attachment tests passed!');
}

testAttachmentWorkflow()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
