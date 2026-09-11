var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_child_process = __toESM(require("child_process"), 1);
var import_compression = __toESM(require("compression"), 1);
var DATA_FILE = import_path.default.join(process.cwd(), "data-catalog.json");
var PUBLIC_DATA_FILE = import_path.default.join(process.cwd(), "public", "data-catalog.json");
var SOURCE_CATALOG_FILE = import_path.default.join(process.cwd(), "src", "data", "initialCatalog.ts");
var PRICING_SETTINGS_FILE = import_path.default.join(process.cwd(), "pricing-settings.json");
var UPLOADS_DIR = import_path.default.join(process.cwd(), "uploads");
var PUBLIC_UPLOADS_DIR = import_path.default.join(process.cwd(), "public", "uploads");
try {
  if (!import_fs.default.existsSync(UPLOADS_DIR)) {
    import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!import_fs.default.existsSync(PUBLIC_UPLOADS_DIR)) {
    import_fs.default.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  }
} catch (dirErr) {
  console.warn("Could not initialize uploads directory:", dirErr);
}
var cachedCatalogMeta = {
  version: "2026.03_ALL_v461_OPT_20260910_0851",
  totalRows: 461,
  brandsCount: 34,
  serverUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  lastModified: Date.now()
};
try {
  if (import_fs.default.existsSync(DATA_FILE)) {
    const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
    const doc = JSON.parse(raw);
    const stats = import_fs.default.statSync(DATA_FILE);
    cachedCatalogMeta = {
      version: doc.version || "2026.03_ALL_v461_OPT_20260910_0851",
      totalRows: doc.rows?.length || 461,
      brandsCount: doc.brandsCount || 34,
      serverUpdatedAt: doc.serverUpdatedAt || stats.mtime.toISOString(),
      lastModified: stats.mtimeMs
    };
  }
} catch (_) {
}
function syncDocumentEverywhere(document) {
  try {
    const now = /* @__PURE__ */ new Date();
    if (import_fs.default.existsSync(DATA_FILE)) {
      try {
        const existingRaw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        const existingDoc = JSON.parse(existingRaw);
        if (existingDoc && Array.isArray(existingDoc.rows) && Array.isArray(document.rows)) {
          if (existingDoc.rows.length === document.rows.length && JSON.stringify(existingDoc.rows) === JSON.stringify(document.rows)) {
            document.version = existingDoc.version;
            document.serverUpdatedAt = existingDoc.serverUpdatedAt;
            cachedCatalogMeta = {
              version: existingDoc.version,
              totalRows: existingDoc.rows.length,
              brandsCount: existingDoc.brandsCount || 34,
              serverUpdatedAt: existingDoc.serverUpdatedAt || now.toISOString(),
              lastModified: Date.now()
            };
            return;
          }
        }
      } catch (e) {
      }
    }
    if (!document.version) {
      const timeSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}_${now.getMilliseconds()}`;
      document.version = `2026.03_ALL_v461_SYNC_${timeSuffix}`;
      document.serverUpdatedAt = now.toISOString();
    }
    const version = document.version;
    cachedCatalogMeta = {
      version,
      totalRows: document.rows?.length || 0,
      brandsCount: document.brandsCount || 34,
      serverUpdatedAt: document.serverUpdatedAt || now.toISOString(),
      lastModified: Date.now()
    };
    const jsonStr = JSON.stringify(document, null, 2);
    if (import_fs.default.existsSync(DATA_FILE)) {
      const existing = import_fs.default.readFileSync(DATA_FILE, "utf-8");
      if (existing === jsonStr) {
        return;
      }
    }
    import_fs.default.writeFileSync(DATA_FILE, jsonStr, "utf-8");
    try {
      const publicDir = import_path.default.dirname(PUBLIC_DATA_FILE);
      if (!import_fs.default.existsSync(publicDir)) import_fs.default.mkdirSync(publicDir, { recursive: true });
      import_fs.default.writeFileSync(PUBLIC_DATA_FILE, jsonStr, "utf-8");
    } catch (pubErr) {
      console.warn("Could not write to public/data-catalog.json:", pubErr);
    }
    try {
      if (import_fs.default.existsSync(SOURCE_CATALOG_FILE)) {
        const rowsJson = JSON.stringify(document.rows || [], null, 2);
        const headersJson = JSON.stringify(document.headers || [], null, 4);
        const imagesJson = JSON.stringify(document.images || [], null, 4);
        const docName = document.name || "Baza Pojazd\xF3w USA/EU (Cennik 2026 - 461 Pozycji)";
        const docId = document.id || "cennik-all-461-master";
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
        import_fs.default.writeFileSync(SOURCE_CATALOG_FILE, tsContent, "utf-8");
        console.log(`[Source Sync] Successfully synced ${totalRows} rows to src/data/initialCatalog.ts for AI Studio & GitHub.`);
      }
    } catch (srcErr) {
      console.warn("Could not write to src/data/initialCatalog.ts:", srcErr);
    }
  } catch (err) {
    console.error("Error in syncDocumentEverywhere:", err);
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_compression.default)({
    level: 4,
    threshold: 1024,
    filter: (req, res) => {
      if (req.path.match(/\.(png|jpe?g|webp|svg|ico|gif|woff2?|zip)$/i)) {
        return false;
      }
      return import_compression.default.filter(req, res);
    }
  }));
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  const distUploadsDir = import_path.default.join(process.cwd(), "dist", "uploads");
  app.use("/uploads", import_express.default.static(distUploadsDir, { maxAge: "30d" }));
  app.use("/uploads", import_express.default.static(UPLOADS_DIR, { maxAge: "30d" }));
  app.use("/uploads", import_express.default.static(PUBLIC_UPLOADS_DIR, { maxAge: "30d" }));
  app.get("/favicon.ico", (req, res) => {
    const candidates = [
      import_path.default.join(process.cwd(), "dist", "favicon.ico"),
      import_path.default.join(process.cwd(), "public", "favicon.ico"),
      import_path.default.join(process.cwd(), "dist", "icon.png"),
      import_path.default.join(process.cwd(), "public", "icon.png")
    ];
    for (const p of candidates) {
      if (import_fs.default.existsSync(p)) return res.sendFile(p);
    }
    res.status(204).end();
  });
  app.get(["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"], (req, res) => {
    const candidates = [
      import_path.default.join(process.cwd(), "dist", "apple-touch-icon.png"),
      import_path.default.join(process.cwd(), "public", "icon-192.png"),
      import_path.default.join(process.cwd(), "dist", "icon-192.png"),
      import_path.default.join(process.cwd(), "public", "icon.png"),
      import_path.default.join(process.cwd(), "dist", "icon.png")
    ];
    for (const p of candidates) {
      if (import_fs.default.existsSync(p)) return res.sendFile(p);
    }
    res.status(204).end();
  });
  app.get(["/api/health", "/health", "/healthz", "/livez", "/readyz", "/_health", "/_ready"], (req, res) => {
    res.json({
      status: "ok",
      service: "cennik-server",
      version: "2026.03_ALL_v461_MASTER_PHOTOS_V5",
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/settings/pricing", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      if (import_fs.default.existsSync(PRICING_SETTINGS_FILE)) {
        const raw = import_fs.default.readFileSync(PRICING_SETTINGS_FILE, "utf-8");
        try {
          const settings = JSON.parse(raw);
          return res.json({ success: true, exists: true, settings });
        } catch (parseErr) {
          return res.json({ success: true, exists: false, settings: null });
        }
      }
      return res.json({ success: true, exists: false, settings: null });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/settings/pricing", (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ success: false, error: "Nieprawid\u0142owe dane ustawie\u0144 cenowych." });
      }
      import_fs.default.writeFileSync(PRICING_SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
      console.log(`[Pricing Settings] Saved persistent pricing settings to ${PRICING_SETTINGS_FILE}`);
      return res.json({ success: true, savedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/export/project-zip", (req, res) => {
    try {
      const zipPath = "/tmp/EuroKonwerter-program-update.zip";
      import_child_process.default.execSync(`python3 -c "
import os, zipfile
zip_path = '${zipPath}'
exclude_dirs = {'node_modules', '.git', 'dist', '.next', '.cache'}
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.zip') or f.endswith('.log') or f.startswith('.'): continue
            fp = os.path.join(root, f)
            arcname = os.path.relpath(fp, '.')
            zipf.write(fp, arcname)
"`);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="EuroKonwerter-program-update.zip"');
      return res.sendFile(zipPath);
    } catch (err) {
      console.error("Error creating project zip:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const catalogStatusHandler = (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      const exists = import_fs.default.existsSync(DATA_FILE);
      return res.json({
        success: true,
        exists,
        ...cachedCatalogMeta,
        timestamp: Date.now()
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };
  app.get("/api/catalog/status", catalogStatusHandler);
  app.get("/api/catalog/info", catalogStatusHandler);
  app.get("/api/catalog/version", catalogStatusHandler);
  app.get("/api/catalog", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      if (import_fs.default.existsSync(DATA_FILE)) {
        const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        try {
          const document = JSON.parse(raw);
          return res.json({
            success: true,
            exists: true,
            document,
            version: document.version,
            serverUpdatedAt: document.serverUpdatedAt || (/* @__PURE__ */ new Date()).toISOString(),
            totalRows: document.rows?.length || 0
          });
        } catch (parseErr) {
          console.error("Error parsing catalog JSON file, treating as absent:", parseErr);
          return res.json({ success: true, exists: false, document: null, parseError: parseErr.message });
        }
      }
      return res.json({ success: true, exists: false, document: null });
    } catch (err) {
      console.error("Error reading catalog file:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/catalog", (req, res) => {
    try {
      const { document } = req.body;
      if (!document || !Array.isArray(document.rows)) {
        return res.status(400).json({
          success: false,
          error: "Nieprawid\u0142owa struktura dokumentu (brak tablicy wierszy)."
        });
      }
      syncDocumentEverywhere(document);
      console.log(
        `[Master Catalog] Saved and synced ${document.rows.length} rows to ${DATA_FILE}, public/data-catalog.json & src/data/initialCatalog.ts (version: ${document.version})`
      );
      return res.json({
        success: true,
        savedAt: (/* @__PURE__ */ new Date()).toISOString(),
        version: document.version,
        totalRows: document.rows.length
      });
    } catch (err) {
      console.error("Error writing catalog file:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/sync/to-source-code", (req, res) => {
    try {
      let docToSync = req.body?.document;
      if (!docToSync && import_fs.default.existsSync(DATA_FILE)) {
        const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        docToSync = JSON.parse(raw);
      }
      if (!docToSync || !Array.isArray(docToSync.rows)) {
        return res.status(400).json({
          success: false,
          error: "Brak poprawnego dokumentu katalogu do synchronizacji."
        });
      }
      syncDocumentEverywhere(docToSync);
      return res.json({
        success: true,
        message: `Pomy\u015Blnie zsynchronizowano baz\u0119 (${docToSync.rows.length} wierszy) oraz zdj\u0119cia do plik\xF3w \u017Ar\xF3d\u0142owych (src/data/initialCatalog.ts i public/data-catalog.json). Google AI Studio oraz GitHub widz\u0105 teraz wszystkie zmiany!`,
        totalRows: docToSync.rows.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/catalog", (req, res) => {
    try {
      if (import_fs.default.existsSync(DATA_FILE)) {
        import_fs.default.unlinkSync(DATA_FILE);
        console.log(`[Master Catalog] Removed ${DATA_FILE}`);
      }
      return res.json({ success: true, message: "Katalog zresetowany" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  let cachedSharp = null;
  async function getSharpInstance() {
    if (cachedSharp) return cachedSharp;
    try {
      const s = await import("sharp");
      cachedSharp = s.default || s;
      return cachedSharp;
    } catch (err) {
      console.warn("[Sharp Load Notice] Sharp not loaded, using raw buffer:", err?.message);
      return null;
    }
  }
  async function optimizeImageBuffer(rawBuffer, mimeOrExt, options) {
    const originalSize = rawBuffer.length;
    const isSvg = mimeOrExt.includes("svg");
    if (isSvg) {
      return {
        buffer: rawBuffer,
        ext: "svg",
        originalSize,
        optimizedSize: originalSize,
        savedPercent: "0%"
      };
    }
    const maxWidth = options?.maxWidth || 1280;
    const maxHeight = options?.maxHeight || 1280;
    const quality = options?.quality || 82;
    const sharp = await getSharpInstance();
    if (!sharp) {
      let fallbackExt = "jpg";
      if (mimeOrExt.includes("png")) fallbackExt = "png";
      else if (mimeOrExt.includes("webp")) fallbackExt = "webp";
      return {
        buffer: rawBuffer,
        ext: fallbackExt,
        originalSize,
        optimizedSize: originalSize,
        savedPercent: "0%"
      };
    }
    try {
      const optimized = await sharp(rawBuffer).rotate().resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
        kernel: "lanczos3"
      }).webp({
        quality,
        effort: 6,
        smartSubsample: true,
        alphaQuality: 85
      }).toBuffer();
      const optimizedSize = optimized.length;
      const savedPct = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize * 100).toFixed(1) : "0";
      return {
        buffer: optimized,
        ext: "webp",
        originalSize,
        optimizedSize,
        savedPercent: `${savedPct}%`
      };
    } catch (err) {
      console.warn("[Image Optimize Warning]:", err?.message);
      let fallbackExt = "jpg";
      if (mimeOrExt.includes("png")) fallbackExt = "png";
      else if (mimeOrExt.includes("webp")) fallbackExt = "webp";
      return {
        buffer: rawBuffer,
        ext: fallbackExt,
        originalSize,
        optimizedSize: originalSize,
        savedPercent: "0%"
      };
    }
  }
  app.post("/api/uploads/upload", async (req, res) => {
    try {
      const { dataUrl, filename, brand, model, rowId } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ success: false, error: "Brak danych zdj\u0119cia (dataUrl)." });
      }
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let incomingMime = "image/jpeg";
      let rawBuffer;
      if (matches && matches.length === 3) {
        incomingMime = matches[1];
        rawBuffer = Buffer.from(matches[2], "base64");
      } else if (dataUrl.startsWith("data:image/svg+xml")) {
        incomingMime = "image/svg+xml";
        const svgContent = decodeURIComponent(dataUrl.replace("data:image/svg+xml;utf8,", ""));
        rawBuffer = Buffer.from(svgContent, "utf-8");
      } else {
        return res.status(400).json({ success: false, error: "Nierozpoznany format danych zdj\u0119cia." });
      }
      let safeBase = "";
      if (brand || model) {
        safeBase = `${brand || ""}_${model || ""}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
      } else if (filename) {
        safeBase = import_path.default.parse(filename).name.toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
      }
      if (!safeBase) safeBase = `foto_${rowId || "auto"}`;
      const { buffer: finalBuffer, ext: finalExt, originalSize, optimizedSize, savedPercent } = await optimizeImageBuffer(rawBuffer, incomingMime);
      const finalFileName = `${safeBase}_${Date.now()}.${finalExt}`;
      const targetPath = import_path.default.join(UPLOADS_DIR, finalFileName);
      const publicTargetPath = import_path.default.join(PUBLIC_UPLOADS_DIR, finalFileName);
      import_fs.default.writeFileSync(targetPath, finalBuffer);
      try {
        import_fs.default.writeFileSync(publicTargetPath, finalBuffer);
      } catch (_) {
      }
      console.log(
        `[Uploads] Compressed & saved image ${finalFileName}: ${(originalSize / 1024).toFixed(1)} KB -> ${(optimizedSize / 1024).toFixed(1)} KB (${savedPercent} space saved)`
      );
      return res.json({
        success: true,
        url: `/uploads/${finalFileName}`,
        filename: finalFileName,
        size: optimizedSize,
        originalSize,
        savedPercent
      });
    } catch (err) {
      console.error("[Uploads Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/uploads/list", (req, res) => {
    try {
      if (!import_fs.default.existsSync(UPLOADS_DIR)) {
        return res.json({ success: true, files: [], totalCount: 0, totalBytes: 0 });
      }
      const fileNames = import_fs.default.readdirSync(UPLOADS_DIR);
      let totalBytes = 0;
      const files = fileNames.map((name) => {
        const filePath = import_path.default.join(UPLOADS_DIR, name);
        const stats = import_fs.default.statSync(filePath);
        totalBytes += stats.size;
        return {
          name,
          url: `/uploads/${name}`,
          size: stats.size,
          mtime: stats.mtime
        };
      });
      return res.json({
        success: true,
        files,
        totalCount: files.length,
        totalBytes,
        totalSizeFormatted: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/uploads/optimize-existing", async (req, res) => {
    try {
      const sharp = await getSharpInstance();
      if (!sharp) {
        return res.json({ success: false, error: "Biblioteka sharp nie jest dost\u0119pna." });
      }
      const dirs = [PUBLIC_UPLOADS_DIR, UPLOADS_DIR];
      let filesOptimized = 0;
      let totalBytesSaved = 0;
      for (const dir of dirs) {
        if (!import_fs.default.existsSync(dir)) continue;
        const fileNames = import_fs.default.readdirSync(dir);
        for (const name of fileNames) {
          const filePath = import_path.default.join(dir, name);
          try {
            const stats = import_fs.default.statSync(filePath);
            if (stats.size > 120 * 1024) {
              const ext = import_path.default.extname(name).toLowerCase();
              let optimizedBuf = null;
              if (ext === ".jpg" || ext === ".jpeg") {
                optimizedBuf = await sharp(filePath).rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
              } else if (ext === ".png") {
                optimizedBuf = await sharp(filePath).rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
              }
              if (optimizedBuf && optimizedBuf.length < stats.size) {
                totalBytesSaved += stats.size - optimizedBuf.length;
                import_fs.default.writeFileSync(filePath, optimizedBuf);
                filesOptimized++;
              }
            }
          } catch (_) {
          }
        }
      }
      return res.json({
        success: true,
        filesOptimized,
        totalBytesSaved,
        totalSavedFormatted: `${(totalBytesSaved / 1024 / 1024).toFixed(2)} MB`
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/uploads/migrate-base64", async (req, res) => {
    try {
      if (!import_fs.default.existsSync(DATA_FILE)) {
        return res.status(404).json({ success: false, error: "Brak pliku bazy katalogu (data-catalog.json)." });
      }
      const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
      const document = JSON.parse(raw);
      if (!document || !Array.isArray(document.rows)) {
        return res.status(400).json({ success: false, error: "Nieprawid\u0142owa struktura katalogu." });
      }
      let migratedCount = 0;
      for (const row of document.rows) {
        const cleanBrand = (row.brand || "auto").toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
        const cleanModel = (row.model || "model").toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
        if (row.imageUrl && typeof row.imageUrl === "string" && row.imageUrl.startsWith("data:image/")) {
          try {
            const matches = row.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mime = matches[1];
              const rawBuffer = Buffer.from(matches[2], "base64");
              const { buffer: optBuffer, ext } = await optimizeImageBuffer(rawBuffer, mime);
              const fileName = `lampa_${cleanBrand}_${cleanModel}_${row.id}.${ext}`;
              const targetPath = import_path.default.join(UPLOADS_DIR, fileName);
              const publicTargetPath = import_path.default.join(PUBLIC_UPLOADS_DIR, fileName);
              import_fs.default.writeFileSync(targetPath, optBuffer);
              try {
                import_fs.default.writeFileSync(publicTargetPath, optBuffer);
              } catch (_) {
              }
              row.imageUrl = `/uploads/${fileName}`;
              migratedCount++;
            }
          } catch (migrateErr) {
            console.warn(`Could not migrate image for row ${row.id}:`, migrateErr);
          }
        }
        if (row.multimediaImageUrl && typeof row.multimediaImageUrl === "string" && row.multimediaImageUrl.startsWith("data:image/")) {
          try {
            const matches = row.multimediaImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mime = matches[1];
              const rawBuffer = Buffer.from(matches[2], "base64");
              const { buffer: optBuffer, ext } = await optimizeImageBuffer(rawBuffer, mime);
              const fileName = `multimedia_${cleanBrand}_${cleanModel}_${row.id}.${ext}`;
              const targetPath = import_path.default.join(UPLOADS_DIR, fileName);
              const publicTargetPath = import_path.default.join(PUBLIC_UPLOADS_DIR, fileName);
              import_fs.default.writeFileSync(targetPath, optBuffer);
              try {
                import_fs.default.writeFileSync(publicTargetPath, optBuffer);
              } catch (_) {
              }
              row.multimediaImageUrl = `/uploads/${fileName}`;
              migratedCount++;
            }
          } catch (migrateErr) {
            console.warn(`Could not migrate multimedia image for row ${row.id}:`, migrateErr);
          }
        }
        if (Array.isArray(row.multimediaItems)) {
          for (let mIdx = 0; mIdx < row.multimediaItems.length; mIdx++) {
            const mItem = row.multimediaItems[mIdx];
            if (mItem && mItem.imageUrl && typeof mItem.imageUrl === "string" && mItem.imageUrl.startsWith("data:image/")) {
              try {
                const matches = mItem.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                  const mime = matches[1];
                  const rawBuffer = Buffer.from(matches[2], "base64");
                  const { buffer: optBuffer, ext } = await optimizeImageBuffer(rawBuffer, mime);
                  const fileName = `multimedia_${cleanBrand}_${cleanModel}_${row.id}_${mIdx + 1}.${ext}`;
                  const targetPath = import_path.default.join(UPLOADS_DIR, fileName);
                  const publicTargetPath = import_path.default.join(PUBLIC_UPLOADS_DIR, fileName);
                  import_fs.default.writeFileSync(targetPath, optBuffer);
                  try {
                    import_fs.default.writeFileSync(publicTargetPath, optBuffer);
                  } catch (_) {
                  }
                  mItem.imageUrl = `/uploads/${fileName}`;
                  if (mIdx === 0) {
                    row.multimediaImageUrl = mItem.imageUrl;
                  }
                  migratedCount++;
                }
              } catch (migrateErr) {
                console.warn(`Could not migrate multimediaItem[${mIdx}] for row ${row.id}:`, migrateErr);
              }
            }
          }
        }
      }
      if (migratedCount > 0) {
        syncDocumentEverywhere(document);
        console.log(`[Uploads Migration] Migrated & compressed ${migratedCount} base64 images into physical /uploads files.`);
      }
      return res.json({
        success: true,
        migratedCount,
        message: `Pomy\u015Blnie przeniesiono i zoptymalizowano ${migratedCount} zdj\u0119\u0107 do folderu /uploads.`
      });
    } catch (err) {
      console.error("[Uploads Migration Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/portable/info", (req, res) => {
    try {
      const dataFileSize = import_fs.default.existsSync(DATA_FILE) ? import_fs.default.statSync(DATA_FILE).size : 0;
      const pricingFileSize = import_fs.default.existsSync(PRICING_SETTINGS_FILE) ? import_fs.default.statSync(PRICING_SETTINGS_FILE).size : 0;
      let uploadsCount = 0;
      let uploadsSizeBytes = 0;
      if (import_fs.default.existsSync(UPLOADS_DIR)) {
        const files = import_fs.default.readdirSync(UPLOADS_DIR);
        uploadsCount = files.length;
        for (const file of files) {
          try {
            uploadsSizeBytes += import_fs.default.statSync(import_path.default.join(UPLOADS_DIR, file)).size;
          } catch (_) {
          }
        }
      }
      return res.json({
        success: true,
        mode: "W 100% Przeno\u015Bny (Jeden Folder / Pendrive)",
        programDirectory: process.cwd(),
        dataFile: "data-catalog.json",
        dataFileSize,
        pricingSettingsFile: "pricing-settings.json",
        pricingFileSize,
        uploadsDirectory: "uploads",
        uploadsCount,
        uploadsSizeBytes,
        uploadsSizeFormatted: `${(uploadsSizeBytes / 1024 / 1024).toFixed(2)} MB`,
        launcherFile: "Uruchom_Cennik.bat",
        isIsolated: true,
        windowsFilesCreated: 0
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const GITHUB_CONFIG_FILE = import_path.default.join(process.cwd(), "github-sync-config.json");
  app.get("/api/catalog/download", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      if (import_fs.default.existsSync(DATA_FILE)) {
        res.setHeader("Content-Disposition", 'attachment; filename="data-catalog.json"');
        res.setHeader("Content-Type", "application/json");
        return import_fs.default.createReadStream(DATA_FILE).pipe(res);
      }
      const publicCatalog = import_path.default.join(process.cwd(), "public", "data-catalog.json");
      if (import_fs.default.existsSync(publicCatalog)) {
        res.setHeader("Content-Disposition", 'attachment; filename="data-catalog.json"');
        res.setHeader("Content-Type", "application/json");
        return import_fs.default.createReadStream(publicCatalog).pipe(res);
      }
      return res.status(404).json({ success: false, error: "Plik katalogu nie zosta\u0142 odnaleziony." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const defaultGitHubConfig = {
    enabled: true,
    checkOnStartup: true,
    repoUrl: "https://github.com/kadwaolsztyn-afk/EuroKonwerter",
    releaseTag: "main",
    targetAssetFileName: "data-catalog.json",
    lastChecked: null,
    lastSynced: null,
    lastVersion: null
  };
  app.get("/api/sync/github/config", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        const raw = import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8");
        try {
          const cfg = JSON.parse(raw);
          if (!cfg.repoUrl || cfg.repoUrl.includes("Konwerter-Usa-ECE")) {
            cfg.repoUrl = "https://github.com/kadwaolsztyn-afk/EuroKonwerter";
          }
          if (!cfg.releaseTag || cfg.releaseTag === "Konwerter" || cfg.releaseTag === "Backup" || cfg.releaseTag === "Baza") {
            cfg.releaseTag = "main";
          }
          return res.json({ success: true, config: { ...defaultGitHubConfig, ...cfg } });
        } catch {
          return res.json({ success: true, config: defaultGitHubConfig });
        }
      }
      return res.json({ success: true, config: defaultGitHubConfig });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/sync/github/config", (req, res) => {
    try {
      const { config } = req.body;
      if (!config || typeof config !== "object") {
        return res.status(400).json({ success: false, error: "Nieprawid\u0142owe dane konfiguracji GitHub." });
      }
      let current = defaultGitHubConfig;
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          current = JSON.parse(import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8"));
        } catch {
        }
      }
      const updated = { ...current, ...config, githubToken: "" };
      import_fs.default.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
      return res.json({ success: true, config: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const SECURITY_CONFIG_FILE = import_path.default.join(process.cwd(), "security-config.json");
  const defaultSecurityConfig = {
    settingsPassword: "505690291",
    wholesalePassword: "505690291",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  app.get("/api/security/passwords", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      if (import_fs.default.existsSync(SECURITY_CONFIG_FILE)) {
        const raw = import_fs.default.readFileSync(SECURITY_CONFIG_FILE, "utf-8");
        try {
          const cfg = JSON.parse(raw);
          return res.json({
            success: true,
            passwords: {
              settingsPassword: cfg.settingsPassword || "505690291",
              wholesalePassword: cfg.wholesalePassword || "505690291",
              updatedAt: cfg.updatedAt || null
            }
          });
        } catch {
        }
      }
      return res.json({ success: true, passwords: defaultSecurityConfig });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/security/passwords", (req, res) => {
    try {
      const { settingsPassword, wholesalePassword } = req.body;
      let current = { ...defaultSecurityConfig };
      if (import_fs.default.existsSync(SECURITY_CONFIG_FILE)) {
        try {
          current = { ...current, ...JSON.parse(import_fs.default.readFileSync(SECURITY_CONFIG_FILE, "utf-8")) };
        } catch {
        }
      }
      const updated = {
        settingsPassword: settingsPassword && typeof settingsPassword === "string" && settingsPassword.trim() ? settingsPassword.trim() : current.settingsPassword,
        wholesalePassword: wholesalePassword && typeof wholesalePassword === "string" && wholesalePassword.trim() ? wholesalePassword.trim() : current.wholesalePassword,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      import_fs.default.writeFileSync(SECURITY_CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
      return res.json({ success: true, passwords: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/security/passwords/reset", (req, res) => {
    try {
      const reset = {
        settingsPassword: "505690291",
        wholesalePassword: "505690291",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      import_fs.default.writeFileSync(SECURITY_CONFIG_FILE, JSON.stringify(reset, null, 2), "utf-8");
      return res.json({ success: true, passwords: reset });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  function parseRepo(urlStr) {
    const clean = (urlStr || "").trim().replace(/\/$/, "");
    const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match && match[1] && match[2]) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
    return { owner: "kadwaolsztyn-afk", repo: "EuroKonwerter" };
  }
  app.get("/api/sync/github/check", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      let cfg = defaultGitHubConfig;
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = { ...defaultGitHubConfig, ...JSON.parse(import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8")) };
        } catch {
        }
      }
      const { owner, repo } = parseRepo(cfg.repoUrl);
      const tag = cfg.releaseTag && cfg.releaseTag !== "Baza" ? cfg.releaseTag : "main";
      const targetName = (cfg.targetAssetFileName || "data-catalog.json").toLowerCase();
      console.log(`[GitHub Sync Check] Checking repository ${owner}/${repo} (tag/branch: ${tag})...`);
      if (tag !== "main") {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
        try {
          const ghRes = await fetch(apiUrl, {
            headers: {
              "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0",
              "Accept": "application/vnd.github.v3+json"
            },
            signal: AbortSignal.timeout(3500)
          });
          if (ghRes.ok) {
            const releaseData = await ghRes.json();
            const assets = (releaseData.assets || []).map((a) => ({
              name: a.name,
              size: a.size,
              downloadUrl: a.browser_download_url,
              updatedAt: a.updated_at,
              contentType: a.content_type
            }));
            const matchingAsset = assets.find((a) => a.name.toLowerCase() === targetName) || assets.find((a) => a.name.toLowerCase().endsWith(".json")) || null;
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
                release: releaseData.html_url
              },
              message: `Po\u0142\u0105czono z wydaniem GitHub "${releaseData.name || releaseData.tag_name}" (${assets.length} za\u0142\u0105cznik\xF3w).`
            });
          }
        } catch (releaseErr) {
          console.warn("[GitHub Sync Check] Release tag check timed out or failed, falling back to main branch file:", releaseErr);
        }
      }
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${cfg.targetAssetFileName || "data-catalog.json"}`;
      try {
        const headRes = await fetch(rawUrl, {
          method: "HEAD",
          headers: { "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0" },
          signal: AbortSignal.timeout(4e3)
        });
        if (headRes.ok) {
          const lastMod = headRes.headers.get("last-modified");
          const clen = headRes.headers.get("content-length");
          const fileSize = clen ? parseInt(clen, 10) : 10517311;
          const rawAsset = {
            name: cfg.targetAssetFileName || "data-catalog.json",
            size: fileSize,
            downloadUrl: rawUrl,
            updatedAt: lastMod || (/* @__PURE__ */ new Date()).toISOString(),
            contentType: "application/json"
          };
          return res.json({
            success: true,
            connected: true,
            releaseTag: "main",
            releaseName: "Ga\u0142\u0105\u017A g\u0142\xF3wna (main)",
            publishedAt: lastMod || (/* @__PURE__ */ new Date()).toISOString(),
            releaseUrl: `https://github.com/${owner}/${repo}/blob/main/${cfg.targetAssetFileName || "data-catalog.json"}`,
            assets: [rawAsset],
            matchingAsset: rawAsset,
            directUrls: {
              raw: rawUrl,
              cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
              repo: `https://github.com/${owner}/${repo}/blob/main/data-catalog.json`,
              exe: `https://github.com/${owner}/${repo}/releases/download/eurokonwenter/Cennik.konwersji.lamp.i.multimediow.exe`
            },
            message: `Po\u0142\u0105czono z baz\u0105 na GitHub (ga\u0142\u0105\u017A main, plik ${cfg.targetAssetFileName || "data-catalog.json"}). Gotowy do pobrania!`
          });
        }
      } catch (rawErr) {
        console.warn("[GitHub Sync Check] Raw head check error:", rawErr);
      }
      try {
        const listRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
          headers: {
            "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0",
            "Accept": "application/vnd.github.v3+json"
          },
          signal: AbortSignal.timeout(3500)
        });
        if (listRes.ok) {
          const releases = await listRes.json();
          if (Array.isArray(releases) && releases.length > 0) {
            const rel = releases[0];
            const assets = (rel.assets || []).map((a) => ({
              name: a.name,
              size: a.size,
              downloadUrl: a.browser_download_url,
              updatedAt: a.updated_at,
              contentType: a.content_type
            }));
            const matchingAsset = assets.find((a) => a.name.toLowerCase() === targetName) || assets.find((a) => a.name.toLowerCase().endsWith(".json")) || null;
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
                exe: `https://github.com/${owner}/${repo}/releases/download/eurokonwenter/Cennik.konwersji.lamp.i.multimediow.exe`
              },
              message: `Znaleziono wydanie "${rel.name || rel.tag_name}" w repozytorium ${owner}/${repo}.`
            });
          }
        }
      } catch {
      }
      return res.json({
        success: true,
        connected: true,
        releaseTag: "main",
        releaseName: "Repozytorium GitHub",
        directUrls: {
          raw: `https://raw.githubusercontent.com/${owner}/${repo}/main/data-catalog.json`,
          cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data-catalog.json`,
          repo: `https://github.com/${owner}/${repo}`
        },
        message: `Dost\u0119pne repozytorium ${owner}/${repo}. Kliknij "Pobierz z GitHub", aby zsynchronizowa\u0107 baz\u0119.`
      });
    } catch (err) {
      console.error("[GitHub Sync Check Error]:", err);
      return res.status(500).json({ success: false, connected: false, error: err.message });
    }
  });
  app.post("/api/sync/github/pull", async (req, res) => {
    try {
      let cfg = { ...defaultGitHubConfig, ...req.body?.config || {} };
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = { ...cfg, ...JSON.parse(import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8")), ...req.body?.config || {} };
        } catch {
        }
      }
      const { owner, repo } = parseRepo(cfg.repoUrl);
      const tag = cfg.releaseTag && cfg.releaseTag !== "Baza" ? cfg.releaseTag : "main";
      let downloadUrl = null;
      if (tag !== "main") {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
        try {
          const ghRes = await fetch(apiUrl, {
            headers: {
              "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0",
              "Accept": "application/vnd.github.v3+json"
            },
            signal: AbortSignal.timeout(3500)
          });
          if (ghRes.ok) {
            const releaseData = await ghRes.json();
            const assets = releaseData.assets || [];
            const targetName = (cfg.targetAssetFileName || "data-catalog.json").toLowerCase();
            const found = assets.find((a) => a.name.toLowerCase() === targetName) || assets.find((a) => a.name.toLowerCase().endsWith(".json"));
            if (found && found.browser_download_url) {
              downloadUrl = found.browser_download_url;
            }
          }
        } catch (checkErr) {
          console.warn("Could not query release assets:", checkErr);
        }
      }
      const urlsToTry = [
        `https://raw.githubusercontent.com/${owner}/${repo}/main/${cfg.targetAssetFileName || "data-catalog.json"}`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${cfg.targetAssetFileName || "data-catalog.json"}`,
        downloadUrl,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/baza.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/backup.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/refs/tags/${encodeURIComponent(tag)}/data-catalog.json`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${cfg.targetAssetFileName || "data-catalog.json"}`,
        `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/backup.json`,
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(tag)}/data-catalog.json`
      ].filter(Boolean);
      let fileContent = null;
      let usedUrl = null;
      for (const url of urlsToTry) {
        try {
          console.log(`[GitHub Sync Pull] Fetching from ${url}...`);
          const fileRes = await fetch(url, {
            headers: {
              "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0",
              "Accept": "application/json, text/plain, */*"
            },
            signal: AbortSignal.timeout(3500)
          });
          if (fileRes.ok) {
            const text = await fileRes.text();
            if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
              fileContent = text;
              usedUrl = url;
              console.log(`[GitHub Sync Pull] Successfully retrieved database from: ${url}`);
              break;
            }
          }
        } catch (fetchErr) {
        }
      }
      if (!fileContent) {
        const publicCatalogPath = import_path.default.join(process.cwd(), "public", "data-catalog.json");
        if (import_fs.default.existsSync(publicCatalogPath)) {
          try {
            fileContent = import_fs.default.readFileSync(publicCatalogPath, "utf-8");
            usedUrl = "local-bundled:/data-catalog.json";
            console.log("[GitHub Sync Pull] Using local bundled data-catalog.json fallback.");
          } catch {
          }
        }
      }
      if (!fileContent) {
        return res.status(404).json({
          success: false,
          error: `Nie odnaleziono pliku ${cfg.targetAssetFileName} w GitHub Release (${tag}) ani w repozytorium ${owner}/${repo}.`
        });
      }
      let parsedPayload = null;
      try {
        parsedPayload = JSON.parse(fileContent);
      } catch (parseErr) {
        console.warn("[GitHub Sync Pull] JSON parse error on content from", usedUrl, parseErr);
        const publicCatalogPath = import_path.default.join(process.cwd(), "public", "data-catalog.json");
        if (import_fs.default.existsSync(publicCatalogPath)) {
          try {
            const fallbackContent = import_fs.default.readFileSync(publicCatalogPath, "utf-8");
            parsedPayload = JSON.parse(fallbackContent);
            usedUrl = "local-bundled:/data-catalog.json";
          } catch {
          }
        }
      }
      if (!parsedPayload) {
        return res.status(400).json({
          success: false,
          error: "Pobrany plik z repozytorium GitHub zawiera nieprawid\u0142owy format JSON."
        });
      }
      let documentToSave = null;
      if (parsedPayload.document && Array.isArray(parsedPayload.document.rows)) {
        documentToSave = parsedPayload.document;
      } else if (Array.isArray(parsedPayload.rows)) {
        documentToSave = parsedPayload;
      } else if (Array.isArray(parsedPayload)) {
        documentToSave = {
          id: `doc-github-sync-${Date.now()}`,
          name: "Baza Lamp Samochodowych (GitHub Online)",
          fileType: "json",
          sizeFormatted: `${Math.round(fileContent.length / 1024)} KB`,
          importedAt: (/* @__PURE__ */ new Date()).toISOString(),
          totalRows: parsedPayload.length,
          brandsCount: new Set(parsedPayload.map((r) => r.brand)).size,
          rows: parsedPayload,
          images: [],
          headers: ["Lp.", "Marka", "Model", "Generacja / Kod", "Roczniki", "Cena Stat. Klient", "Cena Dyn. Klient"]
        };
      } else if (parsedPayload.rawHtml && typeof parsedPayload.rawHtml === "string") {
        documentToSave = parsedPayload;
      }
      if (!documentToSave || !Array.isArray(documentToSave.rows) || documentToSave.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Pobrany plik nie posiada poprawnej struktury katalogu modeli."
        });
      }
      syncDocumentEverywhere(documentToSave);
      const updatedConfig = {
        ...cfg,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
        lastVersion: tag,
        lastTotalRows: documentToSave.rows.length
      };
      import_fs.default.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
      console.log(`[GitHub Sync Pull] Successfully synced ${documentToSave.rows.length} rows from ${usedUrl}`);
      return res.json({
        success: true,
        document: documentToSave,
        totalRows: documentToSave.rows.length,
        brandsCount: documentToSave.brandsCount || new Set(documentToSave.rows.map((r) => r.brand)).size,
        usedUrl,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Baza zosta\u0142a zaktualizowana"
      });
    } catch (err) {
      console.error("[GitHub Sync Pull Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/sync/url", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache");
      const { url } = req.body;
      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({ success: false, error: "Brak adresu URL do pobrania bazy." });
      }
      const targetUrl = url.trim();
      console.log(`[URL Sync] Fetching database directly from ${targetUrl}...`);
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "AutoLamp-PriceCatalog-Sync/1.0",
          "Accept": "application/json, text/plain, */*"
        },
        signal: AbortSignal.timeout(35e3)
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Serwer zwr\xF3ci\u0142 b\u0142\u0105d HTTP ${response.status} (${response.statusText}) podczas pobierania z podanego linku.`
        });
      }
      const text = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          error: `Pobrany plik nie jest poprawnym plikiem JSON: ${parseErr.message}`
        });
      }
      let documentToSave = null;
      if (parsed && Array.isArray(parsed.rows)) {
        documentToSave = parsed;
      } else if (parsed && parsed.document && Array.isArray(parsed.document.rows)) {
        documentToSave = parsed.document;
      } else if (Array.isArray(parsed)) {
        documentToSave = {
          id: `doc-url-import-${Date.now()}`,
          name: "Importowany katalog z linku URL",
          importedAt: (/* @__PURE__ */ new Date()).toISOString(),
          totalRows: parsed.length,
          brandsCount: new Set(parsed.map((r) => r.brand)).size,
          rows: parsed,
          images: [],
          sizeFormatted: `${Math.round(text.length / 1024)} KB`,
          version: `URL_IMPORT_${(/* @__PURE__ */ new Date()).toISOString().replace(/\D/g, "").slice(0, 12)}`
        };
      } else {
        return res.status(400).json({
          success: false,
          error: "Pobrany plik JSON nie zawiera prawid\u0142owej bazy danych (brak pola rows)."
        });
      }
      syncDocumentEverywhere(documentToSave);
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          const cfg = JSON.parse(import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8"));
          cfg.lastSynced = (/* @__PURE__ */ new Date()).toISOString();
          cfg.lastVersion = documentToSave.version || "URL_SYNC";
          cfg.lastTotalRows = documentToSave.rows.length;
          import_fs.default.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
        } catch {
        }
      }
      return res.json({
        success: true,
        document: documentToSave,
        totalRows: documentToSave.rows.length,
        brandsCount: documentToSave.brandsCount,
        usedUrl: targetUrl,
        message: "Baza zosta\u0142a zaktualizowana"
      });
    } catch (err) {
      console.error("[URL Sync Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/sync/github/push", async (req, res) => {
    try {
      const { document, token, repoUrl, commitMessage, branch = "main", pushFullCode = false } = req.body;
      let authToken = token;
      let cfg = defaultGitHubConfig;
      if (import_fs.default.existsSync(GITHUB_CONFIG_FILE)) {
        try {
          cfg = JSON.parse(import_fs.default.readFileSync(GITHUB_CONFIG_FILE, "utf-8"));
        } catch {
        }
      }
      if (!authToken) {
        authToken = process.env.GITHUB_TOKEN || cfg.githubToken;
      }
      if (!authToken || !authToken.trim()) {
        return res.status(400).json({
          success: false,
          error: "Brak tokena GitHub (Personal Access Token). Wklej token w ustawieniach bazy, aby wys\u0142a\u0107 zmiany."
        });
      }
      const cleanToken = authToken.trim();
      const effectiveRepoUrl = repoUrl || cfg.repoUrl || "https://github.com/kadwaolsztyn-afk/EuroKonwerter";
      const { owner, repo } = parseRepo(effectiveRepoUrl);
      let docToPush = document;
      if (docToPush && Array.isArray(docToPush.rows)) {
        for (const row of docToPush.rows) {
          if (row.imageUrl && typeof row.imageUrl === "string" && row.imageUrl.startsWith("data:image/")) {
            const matches = row.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mime = matches[1];
              const rawBuffer = Buffer.from(matches[2], "base64");
              const { buffer: optBuffer, ext } = await optimizeImageBuffer(rawBuffer, mime);
              const cleanBrand = (row.brand || "auto").toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
              const cleanModel = (row.model || "model").toLowerCase().replace(/[^a-z0-9_-]+/gi, "_");
              const fileName = `lampa_${cleanBrand}_${cleanModel}_${row.id}.${ext}`;
              const targetPath = import_path.default.join(UPLOADS_DIR, fileName);
              const publicTargetPath = import_path.default.join(PUBLIC_UPLOADS_DIR, fileName);
              try {
                import_fs.default.writeFileSync(targetPath, optBuffer);
                import_fs.default.writeFileSync(publicTargetPath, optBuffer);
                row.imageUrl = `/uploads/${fileName}`;
              } catch (writeImgErr) {
                console.warn("Failed writing image to uploads:", writeImgErr);
              }
            }
          }
        }
        docToPush.rawHtml = "";
        syncDocumentEverywhere(docToPush);
      } else if (import_fs.default.existsSync(DATA_FILE)) {
        try {
          docToPush = JSON.parse(import_fs.default.readFileSync(DATA_FILE, "utf-8"));
        } catch {
        }
      }
      let uploadsCount = 0;
      if (import_fs.default.existsSync(PUBLIC_UPLOADS_DIR)) {
        uploadsCount = import_fs.default.readdirSync(PUBLIC_UPLOADS_DIR).length;
      }
      const now = /* @__PURE__ */ new Date();
      const versionStr = `2026.03_ALL_v461_SYNC_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const msg = commitMessage || (pushFullCode ? `Aktualizacja calego programu i bazy EuroKonwerter (${docToPush?.rows?.length || 461} pozycji, ${uploadsCount} zdj\u0119\u0107, wersja ${versionStr}) - Auto-deploy Vercel` : `Aktualizacja bazy (${docToPush?.rows?.length || 461} pozycji, ${uploadsCount} zdj\u0119\u0107, wersja ${versionStr})`);
      const gitRemoteAuthUrl = `https://x-access-token:${encodeURIComponent(cleanToken)}@github.com/${owner}/${repo}.git`;
      const execOpts = { cwd: process.cwd(), encoding: "utf-8", timeout: 12e4 };
      try {
        const isGit = import_fs.default.existsSync(import_path.default.join(process.cwd(), ".git"));
        if (!isGit) {
          import_child_process.default.execSync("git init -b main", execOpts);
          import_child_process.default.execSync(`git config user.name "${owner}"`, execOpts);
          import_child_process.default.execSync('git config user.email "kadwaolsztyn@gmail.com"', execOpts);
          import_child_process.default.execSync(`git remote add origin "${gitRemoteAuthUrl}"`, execOpts);
        } else {
          import_child_process.default.execSync(`git remote set-url origin "${gitRemoteAuthUrl}"`, execOpts);
        }
        let hasFetched = false;
        try {
          import_child_process.default.execSync(`git fetch origin ${branch} --depth=1`, execOpts);
          hasFetched = true;
        } catch (fErr) {
          console.warn("[Git Push] Fetch warning:", fErr.message);
        }
        if (hasFetched) {
          try {
            import_child_process.default.execSync(`git reset origin/${branch}`, execOpts);
          } catch (rErr) {
            console.warn("[Git Push] Reset warning:", rErr.message);
          }
        }
        if (pushFullCode) {
          import_child_process.default.execSync("git add -A", execOpts);
        } else {
          const filesToStage = ["data-catalog.json", "public/data-catalog.json", "src/data/initialCatalog.ts"];
          if (import_fs.default.existsSync(import_path.default.join(process.cwd(), ".gitignore"))) filesToStage.push(".gitignore");
          if (import_fs.default.existsSync(import_path.default.join(process.cwd(), "public", "uploads"))) filesToStage.push("public/uploads/");
          import_child_process.default.execSync(`git add ${filesToStage.join(" ")}`, execOpts);
        }
        const statusOutput = import_child_process.default.execSync("git status --porcelain", execOpts).trim();
        let commitSha = "";
        if (statusOutput) {
          import_child_process.default.execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, execOpts);
          commitSha = import_child_process.default.execSync("git rev-parse HEAD", execOpts).trim();
        } else {
          import_child_process.default.execSync(`git commit --allow-empty -m "${msg.replace(/"/g, '\\"')}"`, execOpts);
          commitSha = import_child_process.default.execSync("git rev-parse HEAD", execOpts).trim();
        }
        try {
          import_child_process.default.execSync(`git push origin ${branch}`, execOpts);
        } catch (pushErr) {
          console.warn("[Git Push] Standard push warning, attempting with force push:", pushErr.message);
          import_child_process.default.execSync(`git push origin ${branch} --force`, execOpts);
        }
        const updatedConfig = {
          ...cfg,
          githubToken: cleanToken,
          repoUrl: effectiveRepoUrl,
          lastPushed: now.toISOString(),
          lastSynced: now.toISOString(),
          lastVersion: versionStr,
          lastTotalRows: docToPush?.rows?.length || 461
        };
        import_fs.default.writeFileSync(GITHUB_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
        return res.json({
          success: true,
          message: pushFullCode ? `Pomy\u015Blnie wys\u0142ano CA\u0141Y KOD PROGRAMU (pliki aplikacji, interfejs, serwer i baz\u0119) do GitHub (${owner}/${repo})! Vercel natychmiast rozpocz\u0105\u0142 budowanie i publikacj\u0119 nowej wersji online.` : `Pomy\u015Blnie wys\u0142ano zaktualizowan\u0105 baz\u0119 (${docToPush?.rows?.length || 461} modeli) oraz ${uploadsCount} zdj\u0119\u0107 z folderu public/uploads/ do GitHub (${owner}/${repo})! Vercel automatycznie rozpoczyna publikacj\u0119 online.`,
          uploadsCount,
          totalRows: docToPush?.rows?.length || 461,
          commitSha,
          version: versionStr,
          isFullCode: !!pushFullCode
        });
      } finally {
        try {
          import_child_process.default.execSync(`git remote set-url origin "https://github.com/${owner}/${repo}.git"`, { cwd: process.cwd() });
        } catch (_) {
        }
      }
    } catch (err) {
      console.error("[GitHub Push Error]:", err);
      return res.status(500).json({
        success: false,
        error: `B\u0142\u0105d podczas wysy\u0142ania do GitHub: ${err.stderr || err.message || "Nieznany b\u0142\u0105d"}`
      });
    }
  });
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found", path: req.path });
  });
  const isProduction = process.env.NODE_ENV === "production";
  const serveStaticAssets = () => {
    const candidatePaths = [
      import_path.default.join(process.cwd(), "dist"),
      typeof __dirname !== "undefined" ? __dirname : "",
      typeof __dirname !== "undefined" ? import_path.default.join(__dirname, "..", "dist") : "",
      process.cwd()
    ].filter(Boolean);
    const distPath = candidatePaths.find((p) => import_fs.default.existsSync(import_path.default.join(p, "index.html"))) || import_path.default.join(process.cwd(), "dist");
    if (import_fs.default.existsSync(import_path.default.join(distPath, "index.html"))) {
      console.log(`\u{1F4E6} Serving production static assets from: ${distPath}`);
      if (import_fs.default.existsSync(import_path.default.join(distPath, "assets"))) {
        app.use("/assets", import_express.default.static(import_path.default.join(distPath, "assets"), {
          maxAge: "7d",
          immutable: true
        }));
      }
      app.use(import_express.default.static(distPath, {
        maxAge: "1h",
        index: false
      }));
      app.get("*", (req, res, next) => {
        const indexPath = import_path.default.join(distPath, "index.html");
        if (import_fs.default.existsSync(indexPath)) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.sendFile(indexPath, (err) => {
            if (err && !res.headersSent) {
              next(err);
            }
          });
        } else {
          res.status(404).send("Application build not found.");
        }
      });
    } else {
      console.warn("\u26A0\uFE0F dist/index.html not found in candidate paths:", candidatePaths);
      app.get("*", (req, res) => {
        const rootIndex = import_path.default.join(process.cwd(), "index.html");
        if (import_fs.default.existsSync(rootIndex)) {
          return res.sendFile(rootIndex);
        }
        res.status(200).send('<!DOCTYPE html><html><head><title>AutoLamp Cennik</title></head><body><div id="root">Aplikacja uruchamia si\u0119... Prosz\u0119 od\u015Bwie\u017Cy\u0107 za chwil\u0119.</div></body></html>');
      });
    }
  };
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite dev middleware could not be initialized, falling back to static build assets:", viteErr);
      serveStaticAssets();
    }
  } else {
    serveStaticAssets();
  }
  app.use((err, req, res, next) => {
    console.error("[Express Error Handler]:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ success: false, error: err?.message || "Wewn\u0119trzny b\u0142\u0105d serwera" });
  });
  const PORT = 3e3;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (production: ${process.env.NODE_ENV === "production"})`);
  });
  server.on("error", (err) => {
    console.error("[Server Listen Error]:", err);
  });
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed gracefully");
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    server.close(() => {
      process.exit(0);
    });
  });
}
process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]:", reason);
});
startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
