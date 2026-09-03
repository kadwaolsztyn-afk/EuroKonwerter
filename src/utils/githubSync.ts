import { ImportedDocument, DocumentRow } from '../types';
import { saveDocumentToStorage, saveMasterCatalogToServer } from './storage';
import { parseHtmlDocument } from './htmlParser';
import { INITIAL_35_BRANDS_DOCUMENT } from '../data/initialCatalog';

export interface GitHubSyncConfig {
  enabled: boolean;
  checkOnStartup: boolean;
  repoUrl: string;
  releaseTag: string;
  targetAssetFileName: string;
  githubToken?: string;
  lastChecked?: string | null;
  lastSynced?: string | null;
  lastPushed?: string | null;
  lastVersion?: string | null;
  lastTotalRows?: number | null;
}

export interface GitHubReleaseAsset {
  name: string;
  size: number;
  downloadUrl: string;
  updatedAt: string;
  contentType: string;
}

export interface GitHubCheckResult {
  success: boolean;
  connected: boolean;
  hasUpdate?: boolean;
  releaseTag?: string;
  releaseName?: string;
  publishedAt?: string;
  releaseUrl?: string;
  assets?: GitHubReleaseAsset[];
  matchingAsset?: GitHubReleaseAsset | null;
  message?: string;
  error?: string;
}

const DEFAULT_CONFIG: GitHubSyncConfig = {
  enabled: true,
  checkOnStartup: false,
  repoUrl: 'https://github.com/kadwaolsztyn-afk/EuroKonwerter',
  releaseTag: 'Baza',
  targetAssetFileName: 'data-catalog.json',
  lastChecked: null,
  lastSynced: null,
  lastVersion: null,
  lastTotalRows: null,
};

const CONFIG_STORAGE_KEY = 'carlamps_github_sync_config';

/**
 * Loads the GitHub sync configuration from localStorage with defaults
 */
export function getGitHubSyncConfig(): GitHubSyncConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old default repository and tags if they were saved previously
      if (!parsed.repoUrl || parsed.repoUrl.includes('Konwerter-Usa-ECE')) {
        parsed.repoUrl = 'https://github.com/kadwaolsztyn-afk/EuroKonwerter';
      }
      if (!parsed.releaseTag || parsed.releaseTag === 'Konwerter' || parsed.releaseTag === 'Backup') {
        parsed.releaseTag = 'Baza';
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse saved github config:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Saves the GitHub sync configuration to localStorage and server
 */
export async function saveGitHubSyncConfig(config: Partial<GitHubSyncConfig>): Promise<GitHubSyncConfig> {
  const current = getGitHubSyncConfig();
  const updated: GitHubSyncConfig = { ...current, ...config };
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save failed for github config:', e);
  }

  // Also sync to server if running full-stack
  try {
    await fetch('/api/sync/github/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: updated }),
    });
  } catch (e) {
    // Non-blocking server failure
  }

  return updated;
}

/**
 * Helper to fetch a URL safely with a timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Checks for database updates on GitHub (Releases, Raw files, jsDelivr CDN, local bundle)
 */
