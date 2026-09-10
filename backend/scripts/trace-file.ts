/**
 * Diagnostic: Trace real submission file and storage existence
 * npx tsx scripts/trace-file.ts
 */
import { supabaseAdmin } from '../src/config/supabase';

async function trace() {
  const submissionId = '606a9495-845f-4d64-9279-f3c26b61485d';
  console.log('=== Step 1: Trace DB record ===');
  const { data: sub, error } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, file_url, submission_text, student_id, assignment_id')
    .eq('id', submissionId)
    .single();

  console.log('Submission DB record:', sub);
  console.log('File field: file_url');
  console.log('Stored value:', sub?.file_url);

  // Check all storage buckets and their files
  console.log('\n=== Step 2: Storage bucket inspection ===');
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  console.log('Available buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));

  for (const b of (buckets || [])) {
    console.log(`\n--- Inspecting Bucket: ${b.name} ---`);
    const { data: files, error: fErr } = await supabaseAdmin.storage.from(b.name).list('', { limit: 100 });
    console.log(`Root files in ${b.name}:`, files);
    
    // Check if there is an assignment folder
    if (sub?.assignment_id) {
      const { data: subFolder } = await supabaseAdmin.storage.from(b.name).list(sub.assignment_id, { limit: 100 });
      console.log(`Folder "${sub.assignment_id}" in ${b.name}:`, subFolder);
    }
    if (sub?.file_url) {
      const clean = sub.file_url.replace(/^[a-zA-Z0-9_-]+\//, '');
      const { data: signed1, error: sErr1 } = await supabaseAdmin.storage.from(b.name).createSignedUrl(sub.file_url, 60);
      console.log(`Signed URL for "${sub.file_url}" in ${b.name}:`, { signed: !!signed1?.signedUrl, err: sErr1?.message });
      const { data: signed2, error: sErr2 } = await supabaseAdmin.storage.from(b.name).createSignedUrl(clean, 60);
      console.log(`Signed URL for stripped "${clean}" in ${b.name}:`, { signed: !!signed2?.signedUrl, err: sErr2?.message });
    }
  }
}

trace().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
