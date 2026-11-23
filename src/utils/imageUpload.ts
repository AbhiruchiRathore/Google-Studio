export interface ImageCompressOptions {
  maxDimension?: number;
  quality?: number;
  maxSourceBytes?: number;
  maxOutputChars?: number;
}

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|svg)$/i;
const KNOWN_NON_IMAGE_EXT_REGEX =
  /\.(pdf|txt|csv|json|xml|html?|mp4|mov|avi|mkv|webm|mp3|wav|m4a|aac|zip|rar|7z|apk|docx?|xlsx?|pptx?)$/i;
const SAFE_RASTER_DATA_URL_REGEX = /^data:image\/(jpe?g|png|webp|gif|bmp|avif);/i;
const DEFAULT_MAX_OUTPUT_CHARS = 260_000;

function isLikelyImageFile(file: File): boolean {
  const mime = (file.type || '').trim().toLowerCase();
  if (mime.startsWith('image/')) return true;

  // Android Photo Picker / content:// URIs often omit file.type or report application/octet-stream
  // with extensionless numeric document names (e.g. "1000045123").
  // Reject explicit non-image MIME types or obvious non-image file extensions, and let Image decoding verify the rest.
  if (!mime || mime === 'application/octet-stream') {
    const name = (file.name || '').trim();
    if (!name || IMAGE_EXT_REGEX.test(name)) return true;
    if (KNOWN_NON_IMAGE_EXT_REGEX.test(name)) return false;
    return !name.includes('.');
  }

  return false;
}

async function compressImageElement(
  img: HTMLImageElement,
  rawDataUrl: string,
  maxDimension: number,
  quality: number
): Promise<string> {
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
}

/**
 * Reads an image File selected by the user (from device gallery, file picker, or mobile camera)
 * and resizes/compresses it via HTML5 Canvas into a compact JPEG Data URL guaranteed to fit
 * in browser/WebView localStorage and Cloud Firestore documents across Android, iOS, and Web.
 */
export async function compressAndReadImageFile(
  file: File,
  options: ImageCompressOptions = {}
): Promise<string> {
  const {
    maxDimension = 840,
    quality = 0.82,
    maxSourceBytes = 20 * 1024 * 1024, // 20 MB guard
    maxOutputChars = DEFAULT_MAX_OUTPUT_CHARS,
  } = options;

  if (!isLikelyImageFile(file)) {
    throw new Error('INVALID_TYPE');
  }

  if (file.size <= 0) {
    throw new Error('DECODE_FAILED');
  }

  if (file.size > maxSourceBytes) {
    throw new Error('FILE_TOO_LARGE');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error('READ_FAILED'));
      }
    };
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });

  // Load into Image for decoding, resizing & JPEG compression
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('DECODE_FAILED'));
      image.src = rawDataUrl;
    });

    const attempts: Array<{ dim: number; q: number }> = [
      { dim: maxDimension, q: quality },
      { dim: Math.min(640, maxDimension), q: Math.min(0.72, quality) },
      { dim: Math.min(480, maxDimension), q: 0.62 },
      { dim: 360, q: 0.52 },
    ];

    let bestResult = rawDataUrl;
    for (const attempt of attempts) {
      try {
        const candidate = await compressImageElement(img, rawDataUrl, attempt.dim, attempt.q);
        bestResult = candidate;
        if (candidate.length <= maxOutputChars) {
          return candidate;
        }
      } catch {
        // try smaller attempt on constrained WebView memory
      }
    }

    if (SAFE_RASTER_DATA_URL_REGEX.test(bestResult) && bestResult.length <= 340_000) {
      return bestResult;
    }
    throw new Error('FILE_TOO_LARGE');
  } catch (err) {
    if (err instanceof Error && err.message === 'FILE_TOO_LARGE') {
      throw err;
    }
    // Fallback to raw data URL only if it is a safe raster image payload within size limits
    if (SAFE_RASTER_DATA_URL_REGEX.test(rawDataUrl) && rawDataUrl.length < 340_000) {
      return rawDataUrl;
    }
    throw new Error('DECODE_FAILED');
  }
}

export function formatImageUploadError(
  err: unknown,
  t: (en: string, hi: string) => string
): string {
  const code = err instanceof Error ? err.message : '';
  if (code === 'INVALID_TYPE') {
    return t(
      'Please choose a valid image file (JPG, PNG, or WEBP).',
      'कृपया एक मान्य फोटो फ़ाइल चुनें (JPG, PNG या WEBP)।'
    );
  }
  if (code === 'FILE_TOO_LARGE') {
    return t(
      'Image file is too large (max 20 MB). Please pick a smaller photo.',
      'फ़ोटो का आकार बहुत बड़ा है (अधिकतम 20 MB)। कृपया दूसरी फ़ोटो चुनें।'
    );
  }
  return t(
    'Could not read this image. Please try another photo.',
    'यह फ़ोटो खोली नहीं जा सकी। कृपया कोई दूसरी फ़ोटो चुनें।'
  );
}

export function estimateMediaSizeLabel(urlOrDataUrl: string): string {
  if (!urlOrDataUrl.startsWith('data:')) {
    return 'URL Link';
  }
  const base64Part = urlOrDataUrl.split(',')[1] || '';
  const approxBytes = Math.max(1024, Math.round((base64Part.length * 3) / 4));
  if (approxBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(approxBytes / 1024))} KB`;
  }
  return `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`;
}
