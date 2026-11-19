/**
 * Compresses uploaded raster image data URLs so they always fit comfortably
 * within Firestore's 1MB per-document ceiling and load reliably everywhere.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxBytes = 680_000,
  maxDimension = 1600
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  // Leave small images and SVGs untouched
  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.length <= maxBytes) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const isPng = dataUrl.startsWith('data:image/png');
      let result = canvas.toDataURL(isPng ? 'image/webp' : 'image/jpeg', 0.85);
      if (result.length > maxBytes) {
        result = canvas.toDataURL('image/jpeg', 0.72);
      }
      if (result.length > maxBytes) {
        const scaleCanvas = document.createElement('canvas');
        scaleCanvas.width = Math.max(1, Math.round(width * 0.7));
        scaleCanvas.height = Math.max(1, Math.round(height * 0.7));
        const sctx = scaleCanvas.getContext('2d');
        if (sctx) {
          sctx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
          result = scaleCanvas.toDataURL('image/jpeg', 0.72);
        }
      }

      resolve(result.length < dataUrl.length ? result : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function readAndCompressFile(
  file: File,
  maxBytes = 680_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = typeof reader.result === 'string' ? reader.result : '';
        if (!raw) {
          reject(new Error('Failed to read image file.'));
          return;
        }
        const compressed = await compressImageDataUrl(raw, maxBytes);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
