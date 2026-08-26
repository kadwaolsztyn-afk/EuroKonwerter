import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-catalog.json');
const PRICING_SETTINGS_FILE = path.join(process.cwd(), 'pricing-settings.json');

async function startServer() {
  const app = express();

  // Enable Gzip/Deflate compression for fast loading over mobile and web networks
  app.use(compression({
    level: 6,
    threshold: 512,
  }));

  // Allow up to 50MB payload for documents with photos/base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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

  // SAVE the master catalog to permanent server storage
  app.post('/api/catalog', (req, res) => {
    try {
      const { document } = req.body;
      if (!document || !Array.isArray(document.rows)) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowa struktura dokumentu (brak tablicy wierszy).',
        });
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(document, null, 2), 'utf-8');
      console.log(
        `[Master Catalog] Saved ${document.rows.length} rows to ${DATA_FILE}`
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

  // Vite development middleware or static production serve
  if (process.env.NODE_ENV !== 'production') {
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
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cennik server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
