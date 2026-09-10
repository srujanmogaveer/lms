import { supabase } from '../lib/supabase';

/**
 * Uploads a profile avatar to Supabase Storage 'avatars' bucket.
 * Returns the public CDN URL of the uploaded image.
 *
 * The base64 fallback has been intentionally removed:
 * - Storing base64 Data URLs in the profiles.avatar_url DB column
 *   bloats each row to 30-100KB and causes localStorage quota errors
 *   if the profile is ever cached client-side.
 * - The 'avatars' bucket is now auto-created on server startup via
 *   StorageService.ensureAvatarsBucket() so a real CDN URL is
 *   always available.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Validate file format
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WEBP).');
  }

  // Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5 MB limit. Please choose a smaller image.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '31536000, immutable',
      upsert: true,
      contentType: file.type || 'image/png',
    });

  if (uploadError) {
    throw new Error(
      `Avatar upload failed: ${uploadError.message}. ` +
      `Ensure the Supabase Storage 'avatars' bucket exists and is publicly accessible.`
    );
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Avatar uploaded but failed to retrieve the public URL. Please try again.');
  }

  return data.publicUrl;
}

/**
 * Uploads a course thumbnail image via backend API (or Supabase Storage).
 * Returns the public CDN URL of the uploaded image.
 */
export async function uploadCourseThumbnail(courseIdOrSlug: string, file: File): Promise<string> {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WEBP).');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Thumbnail size exceeds 5 MB limit. Please choose a smaller image.');
  }

  // 1. Primary: Use dedicated backend upload API (which uses supabaseAdmin with bypass RLS)
  try {
    const { courseService } = await import('./courseService');
    const res = await courseService.uploadThumbnail(file, courseIdOrSlug);
    if (res.success && res.data?.thumbnailUrl) {
      return res.data.thumbnailUrl;
    }
  } catch (apiErr: any) {
    console.warn('Backend thumbnail upload endpoint warning:', apiErr?.message || apiErr);
  }

  // 2. Secondary fallback: direct Supabase storage
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `thumbnails/${courseIdOrSlug}-${Date.now()}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(filePath, file, {
        cacheControl: '31536000, immutable',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (!uploadError) {
      const { data } = supabase.storage.from('category-images').getPublicUrl(filePath);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch {
    // Continue to next fallback
  }

  // 3. Client-side Base64 fallback if storage/network is unavailable
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file data.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to process image file.'));
    reader.readAsDataURL(file);
  });
}

export interface UploadedAttachmentResult {
  id?: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'doc' | 'archive' | 'file';
  url: string;
  previewUrl?: string;
  storagePath: string;
}

/**
 * Uploads a file attachment for Chat to Supabase Storage 'chat-attachments' bucket.
 * Uses path structure: chat-attachments/{userId}/{conversationId}/{uniqueFileName}
 */
export async function uploadChatAttachment(
  userId: string,
  conversationId: string,
  file: File
): Promise<UploadedAttachmentResult> {
  const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 25 MB limit. Please select a smaller file.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Determine category and validate format
  let attType: 'image' | 'pdf' | 'doc' | 'archive' | 'file' = 'file';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) || file.type.startsWith('image/')) {
    attType = 'image';
  } else if (fileExt === 'pdf' || file.type === 'application/pdf') {
    attType = 'pdf';
  } else if (['doc', 'docx'].includes(fileExt) || file.type.includes('word')) {
    attType = 'doc';
  } else if (['zip'].includes(fileExt) || file.type.includes('zip')) {
    attType = 'archive';
  } else {
    throw new Error(
      `Unsupported file type ".${fileExt || 'unknown'}". Allowed formats: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, ZIP.`
    );
  }

  // Format readable size
  const formattedSize =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  // Unique storage path: {userId}/{conversationId}/att-{timestamp}-{random}.{ext}
  const cleanUserId = userId || 'anonymous';
  const cleanConvId = conversationId || 'general';
  const uniqueName = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storagePath = `${cleanUserId}/${cleanConvId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, file, {
      cacheControl: '31536000, immutable',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Attachment upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('chat-attachments').getPublicUrl(storagePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    throw new Error('Failed to generate public URL for attachment.');
  }

  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: file.name,
    size: formattedSize,
    type: attType,
    url: publicUrl,
    previewUrl: attType === 'image' ? publicUrl : undefined,
    storagePath,
  };
}

/**
 * Clean up an uploaded file from Supabase Storage if message creation fails
 */
export async function deleteChatAttachment(storagePath: string): Promise<void> {
  try {
    if (storagePath) {
      await supabase.storage.from('chat-attachments').remove([storagePath]);
    }
  } catch {
    // Ignore cleanup errors
  }
}

