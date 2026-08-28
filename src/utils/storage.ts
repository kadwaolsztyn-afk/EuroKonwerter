import { ImportedDocument, DocumentRow } from '../types';
import { INITIAL_35_BRANDS_DOCUMENT, CURRENT_DATABASE_VERSION } from '../data/initialCatalog';

const DB_NAME = 'CarLampsCatalogDB';
const DB_VERSION = 2; // Incremented to migrate older schemas automatically
const STORE_NAME = 'catalog_data';
const DOCUMENT_KEY = 'active_document';

const MASTER_CACHE_KEY = 'carlamps_last_active_database';
const SNAPSHOT_KEY = 'carlamps_full_active_snapshot';
const VERSION_KEY = 'carlamps_catalog_version';

/**
 * Returns true if a cached document is outdated or from an old version
 */
function isDocumentOutdated(doc: any): boolean {
  if (!doc || !Array.isArray(doc.rows) || doc.rows.length === 0) return true;
  // If version doesn't match current unified version (2026.1) or row count is less than 266
  if (doc.version !== CURRENT_DATABASE_VERSION || doc.rows.length < 266) {
    return true;
  }
  return false;
}

/**
 * Completely resets and forces the master 266 models / 35 brands database
 */
export async function forceResetMasterDatabase(): Promise<ImportedDocument> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(INITIAL_35_BRANDS_DOCUMENT, DOCUMENT_KEY);
  } catch (_) {}

  try {
    const serialized = JSON.stringify(INITIAL_35_BRANDS_DOCUMENT);
    localStorage.setItem(MASTER_CACHE_KEY, serialized);
    localStorage.setItem(SNAPSHOT_KEY, serialized);
    localStorage.setItem(VERSION_KEY, CURRENT_DATABASE_VERSION);
    localStorage.setItem('carlamps_last_sync_timestamp', new Date().toISOString());
  } catch (_) {}

  saveMasterCatalogToServer(INITIAL_35_BRANDS_DOCUMENT).catch(() => {});
  return INITIAL_35_BRANDS_DOCUMENT;
}

/**
 * Returns the last known database synchronously from localStorage for instant 0ms offline startup
 */
export function getSynchronousInitialDocument(): ImportedDocument {
  try {
    const cachedVersion = localStorage.getItem(VERSION_KEY);
    if (cachedVersion === CURRENT_DATABASE_VERSION) {
      const raw = localStorage.getItem(MASTER_CACHE_KEY) || localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.rows) && parsed.rows.length >= 266 && !isDocumentOutdated(parsed)) {
          if (parsed.importedAt && typeof parsed.importedAt === 'string') {
            parsed.importedAt = new Date(parsed.importedAt);
          }
          parsed.rows = sanitizeDocumentRows(parsed.rows);
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read synchronous initial document from localStorage:', e);
  }
  return INITIAL_35_BRANDS_DOCUMENT;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves the master catalog directly to the server permanent storage (/api/catalog)
 */
export async function saveMasterCatalogToServer(document: ImportedDocument): Promise<boolean> {
  try {
    const response = await fetch('/api/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document }),
    });
    if (!response.ok) {
      console.warn('Server storage response was not ok:', response.status);
      return false;
    }
    const data = await response.json();
    return Boolean(data && data.success);
  } catch (err) {
    console.warn('Could not sync master catalog to server:', err);
    return false;
  }
}

/**
 * Fetches the master catalog from the server permanent storage (/api/catalog)
 */
export async function fetchMasterCatalogFromServer(): Promise<ImportedDocument | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('/api/catalog', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.success && data.document && Array.isArray(data.document.rows) && data.document.rows.length > 0) {
      const doc = data.document as ImportedDocument;
      if (doc.importedAt && typeof doc.importedAt === 'string') {
        doc.importedAt = new Date(doc.importedAt);
      }
      doc.rows = sanitizeDocumentRows(doc.rows);
      return doc;
    }
    return null;
  } catch (err) {
    console.warn('Server catalog fetch failed or offline:', err);
    return null;
  }
}

/**
 * Saves the current document state into IndexedDB, localStorage, and synchronizes to server
 */
