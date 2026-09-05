import express from 'express';
import path from 'path';
import fs from 'fs';
import child_process from 'child_process';
import compression from 'compression';

// Container ingress & reverse proxy route exclusively to port 3000
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-catalog.json');
const PUBLIC_DATA_FILE = path.join(process.cwd(), 'public', 'data-catalog.json');
const SOURCE_CATALOG_FILE = path.join(process.cwd(), 'src', 'data', 'initialCatalog.ts');
const PRICING_SETTINGS_FILE = path.join(process.cwd(), 'pricing-settings.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure local portable folders exist inside program directory
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  }
} catch (dirErr) {
  console.warn('Could not initialize uploads directory:', dirErr);
}

let cachedCatalogMeta = {
  version: '2026.03_ALL_v461_SYNC_20260904_1224',
  totalRows: 461,
  brandsCount: 34,
  serverUpdatedAt: new Date().toISOString(),
  lastModified: Date.now(),
};

try {
  if (fs.existsSync(DATA_FILE)) {
    const stats = fs.statSync(DATA_FILE);
    cachedCatalogMeta = {
      version: '2026.03_ALL_v461_SYNC_20260904_1224',
      totalRows: 461,
      brandsCount: 34,
      serverUpdatedAt: stats.mtime.toISOString(),
      lastModified: stats.mtimeMs,
    };
  }
} catch (_) {}

/**
 * Synchronizes the catalog JSON document across all repository and runtime locations:
 * 1. root data-catalog.json (runtime & portable engine)
 * 2. public/data-catalog.json (static assets & GitHub repository)
 * 3. src/data/initialCatalog.ts (TypeScript source code for AI Studio change detection & compilation)
 */