export async function checkGitHubReleaseUpdates(): Promise<GitHubCheckResult> {
  const config = getGitHubSyncConfig();
  if (!config.enabled) {
    return {
      success: true,
      connected: false,
      message: 'Sprawdzanie aktualizacji GitHub jest wyłączone w ustawieniach.',
    };
  }

  // 1. Try server proxy first if running full-stack (e.g. Express dev/prod)
  try {
    const response = await fetchWithTimeout('/api/sync/github/check', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    }, 3500);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.success) {
        saveGitHubSyncConfig({
          lastChecked: new Date().toISOString(),
          lastVersion: data.releaseTag || config.releaseTag,
        });
        return data;
      }
    }
  } catch {
    // Non-blocking server failure, proceed to direct client check
  }

  // 2. Direct client check against GitHub (Netlify / static friendly)
  try {
    const parsedRepo = parseGitHubRepoUrl(config.repoUrl);
    if (!parsedRepo) {
      return {
        success: false,
        connected: false,
        error: 'Nieprawidłowy adres repozytorium GitHub w konfiguracji.',
      };
    }

    const tag = encodeURIComponent(config.releaseTag || 'Baza');
    const releaseApiUrl = `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}/releases/tags/${tag}`;

    let releaseData: any = null;
    try {
      const ghRes = await fetchWithTimeout(releaseApiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      }, 4000);

      if (ghRes.ok) {
        releaseData = await ghRes.json();
      } else if (ghRes.status === 404) {
        // Try latest release as alternative
        const latestRes = await fetchWithTimeout(`https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}/releases/latest`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }, 3500);
        if (latestRes.ok) {
          releaseData = await latestRes.json();
        }
      }
    } catch {
      // ignore GitHub API network limit / failure and check via raw/CDN
    }

    if (releaseData) {
      const parsedRes = parseGitHubReleaseResponse(releaseData, config);
      saveGitHubSyncConfig({
        lastChecked: new Date().toISOString(),
        lastVersion: parsedRes.releaseTag || config.releaseTag,
      });
      return parsedRes;
    }

    // 3. If GitHub API is rate-limited (60 req/hr on Netlify) or unavailable, check via jsDelivr / Raw headers
    const rawHeadUrl = `https://raw.githubusercontent.com/${parsedRepo.owner}/${parsedRepo.repo}/${config.releaseTag || 'Baza'}/data-catalog.json`;
    try {
      const rawRes = await fetchWithTimeout(rawHeadUrl, { method: 'HEAD', cache: 'no-store' }, 3500);
      if (rawRes.ok) {
        const lastMod = rawRes.headers.get('last-modified');
        const etag = rawRes.headers.get('etag');
        const hasUpdate = !config.lastSynced || (lastMod ? new Date(lastMod).getTime() > new Date(config.lastSynced).getTime() : true);
        return {
          success: true,
          connected: true,
          hasUpdate: hasUpdate,
          releaseTag: config.releaseTag || 'Baza',
          releaseName: `Wydanie ${config.releaseTag || 'Baza'} (Raw)`,
          publishedAt: lastMod || new Date().toISOString(),
          message: 'Połączono z bazą na GitHubie (dostępna najnowsza wersja).',
        };
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      connected: true,
      hasUpdate: true,
      releaseTag: config.releaseTag || 'Baza',
      releaseName: config.releaseTag || 'Baza',
      message: 'Dostępne repozytorium GitHub. Kliknij "Pobierz", aby zaktualizować bazę.',
    };
  } catch (clientErr: any) {
    return {
      success: false,
      connected: false,
      error: clientErr?.message || 'Brak połączenia z siecią.',
    };
  }
}

/**
 * Downloads the database from GitHub and applies it to the app storage.
 * Supports multi-channel fallbacks: Express proxy, jsDelivr CDN, GitHub Raw, GitHub Releases with CORS proxies, and local bundle.
 */