export async function saveDocumentToStorage(document: ImportedDocument): Promise<void> {
  if (!document || !Array.isArray(document.rows) || document.rows.length === 0) {
    return;
  }

  const docWithVersion: ImportedDocument = {
    ...document,
    version: document.version || CURRENT_DATABASE_VERSION,
  };

  // 1. Primary storage: IndexedDB (supports unlimited rows, full base64 images, specs)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(docWithVersion, DOCUMENT_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Warning: Failed to save document to IndexedDB:', err);
  }

  // 2. Dual redundancy: localStorage for 0ms instant synchronous load and full offline persistence
  try {
    const serialized = JSON.stringify(docWithVersion);
    localStorage.setItem(MASTER_CACHE_KEY, serialized);
    localStorage.setItem(SNAPSHOT_KEY, serialized);
    localStorage.setItem(VERSION_KEY, CURRENT_DATABASE_VERSION);
    localStorage.setItem('carlamps_last_sync_timestamp', new Date().toISOString());
  } catch (_) {
    // If quota exceeded due to huge raw images, strip heavy inline data for the localStorage mirror
    try {
      const lightDoc: ImportedDocument = {
        ...docWithVersion,
        rows: docWithVersion.rows.map((r) => ({
          ...r,
          imageUrl: (r.imageUrl && r.imageUrl.length > 30000) ? undefined : r.imageUrl,
        })),
        images: [],
      };
      const lightSerialized = JSON.stringify(lightDoc);
      localStorage.setItem(MASTER_CACHE_KEY, lightSerialized);
      localStorage.setItem(SNAPSHOT_KEY, lightSerialized);
      localStorage.setItem(VERSION_KEY, CURRENT_DATABASE_VERSION);
    } catch (_) {}
  }

  // 3. Sync to server master storage if available
  saveMasterCatalogToServer(docWithVersion).catch((e) => {
    console.warn('Background server sync notice:', e);
  });
}

/**
 * Exports the complete application state (all rows, detailed car models, client & broker prices,
 * discount rules, broker markups, all base64 photos, custom notes, multimedia data, and settings) to a JSON file
 */
