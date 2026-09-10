import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/config/supabase';

const REQUIRED_BUCKETS = [
  { name: 'category-images', public: true },
  { name: 'lesson-documents', public: false },
  { name: 'lesson-resources', public: true },
  { name: 'assignment-submissions', public: false },
  { name: 'avatars', public: true },
  { name: 'chat-attachments', public: false },
];

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

async function restoreStorageFiles() {
  console.log('=== RESTORING SUPABASE STORAGE BUCKETS & FILES ===\n');

  const baseBackupDir = path.join(__dirname, '..', 'backups', 'storage_files');
  if (!fs.existsSync(baseBackupDir)) {
    console.error(`❌ Storage backup directory not found at: ${baseBackupDir}`);
    return;
  }

  // 1. Ensure all buckets exist
  const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
  const existingNames = new Set((existingBuckets || []).map(b => b.name));

  for (const b of REQUIRED_BUCKETS) {
    if (!existingNames.has(b.name)) {
      console.log(`Creating bucket [${b.name}] (public: ${b.public})...`);
      const { error } = await supabaseAdmin.storage.createBucket(b.name, {
        public: b.public,
      });
      if (error && !error.message.includes('already exists')) {
        console.warn(`  ⚠️ Could not create bucket [${b.name}]:`, error.message);
      } else {
        console.log(`  ✅ Bucket [${b.name}] created.`);
      }
    }
  }

  // 2. Upload all files
  const bucketDirs = fs.readdirSync(baseBackupDir);
  let totalUploaded = 0;

  for (const bucketName of bucketDirs) {
    const bucketPath = path.join(baseBackupDir, bucketName);
    if (!fs.statSync(bucketPath).isDirectory()) continue;

    const files = getFilesRecursively(bucketPath);
    console.log(`\nRestoring bucket [${bucketName}] (${files.length} files)...`);

    for (const fullPath of files) {
      const relativeStoragePath = path.relative(bucketPath, fullPath).replace(/\\/g, '/');
      const fileBuffer = fs.readFileSync(fullPath);

      const { error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(relativeStoragePath, fileBuffer, {
          upsert: true,
        });

      if (error) {
        console.warn(`  ⚠️ Failed uploading ${relativeStoragePath}:`, error.message);
      } else {
        console.log(`  ✅ Uploaded: ${bucketName}/${relativeStoragePath}`);
        totalUploaded++;
      }
    }
  }

  console.log(`\n🎉 Storage restore complete! Total files uploaded: ${totalUploaded}`);
}

restoreStorageFiles().catch(console.error);
