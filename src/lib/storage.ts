import { supabase } from './supabase';

export type StorageBucket = 'Profile_Picture' | 'Documents';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns The public URL and storage path of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: StorageBucket,
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload profile picture
 * @param file - The image file
 * @param userId - The user's ID
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<UploadResult> {
  const validation = validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg']);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return uploadFile(file, 'Profile_Picture', userId);
}

/**
 * Upload document
 * @param file - The document file
 * @param userId - The user's ID
 * @param documentType - Type of document (citizenship, mbbs, md)
 */
export async function uploadDocument(
  file: File,
  userId: string,
  documentType: string
): Promise<UploadResult> {
  const validation = validateFile(file, 10, [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ]);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return uploadFile(file, 'Documents', `${userId}/${documentType}`);
}
