export interface ImageCompressOptions {
  maxDimension?: number;
  quality?: number;
  maxSourceBytes?: number;
}

/**
 * Reads an image File selected by the user (from device gallery, file picker, or mobile camera)
 * and resizes/compresses it via HTML5 Canvas into a compact JPEG Data URL so it fits reliably
 * in browser/WebView localStorage and renders immediately everywhere.
 */
export async function compressAndReadImageFile(
  file: File,
  options: ImageCompressOptions = {}
): Promise<string> {
  const {
    maxDimension = 840,
    quality = 0.82,
    maxSourceBytes = 20 * 1024 * 1024, // 20 MB guard
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('INVALID_TYPE');
  }

  if (file.size > maxSourceBytes) {
    throw new Error('FILE_TOO_LARGE');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('READ_FAILED'));
      }
    };
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });

  // Load into Image for resizing & JPEG compression
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('DECODE_FAILED'));
      image.src = rawDataUrl;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      return rawDataUrl;
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return rawDataUrl;
    }

    // Fill white background so transparent PNGs convert cleanly to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    if (compressed && compressed.startsWith('data:image/')) {
      return compressed;
    }
    return rawDataUrl;
  } catch {
    // Fallback to raw data URL if small enough (< 1.5 MB)
    if (rawDataUrl.length < 2_000_000) {
      return rawDataUrl;
    }
    throw new Error('DECODE_FAILED');
  }
}