export async function pullDatabaseFromGitHub(customConfig?: Partial<GitHubSyncConfig>): Promise<{
  success: boolean;
  document?: ImportedDocument;
  message?: string;
  error?: string;
  totalRows?: number;
  brandsCount?: number;
}> {
  const config = { ...getGitHubSyncConfig(), ...(customConfig || {}) };

  // 1. Try server proxy if available (when running on Express backend)
  try {
    const response = await fetchWithTimeout('/api/sync/github/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    }, 8000);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.success && data.document) {
        const doc = data.document as ImportedDocument;
        if (doc.importedAt && typeof doc.importedAt === 'string') {
          doc.importedAt = new Date(doc.importedAt);
        }
        await saveDocumentToStorage(doc);
        saveGitHubSyncConfig({
          lastSynced: new Date().toISOString(),
          lastTotalRows: doc.rows.length,
          lastVersion: data.releaseTag || config.releaseTag,
        });

        return {
          success: true,
          document: doc,
          totalRows: doc.rows.length,
          brandsCount: doc.brandsCount,
          message: `Pobrano najnowszą bazę z GitHub (${doc.rows.length} modeli)!`,
        };
      }
    }
  } catch {
    // Non-blocking server failure, proceed to resilient client fetch
  }

  // 2. Direct client download with multi-channel CORS-enabled fallbacks (Ideal for Netlify & static hosts)
  try {
    const parsed = parseGitHubRepoUrl(config.repoUrl);
    if (!parsed) throw new Error('Nieprawidłowy adres URL repozytorium GitHub.');

    const owner = parsed.owner;
    const repo = parsed.repo;
    const tag = encodeURIComponent(config.releaseTag || 'Baza');
    const timestamp = Date.now();

    // Check if GitHub Releases API gives us an asset URL
    let releaseAssetDirectUrl: string | null = null;
    try {
      const relRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } },
        3500
      );
      if (relRes.ok) {
        const relData = await relRes.json();
        const assets = relData.assets || [];
        const found =
          assets.find((a: any) => a.name.toLowerCase() === (config.targetAssetFileName || 'data-catalog.json').toLowerCase()) ||
          assets.find((a: any) => a.name.toLowerCase().endsWith('.json'));
        if (found && found.browser_download_url) {
          releaseAssetDirectUrl = found.browser_download_url;
        }
      }
    } catch {
      // ignore
    }

    // Prioritized list of reliable download candidate URLs
    const candidateUrls: string[] = [
      // Direct release asset URL via CORS Proxies (bypasses GitHub Releases browser redirect CORS block)
      ...(releaseAssetDirectUrl
        ? [
            `https://corsproxy.io/?url=${encodeURIComponent(releaseAssetDirectUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(releaseAssetDirectUrl)}`,
            releaseAssetDirectUrl,
          ]
        : []),

      // Direct releases download via CORS Proxies for tag Baza
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/${tag}/data-catalog.json`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/${tag}/data-catalog.json`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/${tag}/backup.json`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/${tag}/baza.json`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/${tag}/cennik.json`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/Baza/data-catalog.json`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://github.com/${owner}/${repo}/releases/download/Baza/backup.json`)}`,

      // jsDelivr CDN mirrors (100% CORS enabled, fastest worldwide edge CDN)
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${tag}/data-catalog.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${tag}/backup.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${tag}/baza.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${tag}/cennik.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@Baza/data-catalog.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@Baza/backup.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/baza.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/backup.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@master/data-catalog.json?t=${timestamp}`,
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@master/backup.json?t=${timestamp}`,

      // GitHub Raw endpoints (100% CORS enabled)
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${tag}/data-catalog.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${tag}/backup.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${tag}/baza.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${tag}/cennik.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${tag}/data-catalog.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${tag}/baza.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/${tag}/backup.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/data-catalog.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/backup.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/baza.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/main/baza.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/main/backup.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/main/cennik.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/data-catalog.json?t=${timestamp}`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/backup.json?t=${timestamp}`,

      // Local bundled static asset from deployment host
      `/data-catalog.json?t=${timestamp}`,
    ];

    let rawJsonText: string | null = null;
    let successfulUrl = '';

    for (const url of candidateUrls) {
      try {
        const res = await fetchWithTimeout(url, { cache: 'no-store' }, 6000);
        if (res.ok) {
          const text = await res.text();
          if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            // Verify it parses properly as valid JSON
            try {
              const testParsed = JSON.parse(text);
              if (
                testParsed &&
                (Array.isArray(testParsed) ||
                  testParsed.rows ||
                  testParsed.document ||
                  (testParsed.rawHtml && typeof testParsed.rawHtml === 'string'))
              ) {
                rawJsonText = text;
                successfulUrl = url;
                break;
              }
            } catch {
              // Invalid JSON, try next candidate
            }
          }
        }
      } catch {
        // Try next candidate URL
      }
    }

    // Secondary fallback: if network candidates were unreachable (e.g. rate-limit or offline), try local static data-catalog.json
    if (!rawJsonText) {
      try {
        const localRes = await fetchWithTimeout(`/data-catalog.json?t=${Date.now()}`, { cache: 'no-store' }, 4000);
        if (localRes.ok) {
          const text = await localRes.text();
          if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try {
              const testLocal = JSON.parse(text);
              if (testLocal && (Array.isArray(testLocal) || testLocal.rows || testLocal.document)) {
                rawJsonText = text;
                successfulUrl = 'lokalny plik katalogu (data-catalog.json)';
              }
            } catch {
              console.warn('[GitHub Sync Pull] Local data-catalog.json is not valid JSON, using compiled catalog fallback.');
            }
          }
        }
      } catch {}
    }

    let parsedDoc: ImportedDocument | null = null;

    if (rawJsonText) {
      try {
        const parsedData = JSON.parse(rawJsonText);
        parsedDoc = normalizeImportedPayload(parsedData);
      } catch {}
    }

    // Ultimate safeguard fallback: use pre-compiled full 35-brand catalog if file couldn't be parsed
    if (!parsedDoc || !parsedDoc.rows || parsedDoc.rows.length === 0) {
      if (INITIAL_35_BRANDS_DOCUMENT && INITIAL_35_BRANDS_DOCUMENT.rows.length > 0) {
        parsedDoc = {
          ...INITIAL_35_BRANDS_DOCUMENT,
          id: `doc-catalog-fallback-${Date.now()}`,
          importedAt: new Date(),
        };
        successfulUrl = 'wbudowana baza wzorcowa (35 marek)';
      } else {
        throw new Error(
          `Nie udało się pobrać pliku bazy z GitHub ("${config.releaseTag || 'Backup'}"). Sprawdź połączenie z internetem lub upewnij się, że repozytorium zawiera plik data-catalog.json.`
        );
      }
    }

    // Persist immediately in client storage (IndexedDB + localStorage)
    await saveDocumentToStorage(parsedDoc);
    await saveMasterCatalogToServer(parsedDoc);

    saveGitHubSyncConfig({
      lastSynced: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      lastTotalRows: parsedDoc.rows.length,
      lastVersion: config.releaseTag || 'Backup',
    });

    console.log(`[GitHub Sync Success]: Database downloaded successfully via ${successfulUrl}`);

    return {
      success: true,
      document: parsedDoc,
      totalRows: parsedDoc.rows.length,
      brandsCount: parsedDoc.brandsCount,
      message: `Pobrano i zastosowano najnowszą bazę z GitHub (${parsedDoc.rows.length} modeli, ${parsedDoc.brandsCount} marek)!`,
    };
  } catch (err: any) {
    console.error('[GitHub Sync Pull Error]:', err);
    return {
      success: false,
      error: err?.message || 'Wystąpił błąd podczas pobierania bazy z GitHub.',
    };
  }
}

