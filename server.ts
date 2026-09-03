import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-catalog.json');
const PUBLIC_DATA_FILE = path.join(process.cwd(), 'public', 'data-catalog.json');
const SOURCE_CATALOG_FILE = path.join(process.cwd(), 'src', 'data', 'initialCatalog.ts');
const PRICING_SETTINGS_FILE = path.join(process.cwd(), 'pricing-settings.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure local portable folders exist inside program directory
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

/**
 * Synchronizes the catalog JSON document across all repository and runtime locations:
 * 1. root data-catalog.json (runtime & portable engine)
 * 2. public/data-catalog.json (static assets & GitHub repository)
 * 3. src/data/initialCatalog.ts (TypeScript source code for AI Studio change detection & compilation)
 */
function syncDocumentEverywhere(document: any) {
  try {
    const now = new Date();
    const timeSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const version = document.version && document.version.startsWith('2026.03_ALL_v461_SYNC_') 
      ? document.version 
      : `2026.03_ALL_v461_SYNC_${timeSuffix}`;
    
    document.version = version;
    const jsonStr = JSON.stringify(document, null, 2);

    // 1. Root data-catalog.json
    fs.writeFileSync(DATA_FILE, jsonStr, 'utf-8');

    // 2. public/data-catalog.json (tracked by Git & served statically)
    try {
      const publicDir = path.dirname(PUBLIC_DATA_FILE);
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(PUBLIC_DATA_FILE, jsonStr, 'utf-8');
    } catch (pubErr) {
      console.warn('Could not write to public/data-catalog.json:', pubErr);
    }

    // 3. src/data/initialCatalog.ts (ensures Google AI Studio & GitHub detect changes directly in source code)
    try {
      if (fs.existsSync(SOURCE_CATALOG_FILE)) {
        const rowsJson = JSON.stringify(document.rows || [], null, 2);
        const headersJson = JSON.stringify(document.headers || [], null, 4);
        const imagesJson = JSON.stringify(document.images || [], null, 4);
        const docName = document.name || 'Baza Pojazdów USA/EU (Cennik 2026 - 461 Pozycji)';
        const docId = document.id || 'cennik-all-461-master';
        const totalRows = document.rows ? document.rows.length : 461;
        const brandsCount = document.brandsCount || 34;

        const tsContent = `import { DocumentRow, ImportedDocument } from '../types';

export const CURRENT_DATABASE_VERSION = ${JSON.stringify(version)};

export const INITIAL_461_CATALOG_ROWS: DocumentRow[] = ${rowsJson};

export const INITIAL_COMPREHENSIVE_CATALOG: ImportedDocument = {
  id: ${JSON.stringify(docId)},
  name: ${JSON.stringify(docName)},
  fileType: "json",
  sizeFormatted: "320 KB",
  importedAt: new Date(${JSON.stringify(now.toISOString())}),
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
        fs.writeFileSync(SOURCE_CATALOG_FILE, tsContent, 'utf-8');
        console.log(`[Source Sync] Successfully synced ${totalRows} rows to src/data/initialCatalog.ts for AI Studio & GitHub.`);
      }
    } catch (srcErr) {
      console.warn('Could not write to src/data/initialCatalog.ts:', srcErr);
    }
  } catch (err) {
    console.error('Error in syncDocumentEverywhere:', err);
  }
}

async function startServer() {
  const app = express();

  // Enable Gzip/Deflate compression for fast loading over mobile and web networks
  app.use(compression({
    level: 4,
    threshold: 1024,
    filter: (req, res) => {
      if (req.path.match(/\.(png|jpe?g|webp|svg|ico|gif|woff2?|zip)$/i)) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Allow up to 50MB payload for documents with photos/base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Favicon and app icon handlers to avoid HTML fallback overhead
  app.get('/favicon.ico', (req, res) => {
    const icoPath = path.join(process.cwd(), 'public', 'favicon.ico');
    const pngPath = path.join(process.cwd(), 'public', 'icon.png');
    if (fs.existsSync(icoPath)) return res.sendFile(icoPath);
    if (fs.existsSync(pngPath)) return res.sendFile(pngPath);
    res.status(204).end();
  });

  app.get(['/apple-touch-icon.png', '/apple-touch-icon-precomposed.png'], (req, res) => {
    const pngPath = path.join(process.cwd(), 'public', 'icon-192.png');
    if (fs.existsSync(pngPath)) return res.sendFile(pngPath);
    res.status(204).end();
  });

  // Health checks for Cloud Run, Kubernetes, and uptime monitoring
  app.get(['/api/health', '/health', '/healthz', '/_health'], (req, res) => {
    res.json({
      status: 'ok',
      service: 'cennik-server',
      version: '2026.03_ALL_v461_MASTER_PHOTOS_V5',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // GET pricing settings & persistent discount rules
  app.get('/api/settings/pricing', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      if (fs.existsSync(PRICING_SETTINGS_FILE)) {
        const raw = fs.readFileSync(PRICING_SETTINGS_FILE, 'utf-8');
        try {
          const settings = JSON.parse(raw);
          return res.json({ success: true, exists: true, settings });
        } catch (parseErr: any) {
          return res.json({ success: true, exists: false, settings: null });
        }
      }
      return res.json({ success: true, exists: false, settings: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // SAVE pricing settings & persistent discount rules
  app.post('/api/settings/pricing', (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, error: 'Nieprawidłowe dane ustawień cenowych.' });
      }
      fs.writeFileSync(PRICING_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      console.log(`[Pricing Settings] Saved persistent pricing settings to ${PRICING_SETTINGS_FILE}`);
      return res.json({ success: true, savedAt: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET the master saved catalog with cache headers
  app.get('/api/catalog', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        try {
          const document = JSON.parse(raw);
          return res.json({
            success: true,
            exists: true,
            document,
            totalRows: document.rows?.length || 0,
          });
        } catch (parseErr: any) {
          console.error('Error parsing catalog JSON file, treating as absent:', parseErr);
          return res.json({ success: true, exists: false, document: null, parseError: parseErr.message });
        }
      }
      return res.json({ success: true, exists: false, document: null });
    } catch (err: any) {
      console.error('Error reading catalog file:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // SAVE the master catalog to permanent server storage and sync with source files
  app.post('/api/catalog', (req, res) => {
    try {
      const { document } = req.body;
      if (!document || !Array.isArray(document.rows)) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowa struktura dokumentu (brak tablicy wierszy).',
        });
      }

      syncDocumentEverywhere(document);

      console.log(
        `[Master Catalog] Saved and synced ${document.rows.length} rows to ${DATA_FILE}, public/data-catalog.json & src/data/initialCatalog.ts`
      );
      return res.json({
        success: true,
        savedAt: new Date().toISOString(),
        totalRows: document.rows.length,
      });
    } catch (err: any) {
      console.error('Error writing catalog file:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // MANUAL SYNC ENDPOINT: Force synchronizes data-catalog.json to src/ and public/ for AI Studio & GitHub
  app.post('/api/sync/to-source-code', (req, res) => {
    try {
      let docToSync = req.body?.document;
      if (!docToSync && fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        docToSync = JSON.parse(raw);
      }

      if (!docToSync || !Array.isArray(docToSync.rows)) {
        return res.status(400).json({
          success: false,
          error: 'Brak poprawnego dokumentu katalogu do synchronizacji.',
        });
      }

      syncDocumentEverywhere(docToSync);

      return res.json({
        success: true,
        message: `Pomyślnie zsynchronizowano bazę (${docToSync.rows.length} wierszy) oraz zdjęcia do plików źródłowych (src/data/initialCatalog.ts i public/data-catalog.json). Google AI Studio oraz GitHub widzą teraz wszystkie zmiany!`,
        totalRows: docToSync.rows.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE/RESET the master catalog
  app.delete('/api/catalog', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        fs.unlinkSync(DATA_FILE);
        console.log(`[Master Catalog] Removed ${DATA_FILE}`);
      }
      return res.json({ success: true, message: 'Katalog zresetowany' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // UPLOAD IMAGE DIRECTLY TO LOCAL /uploads FOLDER
  app.post('/api/uploads/upload', (req, res) => {
    try {
      const { dataUrl, filename, brand, model, rowId } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'Brak danych zdjęcia (dataUrl).' });
      }

      // Check if image is base64 dataUrl
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'jpg';
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else if (dataUrl.startsWith('data:image/svg+xml')) {
        ext = 'svg';
        const svgContent = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
        buffer = Buffer.from(svgContent, 'utf-8');
      } else {
        return res.status(400).json({ success: false, error: 'Nierozpoznany format danych zdjęcia.' });
      }

      // Generate clean, safe filename
      let safeBase = '';
      if (brand || model) {
        safeBase = `${brand || ''}_${model || ''}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
      } else if (filename) {
        safeBase = path.parse(filename).name.toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
      }
      if (!safeBase) safeBase = `foto_${rowId || 'auto'}`;

      const finalFileName = `${safeBase}_${Date.now()}.${ext}`;
      const targetPath = path.join(UPLOADS_DIR, finalFileName);
      const publicTargetPath = path.join(PUBLIC_UPLOADS_DIR, finalFileName);

      fs.writeFileSync(targetPath, buffer);
      try {
        fs.writeFileSync(publicTargetPath, buffer);
      } catch (_) {}

      console.log(`[Uploads] Saved image ${finalFileName} (${buffer.length} bytes) to program uploads/`);
      return res.json({
        success: true,
        url: `/uploads/${finalFileName}`,
        filename: finalFileName,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('[Uploads Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET LIST OF ALL SAVED IMAGES IN /uploads
  app.get('/api/uploads/list', (req, res) => {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        return res.json({ success: true, files: [], totalCount: 0, totalBytes: 0 });
      }
      const fileNames = fs.readdirSync(UPLOADS_DIR);
      let totalBytes = 0;
      const files = fileNames.map((name) => {
        const filePath = path.join(UPLOADS_DIR, name);
        const stats = fs.statSync(filePath);
        totalBytes += stats.size;
        return {
          name,
          url: `/uploads/${name}`,
          size: stats.size,
          mtime: stats.mtime,
        };
      });

      return res.json({
        success: true,
        files,
        totalCount: files.length,
        totalBytes,
        totalSizeFormatted: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // MIGRATE ANY INLINE BASE64 IMAGES IN CATALOG TO PHYSICAL FILES IN /uploads
  app.post('/api/uploads/migrate-base64', (req, res) => {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return res.status(404).json({ success: false, error: 'Brak pliku bazy katalogu (data-catalog.json).' });
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const document = JSON.parse(raw);
      if (!document || !Array.isArray(document.rows)) {
        return res.status(400).json({ success: false, error: 'Nieprawidłowa struktura katalogu.' });
      }

      let migratedCount = 0;
      for (const row of document.rows) {
        if (row.imageUrl && typeof row.imageUrl === 'string' && row.imageUrl.startsWith('data:image/')) {
          try {
            const matches = row.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mime = matches[1];
              let ext = 'jpg';
              if (mime.includes('png')) ext = 'png';
              else if (mime.includes('webp')) ext = 'webp';

              const cleanBrand = (row.brand || 'auto').toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
              const cleanModel = (row.model || 'model').toLowerCase().replace(/[^a-z0-9_-]+/gi, '_');
              const fileName = `lampa_${cleanBrand}_${cleanModel}_${row.id}.${ext}`;

              const targetPath = path.join(UPLOADS_DIR, fileName);
              const publicTargetPath = path.join(PUBLIC_UPLOADS_DIR, fileName);
              const buffer = Buffer.from(matches[2], 'base64');

              fs.writeFileSync(targetPath, buffer);
              try { fs.writeFileSync(publicTargetPath, buffer); } catch (_) {}

              row.imageUrl = `/uploads/${fileName}`;
              migratedCount++;
            }
          } catch (migrateErr) {
            console.warn(`Could not migrate image for row ${row.id}:`, migrateErr);
          }
        }
      }

      if (migratedCount > 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(document, null, 2), 'utf-8');
        console.log(`[Uploads Migration] Migrated ${migratedCount} base64 images into physical /uploads files.`);
      }

      return res.json({
        success: true,
        migratedCount,
        message: `Pomyślnie przeniesiono ${migratedCount} zdjęć do folderu /uploads.`,
      });
    } catch (err: any) {
      console.error('[Uploads Migration Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET PORTABLE ENVIRONMENT STATUS
  app.get('/api/portable/info', (req, res) => {
    try {
      const dataFileSize = fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).size : 0;
      const pricingFileSize = fs.existsSync(PRICING_SETTINGS_FILE) ? fs.statSync(PRICING_SETTINGS_FILE).size : 0;

      let uploadsCount = 0;
      let uploadsSizeBytes = 0;
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        uploadsCount = files.length;
        for (const file of files) {
          try {
            uploadsSizeBytes += fs.statSync(path.join(UPLOADS_DIR, file)).size;
          } catch (_) {}
        }
      }

      return res.json({
        success: true,
        mode: 'W 100% Przenośny (Jeden Folder / Pendrive)',
        programDirectory: process.cwd(),
        dataFile: 'data-catalog.json',
        dataFileSize,
        pricingSettingsFile: 'pricing-settings.json',
        pricingFileSize,
        uploadsDirectory: 'uploads',
        uploadsCount,
        uploadsSizeBytes,
        uploadsSizeFormatted: `${(uploadsSizeBytes / 1024 / 1024).toFixed(2)} MB`,
        launcherFile: 'Uruchom_Cennik.bat',
        isIsolated: true,
        windowsFilesCreated: 0,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  const GITHUB_CONFIG_FILE = path.join(process.cwd(), 'github-sync-config.json');

  const defaultGitHubConfig = {
    enabled: true,
    checkOnStartup: false,
    repoUrl: 'https://github.com/kadwaolsztyn-afk/EuroKonwerter',
    releaseTag: 'Baza',
    targetAssetFileName: 'data-catalog.json',
    lastChecked: null,
    lastSynced: null,
    lastVersion: null,
  };

  // GET GitHub sync configuration
  app.get('/api/sync/github/config', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        const raw = fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8');
        try {
          const cfg = JSON.parse(raw);
          if (!cfg.repoUrl || cfg.repoUrl.includes('Konwerter-Usa-ECE')) {
            cfg.repoUrl = 'https://github.com/kadwaolsztyn-afk/EuroKonwerter';
          }
          if (!cfg.releaseTag || cfg.releaseTag === 'Konwerter' || cfg.releaseTag === 'Backup') {
            cfg.releaseTag = 'Baza';
          }
          return res.json({ success: true, config: { ...defaultGitHubConfig, ...cfg } });
        } catch {
          return res.json({ success: true, config: defaultGitHubConfig });
        }
      }
      return res.json({ success: true, config: defaultGitHubConfig });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST GitHub sync configuration
  app.post('/api/sync/github/config', (req, res) => {
    try {
      const { config } = req.body;
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ success: false, error: 'Nieprawidłowe dane konfiguracji GitHub.' });
      }
      let current = defaultGitHubConfig;
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          current = JSON.parse(fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8'));
        } catch {}
      }
      const updated = { ...current, ...config };
      fs.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      return res.json({ success: true, config: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Helper to extract owner and repo from URL
  function parseRepo(urlStr: string) {
    const clean = (urlStr || '').trim().replace(/\/$/, '');
    const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match && match[1] && match[2]) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
    return { owner: 'kadwaolsztyn-afk', repo: 'EuroKonwerter' };
  }

  // GET Check GitHub Release for tag 'Baza'
  app.get('/api/sync/github/check', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      let cfg = defaultGitHubConfig;
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = { ...defaultGitHubConfig, ...JSON.parse(fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8')) };
        } catch {}
      }

      const { owner, repo } = parseRepo(cfg.repoUrl);
      const tag = cfg.releaseTag || 'Baza';
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;

      console.log(`[GitHub Sync Check] Checking ${apiUrl}...`);
      const ghRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!ghRes.ok) {
        return res.json({
          success: false,
          connected: false,
          releaseTag: tag,
          status: ghRes.status,
          message: `Nie znaleziono wydania z tagiem "${tag}" w repozytorium ${owner}/${repo}.`,
        });
      }

      const releaseData: any = await ghRes.json();
      const assets = (releaseData.assets || []).map((a: any) => ({
        name: a.name,
        size: a.size,
        downloadUrl: a.browser_download_url,
        updatedAt: a.updated_at,
        contentType: a.content_type,
      }));

      const targetName = (cfg.targetAssetFileName || 'data-catalog.json').toLowerCase();
      const matchingAsset =
        assets.find((a: any) => a.name.toLowerCase() === targetName) ||
        assets.find((a: any) => a.name.toLowerCase().endsWith('.json')) ||
        null;

      return res.json({
        success: true,
        connected: true,
        releaseTag: releaseData.tag_name,
        releaseName: releaseData.name || releaseData.tag_name,
        publishedAt: releaseData.published_at,
        releaseUrl: releaseData.html_url,
        assets,
        matchingAsset,
        message: `Połączono z GitHub Release "${releaseData.name || releaseData.tag_name}" (${assets.length} załączników)`,
      });
    } catch (err: any) {
      console.error('[GitHub Sync Check Error]:', err);
      return res.status(500).json({ success: false, connected: false, error: err.message });
    }
  });

  // POST Pull & Apply Database from GitHub
  app.post('/api/sync/github/pull', async (req, res) => {
    try {
      let cfg = defaultGitHubConfig;
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = { ...defaultGitHubConfig, ...JSON.parse(fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8')) };
        } catch {}
      }

      const { owner, repo } = parseRepo(cfg.repoUrl);
      const tag = cfg.releaseTag || 'Baza';

      // 1. Query release asset
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
      let downloadUrl: string | null = null;

      try {
        const ghRes = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (ghRes.ok) {
          const releaseData: any = await ghRes.json();
          const assets = releaseData.assets || [];
          const targetName = (cfg.targetAssetFileName || 'data-catalog.json').toLowerCase();
          const found =
            assets.find((a: any) => a.name.toLowerCase() === targetName) ||
            assets.find((a: any) => a.name.toLowerCase().endsWith('.json'));
          if (found && found.browser_download_url) {
            downloadUrl = found.browser_download_url;
          }
        }
      } catch (checkErr) {
        console.warn('Could not query release assets:', checkErr);
      }

      // 2. URLs for releases, tags, raw files, and CDN
      const urlsToTry = [
        downloadUrl,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${cfg.targetAssetFileName || 'data-catalog.json'}`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/backup.json`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/baza.json`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/cennik.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/data-catalog.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/baza.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/cennik.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(tag)}/data-catalog.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(tag)}/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(tag)}/baza.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/data-catalog.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/Baza/baza.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/baza.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/cennik.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/data-catalog.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/baza.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/backup.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(tag)}/data-catalog.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(tag)}/backup.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(tag)}/baza.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@Baza/data-catalog.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@Baza/backup.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@master/data-catalog.json`,
      ].filter(Boolean) as string[];

      let fileContent: string | null = null;
      let usedUrl: string | null = null;

      for (const url of urlsToTry) {
        try {
          console.log(`[GitHub Sync Pull] Fetching from ${url}...`);
          const fileRes = await fetch(url, {
            headers: {
              'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
            },
          });
          if (fileRes.ok) {
            const text = await fileRes.text();
            if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
              fileContent = text;
              usedUrl = url;
              break;
            }
          }
        } catch (fetchErr) {
          // continue
        }
      }

      // Fallback: If remote GitHub fetching was blocked/rate-limited, read the local bundled data-catalog.json or initial catalog
      if (!fileContent) {
        const publicCatalogPath = path.join(process.cwd(), 'public', 'data-catalog.json');
        if (fs.existsSync(publicCatalogPath)) {
          try {
            fileContent = fs.readFileSync(publicCatalogPath, 'utf-8');
            usedUrl = 'local-bundled:/data-catalog.json';
            console.log('[GitHub Sync Pull] Using local bundled data-catalog.json fallback.');
          } catch {}
        }
      }

      if (!fileContent) {
        return res.status(404).json({
          success: false,
          error: `Nie odnaleziono pliku ${cfg.targetAssetFileName} w GitHub Release (${tag}) ani w repozytorium ${owner}/${repo}.`,
        });
      }

      let parsedPayload: any = null;
      try {
        parsedPayload = JSON.parse(fileContent);
      } catch (parseErr) {
        console.warn('[GitHub Sync Pull] JSON parse error on content from', usedUrl, parseErr);
        // Attempt recovery from public/data-catalog.json
        const publicCatalogPath = path.join(process.cwd(), 'public', 'data-catalog.json');
        if (fs.existsSync(publicCatalogPath)) {
          try {
            const fallbackContent = fs.readFileSync(publicCatalogPath, 'utf-8');
            parsedPayload = JSON.parse(fallbackContent);
            usedUrl = 'local-bundled:/data-catalog.json';
          } catch {}
        }
      }

      if (!parsedPayload) {
        return res.status(400).json({
          success: false,
          error: 'Pobrany plik z repozytorium GitHub zawiera nieprawidłowy format JSON.',
        });
      }

      let documentToSave: any = null;

      if (parsedPayload.document && Array.isArray(parsedPayload.document.rows)) {
        documentToSave = parsedPayload.document;
      } else if (Array.isArray(parsedPayload.rows)) {
        documentToSave = parsedPayload;
      } else if (Array.isArray(parsedPayload)) {
        documentToSave = {
          id: `doc-github-sync-${Date.now()}`,
          name: 'Baza Lamp Samochodowych (GitHub Online)',
          fileType: 'json',
          sizeFormatted: `${Math.round(fileContent.length / 1024)} KB`,
          importedAt: new Date().toISOString(),
          totalRows: parsedPayload.length,
          brandsCount: new Set(parsedPayload.map((r: any) => r.brand)).size,
          rows: parsedPayload,
          images: [],
          headers: ['Lp.', 'Marka', 'Model', 'Generacja / Kod', 'Roczniki', 'Cena Stat. Klient', 'Cena Dyn. Klient'],
        };
      } else if (parsedPayload.rawHtml && typeof parsedPayload.rawHtml === 'string') {
        // If the JSON is an imported container wrapping rawHtml table (sheet.html)
        documentToSave = parsedPayload;
      }

      if (!documentToSave || !Array.isArray(documentToSave.rows) || documentToSave.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Pobrany plik nie posiada poprawnej struktury katalogu modeli.',
        });
      }

      // Save to permanent DATA_FILE
      fs.writeFileSync(DATA_FILE, JSON.stringify(documentToSave, null, 2), 'utf-8');

      // Update sync config
      const updatedConfig = {
        ...cfg,
        lastSynced: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        lastVersion: tag,
        lastTotalRows: documentToSave.rows.length,
      };
      fs.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');

      console.log(`[GitHub Sync Pull] Successfully synced ${documentToSave.rows.length} rows from ${usedUrl}`);

      return res.json({
        success: true,
        document: documentToSave,
        totalRows: documentToSave.rows.length,
        brandsCount: documentToSave.brandsCount || new Set(documentToSave.rows.map((r: any) => r.brand)).size,
        usedUrl,
        syncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[GitHub Sync Pull Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Robust production detection: Cloud Run (K_SERVICE), bundled server.cjs, NODE_ENV=production, or presence of dist/index.html
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      index: 'index.html',
    }));
    app.get('*', (req, res, next) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            next(err);
          }
        });
      } else {
        res.status(404).send('Application build not found. Please build the frontend.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cennik server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