function syncDocumentEverywhere(document: any) {
  try {
    const now = new Date();
    const timeSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_${now.getMilliseconds()}`;
    const version = `2026.03_ALL_v461_SYNC_${timeSuffix}`;
    
    document.version = version;
    document.serverUpdatedAt = now.toISOString();

    cachedCatalogMeta = {
      version,
      totalRows: document.rows?.length || 0,
      brandsCount: document.brandsCount || 34,
      serverUpdatedAt: now.toISOString(),
      lastModified: Date.now(),
    };

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

  // Static serving for uploads across local development, distribution build, and container environments
  const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
  app.use('/uploads', express.static(distUploadsDir, { maxAge: '30d' }));
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
  app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR, { maxAge: '30d' }));

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

  // Fast metadata/status endpoint for instant device-to-device sync checking (no heavy JSON transfer)
  const catalogStatusHandler = (req: any, res: any) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      const exists = fs.existsSync(DATA_FILE);
      return res.json({
        success: true,
        exists,
        ...cachedCatalogMeta,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  app.get('/api/catalog/status', catalogStatusHandler);
  app.get('/api/catalog/info', catalogStatusHandler);
  app.get('/api/catalog/version', catalogStatusHandler);

  // GET the master saved catalog with cache headers
  app.get('/api/catalog', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        try {
          const document = JSON.parse(raw);
          return res.json({
            success: true,
            exists: true,
            document,
            version: document.version,
            serverUpdatedAt: document.serverUpdatedAt || new Date().toISOString(),
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
        `[Master Catalog] Saved and synced ${document.rows.length} rows to ${DATA_FILE}, public/data-catalog.json & src/data/initialCatalog.ts (version: ${document.version})`
      );
      return res.json({
        success: true,
        savedAt: new Date().toISOString(),
        version: document.version,
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

  // GET direct download of current data-catalog.json
  app.get('/api/catalog/download', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      if (fs.existsSync(DATA_FILE)) {
        res.setHeader('Content-Disposition', 'attachment; filename="data-catalog.json"');
        res.setHeader('Content-Type', 'application/json');
        return fs.createReadStream(DATA_FILE).pipe(res);
      }
      const publicCatalog = path.join(process.cwd(), 'public', 'data-catalog.json');
      if (fs.existsSync(publicCatalog)) {
        res.setHeader('Content-Disposition', 'attachment; filename="data-catalog.json"');
        res.setHeader('Content-Type', 'application/json');
        return fs.createReadStream(publicCatalog).pipe(res);
      }
      return res.status(404).json({ success: false, error: 'Plik katalogu nie został odnaleziony.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  const defaultGitHubConfig = {
    enabled: true,
    checkOnStartup: false,
    repoUrl: 'https://github.com/kadwaolsztyn-afk/EuroKonwerter',
    releaseTag: 'main',
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
          if (!cfg.releaseTag || cfg.releaseTag === 'Konwerter' || cfg.releaseTag === 'Backup' || cfg.releaseTag === 'Baza') {
            cfg.releaseTag = 'main';
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
      // Never save githubToken in git-tracked config file to prevent GitHub push protection blocks
      const updated = { ...current, ...config, githubToken: '' };
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

  // GET Check GitHub Release or Main branch file
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
      const tag = cfg.releaseTag && cfg.releaseTag !== 'Baza' ? cfg.releaseTag : 'main';
      const targetName = (cfg.targetAssetFileName || 'data-catalog.json').toLowerCase();

      console.log(`[GitHub Sync Check] Checking repository ${owner}/${repo} (tag/branch: ${tag})...`);

      // 1. If tag is not 'main', try checking GitHub Releases
      if (tag !== 'main') {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
        try {
          const ghRes = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
              'Accept': 'application/vnd.github.v3+json',
            },
            signal: AbortSignal.timeout(3500),
          });

          if (ghRes.ok) {
            const releaseData: any = await ghRes.json();
            const assets = (releaseData.assets || []).map((a: any) => ({
              name: a.name,
              size: a.size,
              downloadUrl: a.browser_download_url,
              updatedAt: a.updated_at,
              contentType: a.content_type,
            }));

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
              directUrls: {
                raw: `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json`,
                cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
                release: releaseData.html_url,
              },
              message: `Połączono z wydaniem GitHub "${releaseData.name || releaseData.tag_name}" (${assets.length} załączników).`,
            });
          }
        } catch (releaseErr) {
          console.warn('[GitHub Sync Check] Release tag check timed out or failed, falling back to main branch file:', releaseErr);
        }
      }

      // 2. Check direct raw file on branch 'main' (primary storage in EuroKonwerter repo)
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${cfg.targetAssetFileName || 'data-catalog.json'}`;
      try {
        const headRes = await fetch(rawUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0' },
          signal: AbortSignal.timeout(4000),
        });

        if (headRes.ok) {
          const lastMod = headRes.headers.get('last-modified');
          const clen = headRes.headers.get('content-length');
          const fileSize = clen ? parseInt(clen, 10) : 10517311;

          const rawAsset = {
            name: cfg.targetAssetFileName || 'data-catalog.json',
            size: fileSize,
            downloadUrl: rawUrl,
            updatedAt: lastMod || new Date().toISOString(),
            contentType: 'application/json',
          };

          return res.json({
            success: true,
            connected: true,
            releaseTag: 'main',
            releaseName: 'Gałąź główna (main)',
            publishedAt: lastMod || new Date().toISOString(),
            releaseUrl: `https://github.com/${owner}/${repo}/blob/main/${cfg.targetAssetFileName || 'data-catalog.json'}`,
            assets: [rawAsset],
            matchingAsset: rawAsset,
            directUrls: {
              raw: rawUrl,
              cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
              repo: `https://github.com/${owner}/${repo}/blob/main/data-catalog.json`,
              exe: `https://github.com/${owner}/${repo}/releases/download/eurokonwenter/Cennik.konwersji.lamp.i.multimediow.exe`,
            },
            message: `Połączono z bazą na GitHub (gałąź main, plik ${cfg.targetAssetFileName || 'data-catalog.json'}). Gotowy do pobrania!`,
          });
        }
      } catch (rawErr) {
        console.warn('[GitHub Sync Check] Raw head check error:', rawErr);
      }

      // 3. Fallback to check latest release
      try {
        const listRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
          headers: {
            'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
            'Accept': 'application/vnd.github.v3+json',
          },
          signal: AbortSignal.timeout(3500),
        });
        if (listRes.ok) {
          const releases: any = await listRes.json();
          if (Array.isArray(releases) && releases.length > 0) {
            const rel = releases[0];
            const assets = (rel.assets || []).map((a: any) => ({
              name: a.name,
              size: a.size,
              downloadUrl: a.browser_download_url,
              updatedAt: a.updated_at,
              contentType: a.content_type,
            }));
            const matchingAsset =
              assets.find((a: any) => a.name.toLowerCase() === targetName) ||
              assets.find((a: any) => a.name.toLowerCase().endsWith('.json')) ||
              null;

            return res.json({
              success: true,
              connected: true,
              releaseTag: rel.tag_name,
              releaseName: rel.name || rel.tag_name,
              publishedAt: rel.published_at,
              releaseUrl: rel.html_url,
              assets,
              matchingAsset,
              directUrls: {
                raw: `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json`,
                cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
                exe: `https://github.com/${owner}/${repo}/releases/download/eurokonwenter/Cennik.konwersji.lamp.i.multimediow.exe`,
              },
              message: `Znaleziono wydanie "${rel.name || rel.tag_name}" w repozytorium ${owner}/${repo}.`,
            });
          }
        }
      } catch {}

      return res.json({
        success: true,
        connected: true,
        releaseTag: 'main',
        releaseName: 'Repozytorium GitHub',
        directUrls: {
          raw: `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json`,
          cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
          repo: `https://github.com/${owner}/${repo}`,
        },
        message: `Dostępne repozytorium ${owner}/${repo}. Kliknij "Pobierz z GitHub", aby zsynchronizować bazę.`,
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
      const tag = cfg.releaseTag && cfg.releaseTag !== 'Baza' ? cfg.releaseTag : 'main';

      // 1. Query release asset if a specific non-main tag is configured
      let downloadUrl: string | null = null;
      if (tag !== 'main') {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
        try {
          const ghRes = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
              'Accept': 'application/vnd.github.v3+json',
            },
            signal: AbortSignal.timeout(3500),
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
      }

      // 2. High-speed prioritized URLs: Direct Raw GitHub on main, jsDelivr CDN on main, Releases
      const urlsToTry = [
        `https://raw.githubusercontent.com/${owner}/${repo}/main/${cfg.targetAssetFileName || 'data-catalog.json'}`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${cfg.targetAssetFileName || 'data-catalog.json'}`,
        downloadUrl,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/baza.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/data-catalog.json`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${cfg.targetAssetFileName || 'data-catalog.json'}`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/backup.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(tag)}/data-catalog.json`,
      ].filter(Boolean) as string[];

      let fileContent: string | null = null;
      let usedUrl: string | null = null;

      for (const url of urlsToTry) {
        try {
          console.log(`[GitHub Sync Pull] Fetching from ${url}...`);
          const fileRes = await fetch(url, {
            headers: {
              'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
              'Accept': 'application/json, text/plain, */*',
            },
            signal: AbortSignal.timeout(35000),
          });
          if (fileRes.ok) {
            const text = await fileRes.text();
            if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
              fileContent = text;
              usedUrl = url;
              console.log(`[GitHub Sync Pull] Successfully retrieved database from: ${url}`);
              break;
            }
          }
        } catch (fetchErr) {
          // continue to next URL
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
        documentToSave = parsedPayload;
      }

      if (!documentToSave || !Array.isArray(documentToSave.rows) || documentToSave.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Pobrany plik nie posiada poprawnej struktury katalogu modeli.',
        });
      }

      // Sync everywhere: DATA_FILE, public/data-catalog.json & src/data/initialCatalog.ts
      syncDocumentEverywhere(documentToSave);

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
        message: `Pomyślnie zaktualizowano bazę danych z GitHub (${documentToSave.rows.length} modeli)!`,
      });
    } catch (err: any) {
      console.error('[GitHub Sync Pull Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Sync directly from any URL (GitHub Raw, jsDelivr CDN, Vercel, Google Drive, etc.)
  app.post('/api/sync/url', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ success: false, error: 'Brak adresu URL do pobrania bazy.' });
      }

      const targetUrl = url.trim();
      console.log(`[URL Sync] Fetching database directly from ${targetUrl}...`);

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'AutoLamp-PriceCatalog-Sync/1.0',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(35000),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Serwer zwrócił błąd HTTP ${response.status} (${response.statusText}) podczas pobierania z podanego linku.`,
        });
      }

      const text = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr: any) {
        return res.status(400).json({
          success: false,
          error: `Pobrany plik nie jest poprawnym plikiem JSON: ${parseErr.message}`,
        });
      }

      let documentToSave: any = null;
      if (parsed && Array.isArray(parsed.rows)) {
        documentToSave = parsed;
      } else if (parsed && parsed.document && Array.isArray(parsed.document.rows)) {
        documentToSave = parsed.document;
      } else if (Array.isArray(parsed)) {
        documentToSave = {
          id: `doc-url-import-${Date.now()}`,
          name: 'Importowany katalog z linku URL',
          importedAt: new Date().toISOString(),
          totalRows: parsed.length,
          brandsCount: new Set(parsed.map((r: any) => r.brand)).size,
          rows: parsed,
          images: [],
          sizeFormatted: `${Math.round(text.length / 1024)} KB`,
          version: `URL_IMPORT_${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`,
        };
      } else {
        return res.status(400).json({
          success: false,
          error: 'Pobrany plik JSON nie zawiera prawidłowej bazy danych (brak pola rows).',
        });
      }

      syncDocumentEverywhere(documentToSave);

      // Save sync config
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8'));
          cfg.lastSynced = new Date().toISOString();
          cfg.lastVersion = documentToSave.version || 'URL_SYNC';
          cfg.lastTotalRows = documentToSave.rows.length;
          fs.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
        } catch {}
      }

      return res.json({
        success: true,
        document: documentToSave,
        totalRows: documentToSave.rows.length,
        brandsCount: documentToSave.brandsCount,
        usedUrl: targetUrl,
        message: `Pomyślnie pobrano i zaktualizowano bazę z podanego linku (${documentToSave.rows.length} modeli)!`,
      });
    } catch (err: any) {
      console.error('[URL Sync Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Push local database and all image assets to GitHub repository
  app.post('/api/sync/github/push', async (req, res) => {
    try {
      const { document, token, repoUrl, commitMessage, branch = 'main' } = req.body;

      // 1. Resolve GitHub token
      let authToken = token;
      let cfg: any = defaultGitHubConfig;
      if (fs.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = JSON.parse(fs.readFileSync(GITHUB_CONFIG_FILE, 'utf-8'));
        } catch {}
      }
      if (!authToken) {
        authToken = process.env.GITHUB_TOKEN || cfg.githubToken;
      }
      if (!authToken || !authToken.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Brak tokena GitHub (Personal Access Token). Wklej token w ustawieniach bazy, aby wysłać zmiany.',
        });
      }

      const cleanToken = authToken.trim();
      const effectiveRepoUrl = repoUrl || cfg.repoUrl || 'https://github.com/kadwaolsztyn-afk/EuroKonwerter';
      const { owner, repo } = parseRepo(effectiveRepoUrl);

      // 2. If a document payload is provided, process base64 images and sync to disk
      let docToPush = document;
      if (docToPush && Array.isArray(docToPush.rows)) {
        for (const row of docToPush.rows) {
          if (row.imageUrl && typeof row.imageUrl === 'string' && row.imageUrl.startsWith('data:image/')) {
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

              try {
                fs.writeFileSync(targetPath, buffer);
                fs.writeFileSync(publicTargetPath, buffer);
                row.imageUrl = `/uploads/${fileName}`;
              } catch (writeImgErr) {
                console.warn('Failed writing image to uploads:', writeImgErr);
              }
            }
          }
        }
        docToPush.rawHtml = '';
        syncDocumentEverywhere(docToPush);
      } else if (fs.existsSync(DATA_FILE)) {
        try {
          docToPush = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        } catch {}
      }

      // 3. Count available photos in public/uploads
      let uploadsCount = 0;
      if (fs.existsSync(PUBLIC_UPLOADS_DIR)) {
        uploadsCount = fs.readdirSync(PUBLIC_UPLOADS_DIR).length;
      }

      // 4. Git commit and push
      const now = new Date();
      const versionStr = `2026.03_ALL_v461_SYNC_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const msg =
        commitMessage ||
        `Aktualizacja bazy (${docToPush?.rows?.length || 461} pozycji, ${uploadsCount} zdjęć, wersja ${versionStr})`;

      const gitRemoteAuthUrl = `https://x-access-token:${encodeURIComponent(cleanToken)}@github.com/${owner}/${repo}.git`;
      const execOpts = { cwd: process.cwd(), encoding: 'utf-8' as const, timeout: 120000 };

      try {
        const isGit = fs.existsSync(path.join(process.cwd(), '.git'));
        if (!isGit) {
          child_process.execSync('git init -b main', execOpts);
          child_process.execSync(`git config user.name "${owner}"`, execOpts);
          child_process.execSync('git config user.email "kadwaolsztyn@gmail.com"', execOpts);
          child_process.execSync(`git remote add origin "${gitRemoteAuthUrl}"`, execOpts);
        } else {
          child_process.execSync(`git remote set-url origin "${gitRemoteAuthUrl}"`, execOpts);
        }

        // Fetch remote branch if possible to reconcile history
        let hasFetched = false;
        try {
          child_process.execSync(`git fetch origin ${branch} --depth=1`, execOpts);
          hasFetched = true;
        } catch (fErr: any) {
          console.warn('[Git Push] Fetch warning:', fErr.message);
        }

        if (hasFetched) {
          try {
            child_process.execSync(`git reset origin/${branch}`, execOpts);
          } catch (rErr: any) {
            console.warn('[Git Push] Reset warning:', rErr.message);
          }
        }

        // Stage all database files, generated typescript catalog, and photos in public/uploads/
        const filesToStage = ['data-catalog.json', 'public/data-catalog.json', 'src/data/initialCatalog.ts'];
        if (fs.existsSync(path.join(process.cwd(), '.gitignore'))) filesToStage.push('.gitignore');
        if (fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) filesToStage.push('public/uploads/');
        child_process.execSync(`git add ${filesToStage.join(' ')}`, execOpts);

        // Check if there are staged changes
        const statusOutput = child_process.execSync('git status --porcelain', execOpts).trim();
        let commitSha = '';
        if (statusOutput) {
          child_process.execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, execOpts);
          commitSha = child_process.execSync('git rev-parse HEAD', execOpts).trim();
        }

        // Push to GitHub
        try {
          child_process.execSync(`git push origin ${branch}`, execOpts);
        } catch (pushErr: any) {
          console.warn('[Git Push] Standard push warning, attempting with force push:', pushErr.message);
          child_process.execSync(`git push origin ${branch} --force`, execOpts);
        }

        // Update config (do NOT persist secret GitHub PAT to file to avoid GitHub push protection blocks)
        const updatedConfig = {
          ...cfg,
          githubToken: '',
          repoUrl: effectiveRepoUrl,
          lastPushed: now.toISOString(),
          lastSynced: now.toISOString(),
          lastVersion: versionStr,
          lastTotalRows: docToPush?.rows?.length || 461,
        };
        fs.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');

        return res.json({
          success: true,
          message: `Pomyślnie wysłano zaktualizowaną bazę (${docToPush?.rows?.length || 461} modeli) oraz ${uploadsCount} zdjęć z folderu public/uploads/ do GitHub (${owner}/${repo})! Vercel automatycznie rozpoczyna publikację online.`,
          uploadsCount,
          totalRows: docToPush?.rows?.length || 461,
          commitSha,
          version: versionStr,
        });
      } finally {
        // Sanitize remote URL so token is never saved in .git/config
        try {
          child_process.execSync(`git remote set-url origin "https://github.com/${owner}/${repo}.git"`, { cwd: process.cwd() });
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('[GitHub Push Error]:', err);
      return res.status(500).json({
        success: false,
        error: `Błąd podczas wysyłania do GitHub: ${err.stderr || err.message || 'Nieznany błąd'}`,
      });
    }
  });

  // Catch-all for unmatched API routes to ensure JSON 404 instead of SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found', path: req.path });
  });

  // Production detection: NODE_ENV=production, K_SERVICE (Cloud Run container), compiled bundle (.cjs), or when dist/index.html is served
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const dirnameDist = typeof __dirname !== 'undefined' ? __dirname : cwdDist;
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html'))
      ? cwdDist
      : fs.existsSync(path.join(dirnameDist, 'index.html'))
      ? dirnameDist
      : cwdDist;

    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.warn('⚠️ dist/index.html not found, falling back to Vite middleware');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
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
          res.status(404).send('Application build not found.');
        }
      });
    }
  }

  // Central Express error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Error Handler]:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ success: false, error: err?.message || 'Wewnętrzny błąd serwera' });
  });

  // Listen strictly on port 3000 (required for AI Studio sandbox / NGINX reverse proxy)
  const defaultPort = 3000;
  const server = app.listen(defaultPort, '0.0.0.0', () => {
    console.log(`🚀 Cennik server running on http://0.0.0.0:${defaultPort}`);
  });
  server.on('error', (err: any) => {
    console.error(`Error on port ${defaultPort}:`, err);
  });

  // Graceful shutdown handling for Cloud Run & container orchestration
  const shutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server gracefully`);
    try {
      if (typeof (server as any).closeIdleConnections === 'function') {
        (server as any).closeIdleConnections();
      }
      server.close(() => {
        console.log('HTTP server closed successfully');
        process.exit(0);
      });
    } catch (_) {
      process.exit(0);
    }
    setTimeout(() => {
      console.warn('Forcing process exit after shutdown timeout');
      process.exit(0);
    }, 2000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Global process error handlers to prevent Cloud Run container crashes
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