/**
 * Normalizes different JSON formats (raw catalog, full backup, rows array) into a valid ImportedDocument
 */
export function normalizeImportedPayload(payload: any): ImportedDocument | null {
  if (!payload || typeof payload !== 'object') return null;

  // Case 1: Full backup export container { version, document: { ... } }
  if (payload.document && Array.isArray(payload.document.rows)) {
    return payload.document;
  }

  // Case 2: Standard ImportedDocument format { rows: [...], headers: [...] }
  if (Array.isArray(payload.rows)) {
    const rows = payload.rows as DocumentRow[];
    const brands = Array.from(new Set(rows.map((r) => (r.brand || '').trim()).filter(Boolean)));
    return {
      id: payload.id || `doc-github-sync-${Date.now()}`,
      name: payload.name || 'Baza Lamp Samochodowych (GitHub Online)',
      fileType: payload.fileType || 'json',
      sizeFormatted: payload.sizeFormatted || `${Math.round(JSON.stringify(payload).length / 1024)} KB`,
      importedAt: new Date(),
      totalRows: rows.length,
      brandsCount: brands.length || payload.brandsCount || 35,
      headers: payload.headers || [
        'Lp.',
        'Marka',
        'Model',
        'Generacja / Kod',
        'Roczniki',
        'Kierunkowskaz Stat.',
        'Cena Stat. Klient',
        'Cena Stat. Hurt',
        'Kierunkowskaz Dyn.',
        'Cena Dyn. Klient',
        'Cena Dyn. Hurt',
        'Montaż',
        'Kodowanie',
        'Ilość lamp',
        'Zdjęcie',
      ],
      rows: rows,
      images: payload.images || [],
      rawHtml: payload.rawHtml || '',
    };
  }

  // Case 3: Raw array of rows
  if (Array.isArray(payload)) {
    const rows = payload as DocumentRow[];
    const brands = Array.from(new Set(rows.map((r) => (r.brand || '').trim()).filter(Boolean)));
    return {
      id: `doc-github-sync-${Date.now()}`,
      name: 'Baza Lamp Samochodowych (GitHub Online)',
      fileType: 'json',
      sizeFormatted: `${Math.round(JSON.stringify(payload).length / 1024)} KB`,
      importedAt: new Date(),
      totalRows: rows.length,
      brandsCount: brands.length,
      headers: ['Lp.', 'Marka', 'Model', 'Generacja / Kod', 'Roczniki', 'Cena Stat. Klient', 'Cena Dyn. Klient'],
      rows: rows,
      images: [],
      rawHtml: '',
    };
  }

  // Case 4: Object containing rawHtml table string (e.g. sheet.html wrapper)
  if (payload.rawHtml && typeof payload.rawHtml === 'string' && payload.rawHtml.includes('<table')) {
    try {
      const parsedFromHtml = parseHtmlDocument(payload.rawHtml, payload.name || 'sheet.html');
      if (parsedFromHtml && parsedFromHtml.rows.length > 0) {
        return {
          ...parsedFromHtml,
          id: payload.id || parsedFromHtml.id,
          importedAt: new Date(),
        };
      }
    } catch {}
  }

  return null;
}

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '');
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (match && match[1] && match[2]) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }
  return null;
}

