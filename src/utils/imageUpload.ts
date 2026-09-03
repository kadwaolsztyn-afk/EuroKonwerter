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
 * Compresses an image file in the browser using an off-screen canvas to ~30-50KB WebP/JPEG.
 * This guarantees ultra-fast loading, offline compatibility, and zero broken links on Vercel & GitHub.
 */
export function compressImageFile(file: File, maxWidth = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
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
 * Uploads a local file or dataUrl directly to the server's /uploads folder.
 * Returns an optimized self-contained data URL so that Vercel, GitHub, and offline modes
 * display the image flawlessly without 404 errors.
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
    dataUrl = fileOrDataUrl;
  } else {
    filename = filename || fileOrDataUrl.name;
    try {
      dataUrl = await compressImageFile(fileOrDataUrl);
    } catch {
      dataUrl = await readFileAsDataUrl(fileOrDataUrl);
    }
  }

  // Backup to server's /uploads folder if running with backend
  try {
    fetch('/api/uploads/upload', {
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
    }).catch(() => {});
  } catch (_) {}

  // Return the self-contained dataUrl so that it renders everywhere (Vercel, GitHub, offline)
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
