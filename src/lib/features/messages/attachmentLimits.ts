export const MAX_PHOTO_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_STORED_PHOTO_BYTES = 1024 * 1024;

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_EXTENSION = /\.(mp4|webm|mov|mkv|avi|m4v)$/i;

export function rejectOutgoingAttachment(file: {
  type: string;
  size: number;
  name?: string;
}): string | null {
  const type = file.type.toLowerCase();

  if (type.startsWith('video/') || (file.name && VIDEO_EXTENSION.test(file.name))) {
    return 'Videos are not supported yet.';
  }

  if (type.startsWith('image/')) {
    if (!PHOTO_TYPES.has(type)) {
      return 'Use a JPEG, PNG, or WebP photo.';
    }

    if (file.size > MAX_PHOTO_INPUT_BYTES) {
      return 'Photos must be 10MB or smaller.';
    }

    return null;
  }

  if (file.size > MAX_FILE_BYTES) {
    return 'Files must be 10MB or smaller.';
  }

  return null;
}

export function compressChatPhoto(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxEdge = 1280;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Could not process image.'));
          return;
        }

        context.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not process image.'));
              return;
            }

            if (blob.size > MAX_STORED_PHOTO_BYTES) {
              reject(new Error('That photo is still over 1MB after resizing.'));
              return;
            }

            const stem = file.name.replace(/\.[^.]+$/, '') || 'photo';
            resolve(new File([blob], `${stem}.jpg`, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Could not load image.'));
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };

    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}
