import { supabaseAdmin } from '../src/config/supabase';

interface BucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}

const REQUIRED_BUCKETS: BucketConfig[] = [
  {
    name: 'avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    name: 'category-images',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    name: 'chat-attachments',
    public: true,
    fileSizeLimit: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
    ],
  },
  {
    name: 'assignment-submissions',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  },
  {
    name: 'lesson-documents',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  },
  {
    name: 'lesson-resources',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  },
];

async function setupStorage() {
  console.log('Checking and auto-creating all Supabase Storage Buckets...\n');

  const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error('Failed to list buckets:', listError.message);
    process.exit(1);
  }

  const existingNames = new Set(existingBuckets?.map((b) => b.name) || []);
  console.log('Existing buckets found:', Array.from(existingNames));

  for (const bucket of REQUIRED_BUCKETS) {
    if (existingNames.has(bucket.name)) {
      // Update bucket to ensure it is public
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (updateError) {
        console.log(`Bucket '${bucket.name}' exists (update status: ${updateError.message})`);
      } else {
        console.log(`Bucket '${bucket.name}' updated to Public successfully!`);
      }
    } else {
      // Create bucket
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (createError) {
        console.error(`Failed to create bucket '${bucket.name}':`, createError.message);
      } else {
        console.log(`Created bucket '${bucket.name}' (Public: ${bucket.public}) successfully!`);
      }
    }
  }

  console.log('\nALL STORAGE BUCKETS ARE CONFIGURED AND READY!\n');
}

setupStorage().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
