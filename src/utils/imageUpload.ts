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
 * Uploads a local file or dataUrl directly to the server's /uploads folder.
 * Returns relative path e.g. '/uploads/lampa_porsche_123.jpg'
 * If offline or server error, falls back gracefully to client dataURL.
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
    dataUrl = await readFileAsDataUrl(fileOrDataUrl);
  }

  // If already an /uploads/ url, return as is
  if (dataUrl.startsWith('/uploads/') || dataUrl.startsWith('http')) {
    return dataUrl;
  }

  try {
    const response = await fetch('/api/uploads/upload', {
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

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[UploadToProgramFolder] Server upload failed, falling back to dataUrl:', err);
  }

  // Fallback to dataUrl if server is offline
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
