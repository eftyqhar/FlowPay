import { supabase } from './supabase';

/**
 * Resize and center-crop an image file into a square avatar data URL.
 * Automatically reduces file size to ~15-30KB while preserving high visual quality.
 */
export function processImageFile(
  file: File,
  maxDimension = 320,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file must be an image (PNG, JPG, WebP, GIF)'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file size must be less than 5 MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Perform a square center crop
        const minEdge = Math.min(width, height);
        const startX = (width - minEdge) / 2;
        const startY = (height - minEdge) / 2;

        const targetSize = Math.min(maxDimension, minEdge);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize canvas context'));
          return;
        }

        // Draw image centered and square cropped
        ctx.drawImage(
          img,
          startX,
          startY,
          minEdge,
          minEdge,
          0,
          0,
          targetSize,
          targetSize
        );

        // Export as WebP if supported, otherwise JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // fallback to jpeg
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };

      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a profile avatar.
 * Converts to optimized data URL, attempts Supabase Storage upload, and falls back gracefully.
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  const optimizedDataUrl = await processImageFile(file, 320, 0.88);

  // Attempt to upload to Supabase Storage if bucket is reachable
  try {
    // Convert data URL to Blob
    const res = await fetch(optimizedDataUrl);
    const blob = await res.blob();
    const fileExt = 'webp';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Storage upload fallback to Data URL:', err);
  }

  // Graceful fallback: return the high-efficiency compressed Data URL directly
  return optimizedDataUrl;
}
