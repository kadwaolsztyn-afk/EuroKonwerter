import { ImportedDocument } from '../types';
import { saveDocumentToStorage, sanitizeDocumentRows } from './storage';

export interface LinkServerStatus {
  connected: boolean;
  exists: boolean;
  version: string | null;
  serverUpdatedAt: string | null;
  totalRows: number;
  brandsCount?: number;
  fileSizeBytes?: number;
  lastModified?: number;
  timestamp?: number;
  error?: string;
}

export interface LinkSyncResult {
  success: boolean;
  document?: ImportedDocument;
  version?: string;
  totalRows?: number;
  message?: string;
  error?: string;
}

const BROADCAST_CHANNEL_NAME = 'carlamps_link_sync_channel';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel might be blocked in some sandboxes
}

/**
 * Checks the status and version of the master catalog saved on this shared link server.
 * This is an ultra-fast (<20ms) endpoint that does not download the 10MB payload.
 */
export async function checkLinkServerStatus(): Promise<LinkServerStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/catalog/status', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        exists: Boolean(data.exists),
        version: data.version || null,
        serverUpdatedAt: data.serverUpdatedAt || null,
        totalRows: typeof data.totalRows === 'number' ? data.totalRows : 0,
        brandsCount: data.brandsCount || 34,
        fileSizeBytes: data.fileSizeBytes,
        lastModified: data.lastModified,
        timestamp: data.timestamp || Date.now(),
      };
    }

    // Fallback: if /api/catalog/status is not yet available, try HEAD on /api/catalog
    const headRes = await fetch('/api/catalog', {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    });

    return {
      connected: headRes.ok,
      exists: headRes.ok,
      version: null,
      serverUpdatedAt: headRes.headers.get('last-modified') || null,
      totalRows: 461,
    };
  } catch (err: any) {
    return {
      connected: false,
      exists: false,
      version: null,
      serverUpdatedAt: null,
      totalRows: 0,
      error: err?.message || 'Brak połączenia z serwerem linku',
    };
  }
}

/**
 * Pushes the entire catalog database (including all photos and pricing)
 * to this shared link server so all other devices opening the same link receive it.
 */
export async function pushDatabaseToLinkServer(document: ImportedDocument): Promise<LinkSyncResult> {
  if (!document || !Array.isArray(document.rows) || document.rows.length === 0) {
    return {
      success: false,
      error: 'Baza danych jest pusta lub uszkodzona - anulowano wysyłanie.',
    };
  }

  try {
    const now = new Date();
    const timeSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}_${now.getSeconds()}`;
    const newVersion = `2026.03_ALL_v461_SYNC_${timeSuffix}`;

    const docToSend: ImportedDocument = {
      ...document,
      version: newVersion,
      importedAt: now,
    };

    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document: docToSend }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Serwer zwrócił błąd HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();

    // Update local persistence
    await saveDocumentToStorage(docToSend);

    try {
      localStorage.setItem('carlamps_last_link_sync', now.toISOString());
      localStorage.setItem('carlamps_server_version', newVersion);
    } catch (_) {}

    // Broadcast update to all open tabs on this browser
    try {
      broadcastChannel?.postMessage({
        type: 'DATABASE_UPDATED_ON_LINK',
        version: newVersion,
        totalRows: docToSend.rows.length,
        timestamp: Date.now(),
      });
    } catch (_) {}

    return {
      success: true,
      document: docToSend,
      version: newVersion,
      totalRows: docToSend.rows.length,
      message: `Pomyślnie wysłano bazę (${docToSend.rows.length} modeli) na ten link! Pozostałe urządzenia pobiorą ją automatycznie.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Błąd sieciowy podczas wysyłania bazy na serwer linku.',
    };
  }
}

/**
 * Pulls the latest complete master catalog database from this shared link server
 * and saves it into local IndexedDB and application state.
 */
export async function pullDatabaseFromLinkServer(): Promise<LinkSyncResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for 10MB payload

    const res = await fetch('/api/catalog?t=' + Date.now(), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        error: `Serwer linku zwrócił błąd HTTP ${res.status} (${res.statusText})`,
      };
    }

    const data = await res.json();
    if (!data || !data.success || !data.document || !Array.isArray(data.document.rows)) {
      return {
        success: false,
        error: 'Na serwerze linku nie ma jeszcze zapisanej bazy danych.',
      };
    }

    const doc = data.document as ImportedDocument;
    if (doc.importedAt && typeof doc.importedAt === 'string') {
      doc.importedAt = new Date(doc.importedAt);
    }
    doc.rows = sanitizeDocumentRows(doc.rows);

    // Save to IndexedDB and LocalStorage
    await saveDocumentToStorage(doc);

    try {
      localStorage.setItem('carlamps_last_link_sync', new Date().toISOString());
      if (doc.version) {
        localStorage.setItem('carlamps_server_version', doc.version);
      }
    } catch (_) {}

    return {
      success: true,
      document: doc,
      version: doc.version,
      totalRows: doc.rows.length,
      message: `Pomyślnie pobrano najświeższą bazę z serwera linku (${doc.rows.length} modeli)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Błąd podczas pobierania bazy z serwera linku.',
    };
  }
}

/**
 * Registers cross-tab synchronization listener
 */
export function registerCrossTabSyncListener(onUpdate: (version: string) => void): () => void {
  if (!broadcastChannel) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DATABASE_UPDATED_ON_LINK') {
      onUpdate(event.data.version);
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}
