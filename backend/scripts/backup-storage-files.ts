import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/config/supabase';

async function listAllFilesRecursively(bucket: string, folder: string = ''): Promise<string[]> {
  const filePaths: string[] = [];
  const { data: items, error } = await supabaseAdmin.storage.from(bucket).list(folder, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !items) return filePaths;

  for (const item of items) {
    if (item.name === '.emptyFolderPlaceholder') continue;
    const currentPath = folder ? `${folder}/${item.name}` : item.name;
    // item.id === null usually indicates a folder in Supabase storage
    if (item.id === null || !item.metadata) {
      const nestedFiles = await listAllFilesRecursively(bucket, currentPath);
      filePaths.push(...nestedFiles);
    } else {
      filePaths.push(currentPath);
    }
  }

  return filePaths;
}

async function backupStorageFiles() {
  console.log('=== STARTING SUPABASE STORAGE FILES RECURSIVE BACKUP ===\n');

  const baseBackupDir = path.join(__dirname, '..', 'backups', 'storage_files');
  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }

  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) {
    console.error('❌ Failed to fetch storage buckets:', bErr.message);
    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log('ℹ️ No storage buckets found.');
    return;
  }

  console.log(`Found ${buckets.length} bucket(s):`, buckets.map(b => b.name).join(', '));
  let totalFilesDownloaded = 0;

  for (const bucket of buckets) {
    console.log(`\nScanning bucket: [${bucket.name}]...`);
    const allPaths = await listAllFilesRecursively(bucket.name);

    if (allPaths.length === 0) {
      console.log(`  ℹ️ Bucket [${bucket.name}] has no files.`);
      continue;
    }

    console.log(`  Found ${allPaths.length} file(s) in [${bucket.name}]. Downloading...`);

    for (const filePath of allPaths) {
      try {
        const { data: fileBlob, error: dErr } = await supabaseAdmin.storage
          .from(bucket.name)
          .download(filePath);

        if (dErr || !fileBlob) {
          console.warn(`  ⚠️ Failed to download "${filePath}":`, dErr?.message);
          continue;
        }

        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const localFilePath = path.join(baseBackupDir, bucket.name, filePath);
        const localDir = path.dirname(localFilePath);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        fs.writeFileSync(localFilePath, buffer);
        console.log(`  ✅ Downloaded: ${bucket.name}/${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        totalFilesDownloaded++;
      } catch (e: any) {
        console.warn(`  ⚠️ Error saving ${filePath}:`, e?.message);
      }
    }
  }

  console.log(`\n🎉 Storage backup complete! Total files saved: ${totalFilesDownloaded}`);
  console.log(`📁 Local storage folder: ${baseBackupDir}`);
}

backupStorageFiles().catch(console.error);