export function exportFullBackupJSON(document: ImportedDocument): void {
  // Collect all settings from localStorage
  let priceModifierSettings = null;
  let workshopSettings = null;
  let preferences = null;

  try {
    const rawMod = localStorage.getItem('carlamps_price_modifier_settings');
    if (rawMod) priceModifierSettings = JSON.parse(rawMod);
  } catch (_) {}

  try {
    const rawShop = localStorage.getItem('carlamps_workshop_info');
    if (rawShop) workshopSettings = JSON.parse(rawShop);
  } catch (_) {}

  try {
    const rawPref = localStorage.getItem('carlamps_ui_preferences');
    if (rawPref) preferences = JSON.parse(rawPref);
  } catch (_) {}

  const exportPayload = {
    app: 'Cennik konwersji lamp i multimediów',
    version: '2.0.0',
    backupType: 'FULL_COMPLETE_BACKUP_ALL_DATA_AND_SETTINGS',
    exportedAt: new Date().toISOString(),
    stats: {
      totalRows: document.rows?.length || 0,
      brandsCount: document.brandsCount || 0,
      imagesCount: (document.images?.length || 0) + (document.rows?.filter(r => r.imageUrl)?.length || 0),
    },
    priceModifierSettings: priceModifierSettings || {
      brokerGlobalDiscount: -10,
      brokerRange1Discount: -10,
      brokerRange2Discount: -15,
      brokerRange3Discount: -20,
      clientGlobalPercent: 0,
      clientRounding: 'smart_adaptive',
      brokerRounding: 'smart_adaptive',
    },
    workshopSettings: workshopSettings || {
      currency: 'PLN',
      country: 'PL',
      conversionType: 'USA -> ECE',
    },
    preferences: preferences || {},
    document: {
      ...document,
      exportedAt: new Date().toISOString(),
      rows: (document.rows || []).map((row) => ({
        ...row,
        // Guarantee all fields are explicitly preserved
        lp: row.lp,
        brand: row.brand,
        model: row.model,
        factoryCode: row.factoryCode,
        years: row.years,
        staticSignal: row.staticSignal,
        priceClientStatic: row.priceClientStatic,
        basePriceClientStatic: row.basePriceClientStatic || row.priceClientStatic,
        priceBrokerStatic: row.priceBrokerStatic,
        basePriceBrokerStatic: row.basePriceBrokerStatic || row.priceBrokerStatic,
        dynamicSignal: row.dynamicSignal,
        priceClientDynamic: row.priceClientDynamic,
        basePriceClientDynamic: row.basePriceClientDynamic || row.priceClientDynamic,
        priceBrokerDynamic: row.priceBrokerDynamic,
        basePriceBrokerDynamic: row.basePriceBrokerDynamic || row.priceBrokerDynamic,
        installation: row.installation,
        coding: row.coding,
        lampCount: row.lampCount,
        imageUrl: row.imageUrl,
        imageAlt: row.imageAlt,
        customNotes: row.customNotes,
        multimediaVersion: row.multimediaVersion,
        multimediaPriceClient: row.multimediaPriceClient,
        multimediaPriceBroker: row.multimediaPriceBroker,
        multimediaImageUrl: row.multimediaImageUrl,
        multimediaNotes: row.multimediaNotes,
        rawCells: row.rawCells,
      })),
      images: document.images || [],
    },
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `Pelny_Backup_Cennik_Zdjecia_Rabaty_Ustawienia_${dateStr}.json`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports a complete database & settings backup JSON file, restoring all rows, prices, discounts, photos, and preferences
 */
export async function importFullBackupJSON(file: File): Promise<ImportedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const docData = parsed.document || parsed;

        if (!docData || !Array.isArray(docData.rows)) {
          throw new Error('Plik nie zawiera poprawnej struktury bazy cennika');
        }

        // Restore price modifier and discount settings if present
        if (parsed.priceModifierSettings) {
          try {
            localStorage.setItem(
              'carlamps_price_modifier_settings',
              JSON.stringify(parsed.priceModifierSettings)
            );
          } catch (_) {}
        }

        // Restore workshop settings if present
        if (parsed.workshopSettings) {
          try {
            localStorage.setItem(
              'carlamps_workshop_info',
              JSON.stringify(parsed.workshopSettings)
            );
          } catch (_) {}
        }

        // Restore UI preferences if present
        if (parsed.preferences) {
          try {
            localStorage.setItem(
              'carlamps_ui_preferences',
              JSON.stringify(parsed.preferences)
            );
          } catch (_) {}
        }

        const sanitizedRows = sanitizeDocumentRows(docData.rows);
        const uniqueBrands = new Set(
          sanitizedRows.map((r) => (r.brand || '').trim()).filter((b) => b && b !== '-')
        );

        const restoredDoc: ImportedDocument = {
          id: docData.id || `doc_${Date.now()}`,
          name: docData.name || file.name.replace(/\.json$/i, ''),
          fileType: docData.fileType || 'sample',
          sizeFormatted: docData.sizeFormatted || `${(file.size / 1024).toFixed(1)} KB`,
          rawHtml: docData.rawHtml || '',
          rows: sanitizedRows,
          headers: docData.headers || [],
          images: docData.images || docData.extractedImages || [],
          totalRows: sanitizedRows.length,
          brandsCount: uniqueBrands.size,
          importedAt: new Date(),
          customCss: docData.customCss || '',
        };

        await saveDocumentToStorage(restoredDoc);
        resolve(restoredDoc);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Błąd podczas odczytu pliku kopii zapasowej'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Sanitizes and repairs any rows where columns were accidentally shifted or brands misplaced
 */
export function sanitizeDocumentRows(rows: DocumentRow[]): DocumentRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, idx) => {
    let brandTrim = (r.brand || '').trim();
    let modelTrim = (r.model || '').trim();

    // Repair known brand misclassifications
    if (brandTrim === 'Compass') {
      brandTrim = 'Jeep';
      modelTrim = 'Compass';
    } else if (brandTrim === 'Range Rover') {
      brandTrim = 'Land Rover';
      if (!modelTrim.startsWith('Range Rover')) {
        modelTrim = 'Range Rover ' + modelTrim;
      }
    } else if (brandTrim === 'Mercedes') {
      brandTrim = 'Mercedes-Benz';
    } else if (brandTrim === 'Mclaren') {
      brandTrim = 'McLaren';
    } else if (brandTrim === 'KIA') {
      brandTrim = 'Kia';
    }

    // If brand is a pure number (meaning LP was accidentally placed into brand)
    if (/^\d+[\.\)]?$/.test(brandTrim)) {
      return {
        ...r,
        id: r.id || idx + 1,
        lp: r.lp && !/^\d+[\.\)]?$/.test(String(r.lp)) ? r.lp : brandTrim,
        brand: r.model || '',
        model: r.factoryCode || '',
        factoryCode: r.years || '-',
        years: r.staticSignal || '',
        staticSignal: r.priceClientStatic || '',
        priceClientStatic: r.priceBrokerStatic || '',
        priceBrokerStatic: r.dynamicSignal || '',
        dynamicSignal: r.priceClientDynamic || '',
        priceClientDynamic: r.priceBrokerDynamic || '',
        priceBrokerDynamic: r.installation || '',
        installation: r.coding || '',
        coding: r.lampCount || '',
        lampCount: '',
      };
    }

    return {
      ...r,
      id: r.id || idx + 1,
      lp: r.lp || String(idx + 1),
      brand: brandTrim,
      model: modelTrim,
    };
  });
}

