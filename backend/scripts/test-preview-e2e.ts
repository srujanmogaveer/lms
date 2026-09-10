/**
 * End-to-End Simulation: Student Uploads real PDF -> DB record created -> Instructor generates signed preview URL
 * npx tsx scripts/test-preview-e2e.ts
 */
import { supabaseAdmin } from '../src/config/supabase';
import { StorageService, ASSIGNMENT_SUBMISSIONS_BUCKET } from '../src/services/storage.service';
import { assignmentService } from '../src/services/assignment.service';

async function run() {
  const INSTRUCTOR_PROFILE_ID = 'beee4721-4ed9-40da-ad76-00025def32fa';
  const STUDENT_ID = '19fc47f3-109f-42b2-9f1d-b6bf8fb1b7de';
  const ASSIGNMENT_ID = '905b5ed6-7150-438e-8f69-aadc545ef362';

  console.log('=== Step 1: Ensure Storage Bucket Exists ===');
  await StorageService.ensureCurriculumBuckets();

  // Create a minimal test PDF buffer
  const samplePdfBytes = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 24 Tf 100 700 Td (Student Assignment Solution PDF) ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF'
  );

  const uniqueId = `${Date.now()}-real-Srujan_report.pdf`;
  const storageObjectPath = `${ASSIGNMENT_ID}/${uniqueId}`;

  console.log('\n=== Step 2: Upload real PDF to Storage ===');
  console.log('Target Bucket:', ASSIGNMENT_SUBMISSIONS_BUCKET);
  console.log('Target Path:', storageObjectPath);

  const { data: uploadData, error: upErr } = await supabaseAdmin.storage
    .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
    .upload(storageObjectPath, samplePdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (upErr) {
    console.error('Upload failed:', upErr);
    process.exit(1);
  }
  console.log('Upload success:', uploadData);

  console.log('\n=== Step 3: Update submission in DB with the real storage path ===');
  const { data: updatedSub, error: updateErr } = await supabaseAdmin
    .from('assignment_submissions')
    .update({
      file_url: storageObjectPath,
      submission_text: `[Attachment: ${uniqueId} (0.01 MB)]\nReal student PDF solution uploaded.`,
      updated_at: new Date().toISOString(),
    })
    .eq('assignment_id', ASSIGNMENT_ID)
    .eq('student_id', STUDENT_ID)
    .select('id, file_url, status')
    .single();

  if (updateErr) {
    console.error('Update failed:', updateErr);
    process.exit(1);
  }
  console.log('Updated submission:', updatedSub);

  console.log('\n=== Step 4: Call getSubmissionSignedFileUrl as Instructor ===');
  const preview = await assignmentService.getSubmissionSignedFileUrl(
    INSTRUCTOR_PROFILE_ID,
    updatedSub.id
  );

  console.log('\n=== PREVIEW RESULT ===');
  console.log('File Name:', preview.fileName);
  console.log('MIME Type:', preview.mimeType);
  console.log('Signed URL generated:', !!preview.signedUrl);
  console.log('Signed URL (snippet):', preview.signedUrl.substring(0, 120) + '...');

  // Test fetching from the signed URL
  console.log('\n=== Step 5: Test Fetch from Signed URL ===');
  const response = await fetch(preview.signedUrl);
  console.log('HTTP Status from Signed URL:', response.status, response.statusText);
  console.log('Content-Type header:', response.headers.get('content-type'));
  console.log('Content-Length:', response.headers.get('content-length'));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