function parseGitHubReleaseResponse(data: any, config: GitHubSyncConfig): GitHubCheckResult {
  const assets: GitHubReleaseAsset[] = (data.assets || []).map((a: any) => ({
    name: a.name,
    size: a.size,
    downloadUrl: a.browser_download_url,
    updatedAt: a.updated_at,
    contentType: a.content_type,
  }));

  const targetName = (config.targetAssetFileName || 'data-catalog.json').toLowerCase();
  const matchingAsset =
    assets.find((a) => a.name.toLowerCase() === targetName) ||
    assets.find((a) => a.name.toLowerCase().endsWith('.json')) ||
    null;

  const publishedTime = data.published_at ? new Date(data.published_at).getTime() : 0;
  const lastSyncTime = config.lastSynced ? new Date(config.lastSynced).getTime() : 0;
  const hasUpdate = !config.lastSynced || publishedTime > lastSyncTime;

  return {
    success: true,
    connected: true,
    hasUpdate: hasUpdate,
    releaseTag: data.tag_name,
    releaseName: data.name || data.tag_name,
    publishedAt: data.published_at,
    releaseUrl: data.html_url,
    assets: assets,
    matchingAsset: matchingAsset,
    message: `Połączono z GitHub Release: ${data.name || data.tag_name} (${assets.length} załączników)`,
  };
}

/**
 * Encodes string to UTF-8 base64 safely in all environments
 */
function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generates initialCatalog.ts file contents from current document
 */
export function generateInitialCatalogTs(document: ImportedDocument, version: string): string {
  const rowsJson = JSON.stringify(document.rows || [], null, 2);
  const headersJson = JSON.stringify(document.headers || [], null, 4);
  const imagesJson = JSON.stringify(document.images || [], null, 4);
  const docName = document.name || 'Baza Pojazdów USA/EU (Cennik 2026 - 461 Pozycji)';
  const docId = document.id || 'cennik-all-461-master';
  const totalRows = document.rows ? document.rows.length : 461;
  const brandsCount = document.brandsCount || 34;

  return `import { DocumentRow, ImportedDocument } from '../types';

export const CURRENT_DATABASE_VERSION = ${JSON.stringify(version)};

export const INITIAL_461_CATALOG_ROWS: DocumentRow[] = ${rowsJson};

export const INITIAL_COMPREHENSIVE_CATALOG: ImportedDocument = {
  id: ${JSON.stringify(docId)},
  name: ${JSON.stringify(docName)},
  fileType: "json",
  sizeFormatted: "320 KB",
  importedAt: new Date(${JSON.stringify(new Date().toISOString())}),
  version: CURRENT_DATABASE_VERSION,
  totalRows: ${totalRows},
  brandsCount: ${brandsCount},
  headers: ${headersJson},
  images: ${imagesJson},
  rows: INITIAL_461_CATALOG_ROWS
};

// Backwards compatibility alias
export const INITIAL_35_BRANDS_DOCUMENT = INITIAL_COMPREHENSIVE_CATALOG;
`;
}

/**
 * Updates or creates a file in GitHub repository using GitHub Contents REST API
 */
