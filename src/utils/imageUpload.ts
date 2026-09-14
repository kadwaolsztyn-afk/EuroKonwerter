/**
 * Image upload & portable storage helper
 * Handles saving images directly to the program's local /uploads folder
 */

export interface UploadImageResult {
  success: boolean;
  url: string;
  filename?: string;
  error?: string;
}

export interface PortableStatus {
  success: boolean;
  mode: string;
  programDirectory: string;
  dataFile: string;
  dataFileSize: number;
  uploadsDirectory: string;
  uploadsCount: number;
  uploadsSizeBytes: number;
  uploadsSizeFormatted: string;
  isIsolated: boolean;
}

/**
 * Compresses an image file in the browser using an off-screen canvas to ultra-efficient WebP/JPEG.
 * Preserves crisp visual sharpness (using high-quality interpolation) while reducing file size by 85-95%.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG file, keep vector source intact
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate target dimensions keeping aspect ratio (without upscaling smaller images)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Stepped downsampling for sharpest visual detail (reduces aliasing/jaggies)
        let currentCanvas = document.createElement('canvas');
        currentCanvas.width = img.width;
        currentCanvas.height = img.height;
        let currentCtx = currentCanvas.getContext('2d');
        if (!currentCtx) {
          resolve(e.target?.result as string);
          return;
        }
        currentCtx.drawImage(img, 0, 0);

        let curW = img.width;
        let curH = img.height;

        // Step down by halves if shrinking by more than 2x
        while (curW > width * 2 && curH > height * 2) {
          const nextW = Math.round(curW / 2);
          const nextH = Math.round(curH / 2);
          const nextCanvas = document.createElement('canvas');
          nextCanvas.width = nextW;
          nextCanvas.height = nextH;
          const nextCtx = nextCanvas.getContext('2d');
          if (nextCtx) {
            nextCtx.imageSmoothingEnabled = true;
            nextCtx.imageSmoothingQuality = 'high';
            nextCtx.drawImage(currentCanvas, 0, 0, nextW, nextH);
            currentCanvas = nextCanvas;
            curW = nextW;
            curH = nextH;
          } else {
            break;
          }
        }

        // Final canvas at exact target resolution
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          resolve(e.target?.result as string);
          return;
        }

        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(currentCanvas, 0, 0, width, height);

        // Check for alpha transparency
        let hasTransparency = false;
        try {
          const imgData = finalCtx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100)).data;
          for (let i = 3; i < imgData.length; i += 16) {
            if (imgData[i] < 250) {
              hasTransparency = true;
              break;
            }
          }
        } catch (_) {}

        // WebP supports both lossy compression and full alpha transparency
        let dataUrl = finalCanvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          // Fallback if browser doesn't support WebP export
          if (hasTransparency) {
            dataUrl = finalCanvas.toDataURL('image/png');
          } else {
            dataUrl = finalCanvas.toDataURL('image/jpeg', quality);
          }
        }

        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 data URL to an optimized WebP string.
 */
export function compressDataUrl(
  dataUrl: string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If not a data URL or is vector SVG, return as-is
    if (!dataUrl.startsWith('data:image/') || dataUrl.includes('svg+xml')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If already small in dimensions and reasonable size (< 65KB), don't recompress
      if (width <= maxWidth && height <= maxHeight && dataUrl.length < 90000 && dataUrl.startsWith('data:image/webp')) {
        resolve(dataUrl);
        return;
      }

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/webp', quality);
      if (!compressed.startsWith('data:image/webp')) {
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Uploads a local file or dataUrl directly to the server's /uploads folder.
 * Automatically compresses the image client-side before sending to conserve bandwidth,
 * and the server converts it to an ultra-compact WebP file.
 */
export async function uploadImageToProgramFolder(
  fileOrDataUrl: File | string,
  options?: {
    rowId?: number;
    brand?: string;
    model?: string;
    suggestedFilename?: string;
  }
): Promise<string> {
  let dataUrl: string = '';
  let filename = options?.suggestedFilename || '';

  if (typeof fileOrDataUrl === 'string') {
    // If it's already an uploaded file path like /uploads/..., don't re-upload
    if (fileOrDataUrl.startsWith('/uploads/') || fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
      return fileOrDataUrl;
    }
    // If it's a base64 data URL, compress it
    try {
      dataUrl = await compressDataUrl(fileOrDataUrl);
    } catch {
      dataUrl = fileOrDataUrl;
    }
  } else {
    filename = filename || fileOrDataUrl.name;
    try {
      dataUrl = await compressImageFile(fileOrDataUrl);
    } catch {
      dataUrl = await readFileAsDataUrl(fileOrDataUrl);
    }
  }

  // Upload to server's /uploads folder if running with backend
  try {
    const res = await fetch('/api/uploads/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataUrl,
        filename,
        rowId: options?.rowId,
        brand: options?.brand,
        model: options?.model,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        return data.url;
      }
    }
  } catch (_) {}

  // Return the compressed dataUrl as fallback if offline or server is unavailable
  return dataUrl;
}

/**
 * Migrates all base64 images stored in catalog into physical files in /uploads
 */
export async function migrateCatalogImagesToUploadsFolder(): Promise<{
  success: boolean;
  migratedCount: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/uploads/migrate-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: Boolean(data.success),
      migratedCount: data.migratedCount || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      migratedCount: 0,
      error: err.message || 'Błąd migracji zdjęć',
    };
  }
}

/**
 * Forces synchronization of current catalog & photos into repository source files (src/ and public/)
 * so that Google AI Studio & GitHub instantly recognize changes for commit/push.
 */
export async function syncDatabaseToSourceCode(document?: any): Promise<{
  success: boolean;
  message: string;
  totalRows?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/sync/to-source-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || 'Zsynchronizowano bazę.',
      totalRows: data.totalRows,
      error: data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Błąd synchronizacji',
      error: err.message || 'Nie udało się połączyć z serwerem.',
    };
  }
}

/**
 * Gets portable program storage status
 */
export async function fetchPortableStatus(): Promise<PortableStatus | null> {
  try {
    const res = await fetch('/api/portable/info');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success) return data;
    return null;
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