/**
 * Loads the saved document state:
 * 1. Checks local IndexedDB (contains exact full document with photos & rows)
 * 2. Checks if local state is from an outdated version, and auto-upgrades if needed
 * 3. Fallbacks to localStorage cache for offline continuity
 * 4. Fallbacks to server catalog if online
 * 5. Returns unified 35 brands / 266 models catalog
 */
export async function loadDocumentFromStorage(): Promise<ImportedDocument | null> {
  // 1. Check local IndexedDB first
  try {
    const db = await openDB();
    const localDoc = await new Promise<ImportedDocument | null>((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DOCUMENT_KEY);

      request.onsuccess = () => {
        const result = request.result as ImportedDocument | undefined;
        if (result && result.rows && Array.isArray(result.rows) && result.rows.length > 0) {
          if (result.importedAt && typeof result.importedAt === 'string') {
            result.importedAt = new Date(result.importedAt);
          }
          result.rows = sanitizeDocumentRows(result.rows);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });

    if (localDoc && localDoc.rows && localDoc.rows.length > 0) {
      if (!isDocumentOutdated(localDoc)) {
        return localDoc;
      }
      console.log('Migrating local storage from outdated version to unified version:', CURRENT_DATABASE_VERSION);
    }
  } catch (err) {
    console.warn('Notice: IndexedDB read fallback to localStorage:', err);
  }

  // 2. Check server master catalog first when online to guarantee cross-device parity
  try {
    const serverDoc = await fetchMasterCatalogFromServer();
    if (serverDoc && serverDoc.rows && serverDoc.rows.length >= 266) {
      await saveDocumentToStorage(serverDoc);
      return serverDoc;
    }
  } catch (err) {
    console.warn('Server catalog fetch error or offline:', err);
  }

  // 3. Check local synchronous storage fallback if not outdated
  try {
    const raw = localStorage.getItem(MASTER_CACHE_KEY) || localStorage.getItem(SNAPSHOT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0 && !isDocumentOutdated(parsed)) {
        if (parsed.importedAt && typeof parsed.importedAt === 'string') {
          parsed.importedAt = new Date(parsed.importedAt);
        }
        parsed.rows = sanitizeDocumentRows(parsed.rows);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Notice: localStorage read fallback to server/defaults:', err);
  }

  // 4. Default fallback: Save and return the master 266 models catalog
  try {
    await saveDocumentToStorage(INITIAL_35_BRANDS_DOCUMENT);
  } catch (_) {}

  return INITIAL_35_BRANDS_DOCUMENT;
}

/**
 * Clears the persistent storage
 */
export async function clearDocumentStorage(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(DOCUMENT_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB:', err);
  }

  try {
    localStorage.removeItem(MASTER_CACHE_KEY);
    localStorage.removeItem(SNAPSHOT_KEY);
  } catch (_) {}
}
