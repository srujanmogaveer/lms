/**
 * Check RLS policies on assignment-submissions bucket and test upload/download
 */
import { supabaseAdmin } from '../src/config/supabase';

async function check() {
  const BUCKET = 'assignment-submissions';

  // List bucket policies
  console.log('=== Bucket details ===');
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucket = buckets?.find(b => b.name === BUCKET);
  console.log('Bucket config:', JSON.stringify(bucket, null, 2));

  // Test upload as admin (this will succeed — proves bucket exists)
  console.log('\n=== Test admin upload ===');
  const testContent = Buffer.from('test pdf content');
  const testPath = 'test/admin-test.txt';
  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(testPath, testContent, { upsert: true });
  console.log('Admin upload error:', upErr);

  if (!upErr) {
    // Generate signed URL
    const { data: signedData, error: signErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(testPath, 60);
    console.log('Signed URL error:', signErr);
    console.log('Signed URL:', signedData?.signedUrl?.substring(0, 100) + '...');

    // Cleanup
    await supabaseAdmin.storage.from(BUCKET).remove([testPath]);
    console.log('Test file cleaned up.');
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