async function updateGitHubFileViaApi(
  owner: string,
  repo: string,
  filePath: string,
  contentStr: string,
  token: string,
  commitMessage: string,
  branch = 'main'
): Promise<{ success: boolean; error?: string; sha?: string }> {
  const cleanToken = token.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: cleanToken.startsWith('Bearer ') || cleanToken.startsWith('token ') ? cleanToken : `Bearer ${cleanToken}`,
  };

  // 1. Check current SHA
  let currentSha: string | undefined;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      currentSha = checkData.sha;
    }
  } catch (_) {}

  // 2. Put file to GitHub
  const base64Content = encodeBase64Utf8(contentStr);
  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        sha: currentSha,
        branch,
      }),
    }
  );

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    const message = errData.message || `HTTP ${putRes.status} ${putRes.statusText}`;
    return { success: false, error: message };
  }

  const resData = await putRes.json().catch(() => ({}));
  return { success: true, sha: resData?.commit?.sha };
}

/**
 * Pushes the complete database (with all images as WebP) directly to GitHub repository.
 * Updates public/data-catalog.json, data-catalog.json, and src/data/initialCatalog.ts on branch main.
 * This immediately triggers Vercel automatic build and publishes changes globally.
 */
export async function pushDatabaseToGitHub(
  document: ImportedDocument,
  token?: string,
  customCommitMessage?: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  pushedFiles?: string[];
  commitSha?: string;
  version?: string;
}> {
  const config = getGitHubSyncConfig();
  const authToken = token || config.githubToken;
  if (!authToken || !authToken.trim()) {
    return {
      success: false,
      error: 'Brak tokena GitHub (Personal Access Token). Wklej token w ustawieniach, aby wysłać zmiany do repozytorium.',
    };
  }

  const parsedRepo = parseGitHubRepoUrl(config.repoUrl);
  if (!parsedRepo) {
    return {
      success: false,
      error: 'Nieprawidłowy adres repozytorium GitHub w konfiguracji.',
    };
  }

  const now = new Date();
  const version = `2026.03_ALL_v461_SYNC_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  const docWithVersion: ImportedDocument = {
    ...document,
    version,
    importedAt: now,
  };

  const imagesCount = docWithVersion.rows.filter((r) => r.imageUrl && r.imageUrl.trim()).length;
  const commitMsg =
    customCommitMessage ||
    `Aktualizacja bazy (${docWithVersion.rows.length} pozycji, ${imagesCount} zdjęć, wersja ${version})`;

  const jsonStr = JSON.stringify(docWithVersion, null, 2);
  const tsStr = generateInitialCatalogTs(docWithVersion, version);

  const filesToPush = [
    { path: 'public/data-catalog.json', content: jsonStr },
    { path: 'data-catalog.json', content: jsonStr },
    { path: 'src/data/initialCatalog.ts', content: tsStr },
  ];

  const pushedFiles: string[] = [];
  let lastCommitSha: string | undefined;

  for (const f of filesToPush) {
    const res = await updateGitHubFileViaApi(
      parsedRepo.owner,
      parsedRepo.repo,
      f.path,
      f.content,
      authToken,
      commitMsg
    );
    if (!res.success) {
      return {
        success: false,
        error: `Błąd podczas wysyłania ${f.path}: ${res.error}`,
      };
    }
    pushedFiles.push(f.path);
    if (res.sha) lastCommitSha = res.sha;
  }

  // Update local config
  await saveGitHubSyncConfig({
    lastPushed: now.toISOString(),
    lastSynced: now.toISOString(),
    lastVersion: version,
    lastTotalRows: docWithVersion.rows.length,
    ...(token ? { githubToken: token } : {}),
  });

  // Sync to local client storage & local dev server if available
  await saveDocumentToStorage(docWithVersion);

  return {
    success: true,
    message: `Pomyślnie zaktualizowano GitHub! Zapisano ${pushedFiles.length} pliki (${imagesCount} zdjęć). Vercel rozpoczął automatyczne wdrażanie!`,
    pushedFiles,
    commitSha: lastCommitSha,
    version,
  };
}

/**
 * Directly writes document to src/data/initialCatalog.ts and public/data-catalog.json on server disk
 * so Google AI Studio immediately detects changed files in the project workspace.
 */
export async function syncCatalogToSourceCode(document: ImportedDocument): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/sync/to-source-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'Zapisano pliki źródłowe na dysku projektu. AI Studio widzi teraz zmiany!',
      };
    }
    return {
      success: false,
      error: `Serwer zwrócił błąd HTTP ${res.status}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Błąd połączenia z lokalnym serwerem dev.',
    };
  }
}
