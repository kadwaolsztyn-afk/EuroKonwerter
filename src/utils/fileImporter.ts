import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { ImportedDocument, DocumentRow, ExtractedImage } from '../types';
import { parseHtmlDocument } from './htmlParser';

/**
 * Checks if arrayBuffer starts with ZIP signature 'PK\x03\x04' or 'PK'
 */
function isZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // 'P', 'K'
}

/**
 * Checks if arrayBuffer starts with legacy OLE2 / BIFF8 signature (0xD0 0xCF 0x11 0xE0)
 */
function isLegacyXlsBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
}

/**
 * Helper to convert Uint8Array / ArrayBuffer to base64 Data URL
 */
export function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Robust XML relationship parser (handles namespaces, prefixes, and regex fallbacks)
 */
function parseRelsXml(relsText: string, mediaFiles: Map<string, string>): Map<string, string> {
  const relIdToMedia = new Map<string, string>();

  // 1. Regex approach (namespace-immune)
  const relRegex = /<(?:\w+:)?Relationship[^>]*\bId=["']([^"']+)["'][^>]*\bTarget=["']([^"']+)["']/gi;
  let match;
  while ((match = relRegex.exec(relsText)) !== null) {
    const id = match[1];
    const target = match[2];
    const targetFilename = target.split('/').pop() || '';
    const cleanTarget = target.replace(/^\.\.\//, '').replace(/^xl\//, '');

    const dataUrl =
      mediaFiles.get(target) ||
      mediaFiles.get(cleanTarget) ||
      mediaFiles.get(targetFilename) ||
      mediaFiles.get(`media/${targetFilename}`) ||
      mediaFiles.get(`../media/${targetFilename}`) ||
      mediaFiles.get(`xl/media/${targetFilename}`);

    if (id && dataUrl) {
      relIdToMedia.set(id, dataUrl);
    }
  }

  // 2. DOMParser fallback
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(relsText, 'application/xml');
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el.localName.toLowerCase() === 'relationship') {
        const id = el.getAttribute('Id') || el.getAttribute('id');
        const target = el.getAttribute('Target') || el.getAttribute('target') || '';
        const targetFilename = target.split('/').pop() || '';
        const cleanTarget = target.replace(/^\.\.\//, '').replace(/^xl\//, '');

        const dataUrl =
          mediaFiles.get(target) ||
          mediaFiles.get(cleanTarget) ||
          mediaFiles.get(targetFilename) ||
          mediaFiles.get(`media/${targetFilename}`) ||
          mediaFiles.get(`../media/${targetFilename}`);

        if (id && dataUrl && !relIdToMedia.has(id)) {
          relIdToMedia.set(id, dataUrl);
        }
      }
    });
  } catch (err) {
    // Ignore XML parse errors if regex already worked
  }

  return relIdToMedia;
}

/**
 * Extracts 100% of images and coordinates from XLSX zip archive
 * Supports:
 * - xl/media/* binaries
 * - xl/drawings/drawing*.xml (anchors)
 * - xl/cellimages.xml (Excel 365 / Google Sheets in-cell images)
 * - xl/worksheets/sheet*.xml (rich values & DISPIMG formulas)
 */
async function extractAllImagesFromXlsxZip(
  arrayBuffer: ArrayBuffer
): Promise<{
  cellImageMap: Map<string, string>; // "row-col" -> dataUrl
  rowImageMap: Map<number, string[]>; // rowNumber (1-based) -> dataUrls
  allImagesList: string[]; // sequential list of extracted images
  extractedImages: ExtractedImage[];
}> {
  const cellImageMap = new Map<string, string>();
  const rowImageMap = new Map<number, string[]>();
  const allImagesList: string[] = [];
  const extractedImages: ExtractedImage[] = [];

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Extract all media files in xl/media/
    const mediaFiles = new Map<string, string>();
    const mediaEntries = Object.keys(zip.files)
      .filter((path) => path.startsWith('xl/media/') && !zip.files[path].dir)
      .sort((a, b) => {
        // Natural sort by filename (e.g. image1, image2, image10)
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

    let imgIndex = 0;
    for (const path of mediaEntries) {
      const file = zip.file(path);
      if (file) {
        const bytes = await file.async('uint8array');
        const fileName = path.replace('xl/media/', '');
        const mimeType = getMimeTypeFromExt(fileName);
        const dataUrl = uint8ArrayToDataUrl(bytes, mimeType);

        mediaFiles.set(fileName, dataUrl);
        mediaFiles.set(`media/${fileName}`, dataUrl);
        mediaFiles.set(`../media/${fileName}`, dataUrl);
        mediaFiles.set(`xl/media/${fileName}`, dataUrl);
        mediaFiles.set(path, dataUrl);

        allImagesList.push(dataUrl);

        extractedImages.push({
          id: `extracted-media-${imgIndex}`,
          src: dataUrl,
          originalSrc: fileName,
          rowIndex: imgIndex + 1,
        });

        imgIndex++;
      }
    }

    // 2. Parse drawing relationships: xl/drawings/_rels/drawing*.xml.rels
    const drawingRelsEntries = Object.keys(zip.files).filter((path) =>
      path.includes('drawings/_rels/') && path.endsWith('.rels')
    );

    for (const relsPath of drawingRelsEntries) {
      const relsFile = zip.file(relsPath);
      if (!relsFile) continue;

      const relsText = await relsFile.async('text');
      const relIdToMedia = parseRelsXml(relsText, mediaFiles);

      // Corresponding drawing XML: e.g. xl/drawings/drawing1.xml
      const drawingPath = relsPath
        .replace('/_rels/', '/')
        .replace('.rels', '');
      const drawingFile = zip.file(drawingPath);
      if (!drawingFile) continue;

      const drawingText = await drawingFile.async('text');

      // 2a. Regex anchor parser (namespace agnostic)
      // Matches both <xdr:twoCellAnchor> and <xdr:oneCellAnchor>
      const anchorRegex = /<(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)>/gi;
      let anchorMatch;

      while ((anchorMatch = anchorRegex.exec(drawingText)) !== null) {
        const block = anchorMatch[1];

        // Extract row and col from <from> tag
        const fromMatch = /<(?:\w+:)?from[^>]*>([\s\S]*?)<\/(?:\w+:)?from>/i.exec(block);
        if (fromMatch) {
          const fromContent = fromMatch[1];
          const colMatch = /<(?:\w+:)?col>(\d+)<\/(?:\w+:)?col>/i.exec(fromContent);
          const rowMatch = /<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/i.exec(fromContent);

          // Extract blip embed id: r:embed="rIdX" or embed="rIdX" or r:id="rIdX"
          const blipMatch = /<(?:\w+:)?blip[^>]*(?:r:embed|embed|r:id|id)=["']([^"']+)["']/i.exec(block);

          if (rowMatch && blipMatch) {
            const row0 = parseInt(rowMatch[1], 10);
            const row1 = row0 + 1; // 1-based Excel row
            const col = colMatch ? parseInt(colMatch[1], 10) : 0;
            const embedId = blipMatch[1];
            const dataUrl = relIdToMedia.get(embedId);

            if (dataUrl) {
              cellImageMap.set(`${row1}-${col + 1}`, dataUrl);
              cellImageMap.set(`${row1}-${col}`, dataUrl);
              cellImageMap.set(`${row0}-${col}`, dataUrl);

              const rowList = rowImageMap.get(row1) || [];
              if (!rowList.includes(dataUrl)) rowList.push(dataUrl);
              rowImageMap.set(row1, rowList);

              const rowList0 = rowImageMap.get(row0) || [];
              if (!rowList0.includes(dataUrl)) rowList0.push(dataUrl);
              rowImageMap.set(row0, rowList0);
            }
          }
        }
      }
    }

    // 3. Parse Excel 365 In-Cell Images: xl/cellimages.xml
    const cellImagesEntry = Object.keys(zip.files).find((p) =>
      p.endsWith('cellimages.xml') || p.endsWith('cellImages.xml')
    );

    if (cellImagesEntry) {
      const cellImagesFile = zip.file(cellImagesEntry);
      const relsEntry = Object.keys(zip.files).find(
        (p) => p.includes('cellimages.xml.rels') || p.includes('cellImages.xml.rels')
      );

      let relIdToMedia = new Map<string, string>();
      if (relsEntry) {
        const relsFile = zip.file(relsEntry);
        if (relsFile) {
          const relsText = await relsFile.async('text');
          relIdToMedia = parseRelsXml(relsText, mediaFiles);
        }
      }

      if (cellImagesFile) {
        const cellImagesText = await cellImagesFile.async('text');
        // Extract all embedded images from cellimages.xml
        const blipMatches = cellImagesText.matchAll(/<(?:\w+:)?blip[^>]*(?:r:embed|embed)=["']([^"']+)["']/gi);
        let cIdx = 1;
        for (const bMatch of blipMatches) {
          const rId = bMatch[1];
          const dataUrl = relIdToMedia.get(rId) || mediaFiles.get(`image${cIdx}.png`) || mediaFiles.get(`image${cIdx}.jpeg`);
          if (dataUrl) {
            const list = rowImageMap.get(cIdx + 1) || [];
            list.push(dataUrl);
            rowImageMap.set(cIdx + 1, list);
          }
          cIdx++;
        }
      }
    }
  } catch (err) {
    console.warn('Direct XLSX Zip image parsing warning:', err);
  }

  return { cellImageMap, rowImageMap, allImagesList, extractedImages };
}

/**
 * Parses XLSX buffer using ExcelJS + JSZip to retain 100% of images and rich formatting.
 */
async function parseWithExcelJS(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<ImportedDocument> {
  // 1. Extract all images directly from XLSX zip archive with cell coordinates
  const { cellImageMap, rowImageMap, allImagesList, extractedImages } =
    await extractAllImagesFromXlsxZip(arrayBuffer);

  // 2. Load workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Brak arkusza w pliku Excel.');
  }

  const rows: DocumentRow[] = [];
  const processedImages: ExtractedImage[] = [...extractedImages];

  // Also collect any images ExcelJS parsed natively
  try {
    const excelJsImages = worksheet.getImages();
    excelJsImages.forEach((img) => {
      const imgId = Number(img.imageId);
      const media = (workbook.model as any)?.media?.[imgId];
      if (media && media.buffer) {
        const base64 = Buffer.from(media.buffer).toString('base64');
        const dataUrl = `data:image/${media.extension || 'jpeg'};base64,${base64}`;

        const tlRow = img.range.tl.row;
        const row1 = Math.floor(tlRow) + 1;
        const row0 = Math.floor(tlRow);
        const col = Math.floor(img.range.tl.col || 0) + 1;

        cellImageMap.set(`${row1}-${col}`, dataUrl);
        cellImageMap.set(`${row0}-${col}`, dataUrl);

        const list = rowImageMap.get(row1) || [];
        if (!list.includes(dataUrl)) list.push(dataUrl);
        rowImageMap.set(row1, list);
      }
    });
  } catch (err) {
    console.warn('ExcelJS native image reading warning:', err);
  }

  let rowCounter = 1;
  let imageSequentialIdx = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return;

    const values = row.values as (string | number | undefined)[];
    const cellStrings = values.map((v) =>
      v !== undefined && v !== null ? String(v).trim() : ''
    );

    // Look for brand and model
    let brand = cellStrings[4] || cellStrings[3] || cellStrings[1] || '';
    let model = cellStrings[5] || cellStrings[4] || cellStrings[2] || '';

    // If candidate isn't ideal, look across all cells
    if (!brand || brand === 'LP.' || brand === 'Marka' || brand.includes('Cennik')) {
      for (let i = 0; i < cellStrings.length - 1; i++) {
        const c1 = cellStrings[i];
        const c2 = cellStrings[i + 1];
        if (
          c1 &&
          c2 &&
          c1 !== 'Marka' &&
          c1 !== 'LP.' &&
          !c1.includes('Cennik') &&
          !c1.includes('Wersja') &&
          !c1.includes('Rabat') &&
          !c1.includes('Niniejszy') &&
          c1.length >= 2
        ) {
          brand = c1;
          model = c2;
          break;
        }
      }
    }

    if (
      brand &&
      model &&
      brand !== 'Marka' &&
      brand !== 'LP.' &&
      !brand.includes('Cennik') &&
      !brand.includes('Niniejszy') &&
      !brand.includes('Wersja') &&
      !brand.includes('Rabat')
    ) {
      const lp = cellStrings[3] || cellStrings[1] || `${rowCounter}`;
      const factoryCode = cellStrings[6] || cellStrings[5] || '-';
      const years = cellStrings[7] || cellStrings[6] || '';
      const staticSignal = cellStrings[8] || cellStrings[7] || '';
      const priceClientStatic = cellStrings[9] || cellStrings[8] || '';
      const priceBrokerStatic = cellStrings[10] || cellStrings[9] || '';
      const dynamicSignal = cellStrings[11] || cellStrings[10] || '';
      const priceClientDynamic = cellStrings[12] || cellStrings[11] || '';
      const priceBrokerDynamic = cellStrings[13] || cellStrings[12] || '';
      const installation = cellStrings[14] || cellStrings[13] || '';
      const coding = cellStrings[15] || cellStrings[14] || '';
      const lampCount = cellStrings[16] || cellStrings[15] || '';

      // Multi-tier image resolution:
      let imageUrl = '';

      // Tier 1: Search all columns for this row in cellImageMap
      for (let c = 1; c <= 30; c++) {
        imageUrl =
          cellImageMap.get(`${rowNumber}-${c}`) ||
          cellImageMap.get(`${rowNumber - 1}-${c}`) ||
          cellImageMap.get(`${rowNumber + 1}-${c}`) ||
          '';
        if (imageUrl) break;
      }

      // Tier 2: Search rowImageMap
      if (!imageUrl) {
        const rowImgs =
          rowImageMap.get(rowNumber) ||
          rowImageMap.get(rowNumber - 1) ||
          rowImageMap.get(rowNumber + 1);
        if (rowImgs && rowImgs.length > 0) {
          imageUrl = rowImgs[0];
        }
      }

      // Tier 3: Sequential fallback from all extracted media
      if (!imageUrl && allImagesList.length > 0 && imageSequentialIdx < allImagesList.length) {
        imageUrl = allImagesList[imageSequentialIdx];
      }

      if (imageUrl) {
        // Update metadata on extracted images
        const existingExt = processedImages.find((img) => img.src === imageUrl);
        if (existingExt) {
          existingExt.brand = brand;
          existingExt.model = model;
          existingExt.rowIndex = rowCounter;
        } else {
          processedImages.push({
            id: `excel-img-${rowNumber}-${imageSequentialIdx}`,
            src: imageUrl,
            originalSrc: imageUrl,
            brand,
            model,
            rowIndex: rowCounter,
          });
        }
        imageSequentialIdx++;
      }

      rows.push({
        id: rowCounter,
        lp,
        brand,
        model,
        factoryCode,
        years,
        staticSignal,
        priceClientStatic,
        basePriceClientStatic: priceClientStatic,
        priceBrokerStatic,
        basePriceBrokerStatic: priceBrokerStatic,
        dynamicSignal,
        priceClientDynamic,
        basePriceClientDynamic: priceClientDynamic,
        priceBrokerDynamic,
        basePriceBrokerDynamic: priceBrokerDynamic,
        installation,
        coding,
        lampCount,
        imageUrl,
        imageAlt: `${brand} ${model}`,
        rawCells: cellStrings,
      });

      rowCounter++;
    }
  });

  const brandsSet = new Set(rows.map((r) => r.brand).filter(Boolean));
  const generatedHtml = generateHtmlFromRows(fileName, rows);

  return {
    id: `excel-${Date.now()}`,
    name: fileName,
    fileType: 'excel',
    sizeFormatted: `${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`,
    importedAt: new Date(),
    rawHtml: generatedHtml,
    rows,
    headers: [
      'LP.',
      'Marka',
      'Model',
      'Kod fabryczny',
      'Lata produkcji',
      'Kierunkowskaz Statyczny',
      'Cena Klient (Statyczna)',
      'Cena Broker (Statyczna)',
      'Kierunkowskaz Dynamiczny',
      'Cena Klient (Dynamiczna)',
      'Cena Broker (Dynamiczna)',
      'Instalacja',
      'Kodowanie',
      'Ilość lamp',
      'Zdjęcie',
    ],
    images: processedImages,
    totalRows: rows.length,
    brandsCount: brandsSet.size,
  };
}

/**
 * Parses XLSX / XLS / CSV buffer using SheetJS as universal fallback.
 */
function parseWithSheetJS(
  arrayBuffer: ArrayBuffer,
  fileName: string
): ImportedDocument {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Brak arkusza w pliku.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

  const rows: DocumentRow[] = [];
  let rowCounter = 1;

  jsonData.forEach((rowArr) => {
    if (!Array.isArray(rowArr) || rowArr.length < 3) return;

    const cellStrings = rowArr.map((c) => (c !== undefined && c !== null ? String(c).trim() : ''));

    // Check for brand/model candidate
    let brandIdx = -1;
    for (let i = 0; i < cellStrings.length - 1; i++) {
      const candidateBrand = cellStrings[i];
      const candidateModel = cellStrings[i + 1];
      const isNumberOrLp = /^\d+[\.\)]?$/.test(candidateBrand) || !isNaN(Number(candidateBrand));
      if (
        candidateBrand &&
        candidateModel &&
        candidateBrand.length >= 2 &&
        !isNumberOrLp &&
        candidateBrand !== 'Marka' &&
        candidateBrand !== 'LP.' &&
        candidateBrand !== 'Model' &&
        !candidateBrand.includes('Cennik') &&
        !candidateBrand.includes('Wersja')
      ) {
        brandIdx = i;
        break;
      }
    }

    if (brandIdx !== -1) {
      const brand = cellStrings[brandIdx] || '';
      const model = cellStrings[brandIdx + 1] || '';
      const factoryCode = cellStrings[brandIdx + 2] || '-';
      const years = cellStrings[brandIdx + 3] || '';
      const staticSignal = cellStrings[brandIdx + 4] || '';
      const priceClientStatic = cellStrings[brandIdx + 5] || '';
      const priceBrokerStatic = cellStrings[brandIdx + 6] || '';
      const dynamicSignal = cellStrings[brandIdx + 7] || '';
      const priceClientDynamic = cellStrings[brandIdx + 8] || '';
      const priceBrokerDynamic = cellStrings[brandIdx + 9] || '';
      const installation = cellStrings[brandIdx + 10] || '';
      const coding = cellStrings[brandIdx + 11] || '';
      const lampCount = cellStrings[brandIdx + 12] || '';
      const lp = cellStrings[brandIdx - 1] || `${rowCounter}`;

      rows.push({
        id: rowCounter,
        lp,
        brand,
        model,
        factoryCode,
        years,
        staticSignal,
        priceClientStatic,
        basePriceClientStatic: priceClientStatic,
        priceBrokerStatic,
        basePriceBrokerStatic: priceBrokerStatic,
        dynamicSignal,
        priceClientDynamic,
        basePriceClientDynamic: priceClientDynamic,
        priceBrokerDynamic,
        basePriceBrokerDynamic: priceBrokerDynamic,
        installation,
        coding,
        lampCount,
        imageUrl: '',
        imageAlt: `${brand} ${model}`,
        rawCells: cellStrings,
      });

      rowCounter++;
    }
  });

  const brandsSet = new Set(rows.map((r) => r.brand).filter(Boolean));
  const generatedHtml = generateHtmlFromRows(fileName, rows);

  return {
    id: `sheetjs-${Date.now()}`,
    name: fileName,
    fileType: 'excel',
    sizeFormatted: `${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`,
    importedAt: new Date(),
    rawHtml: generatedHtml,
    rows,
    headers: [
      'LP.',
      'Marka',
      'Model',
      'Kod fabryczny',
      'Lata produkcji',
      'Kierunkowskaz Statyczny',
      'Cena Klient (Statyczna)',
      'Cena Broker (Statyczna)',
      'Kierunkowskaz Dynamiczny',
      'Cena Klient (Dynamiczna)',
      'Cena Broker (Dynamiczna)',
      'Instalacja',
      'Kodowanie',
      'Ilość lamp',
      'Zdjęcie',
    ],
    images: [],
    totalRows: rows.length,
    brandsCount: brandsSet.size,
  };
}

export function generateHtmlFromRows(fileName: string, rows: DocumentRow[]): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="referrer" content="no-referrer">
<meta http-equiv="X-UA-Compatible" content="IE=edge;">
<title>${fileName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  body { font-family: 'Inter', Calibri, -apple-system, sans-serif; margin: 20px; background: #0f172a; color: #f8fafc; }
  .table-container { background: #1e293b; padding: 20px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); overflow-x: auto; border: 1px solid #334155; }
  .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px; }
  h2 { color: #f8fafc; margin: 0; font-size: 20px; font-weight: 700; }
  .doc-badge { background: #f59e0b25; color: #fbbf24; border: 1px solid #f59e0b50; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
  th { background-color: #f59e0b; color: #000; font-weight: 700; padding: 10px 8px; border: 1px solid #d97706; text-align: center; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  th:first-child { border-top-left-radius: 8px; }
  th:last-child { border-top-right-radius: 8px; }
  td { padding: 8px 10px; border-bottom: 1px solid #334155; border-right: 1px solid #334155; text-align: center; vertical-align: middle; color: #cbd5e1; }
  td:first-child { border-left: 1px solid #334155; font-weight: bold; color: #94a3b8; }
  tr:nth-child(even) td { background-color: #1e293b; }
  tr:nth-child(odd) td { background-color: #0f172a80; }
  tr:hover td { background-color: #33415580; color: #fff; }
  .brand-cell { font-weight: 700; color: #fbbf24; text-align: left; }
  .model-cell { font-weight: 600; color: #fff; text-align: left; }
  .price-cell { font-weight: 700; color: #38bdf8; }
  .img-wrap { width: 140px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
  .img-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  .no-img { color: #64748b; font-size: 11px; font-style: italic; }
</style>
</head>
<body>
  <div class="table-container">
    <div class="header-box">
      <h2>${fileName}</h2>
      <span class="doc-badge">Układ 1:1 • ${rows.length} Pozycji</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>LP.</th><th>Marka</th><th>Model</th><th>Kod fabryczny</th><th>Lata</th>
          <th>Kierunkowskaz Stat.</th><th>Cena Klient (Stat)</th><th>Cena Broker (Stat)</th>
          <th>Kierunkowskaz Dyn.</th><th>Cena Klient (Dyn)</th><th>Cena Broker (Dyn)</th>
          <th>Instalacja</th><th>Kodowanie</th><th>Ilość lamp</th><th>Zdjęcie Lampy</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td>${r.lp}</td>
            <td class="brand-cell">${r.brand}</td>
            <td class="model-cell">${r.model}</td>
            <td>${r.factoryCode}</td>
            <td>${r.years}</td>
            <td>${r.staticSignal}</td>
            <td class="price-cell">${r.priceClientStatic}</td>
            <td>${r.priceBrokerStatic}</td>
            <td>${r.dynamicSignal}</td>
            <td class="price-cell">${r.priceClientDynamic}</td>
            <td>${r.priceBrokerDynamic}</td>
            <td>${r.installation}</td>
            <td>${r.coding}</td>
            <td>${r.lampCount}</td>
            <td>
              ${
                r.imageUrl
                  ? `<div class="img-wrap"><img src="${r.imageUrl}" alt="${r.brand} ${r.model}" referrerpolicy="no-referrer"></div>`
                  : '<span class="no-img">-</span>'
              }
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Replaces relative image URLs in HTML with their Base64 equivalents from the image map
 */
export function injectImagesIntoHtml(
  htmlText: string,
  imageMap: Map<string, string>
): string {
  if (imageMap.size === 0) return htmlText;

  let modifiedHtml = htmlText;

  // Replace src="..." and url(...) references
  imageMap.forEach((dataUrl, key) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filename = key.split('/').pop() || key;
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match exact path
    const regexExact = new RegExp(`(src=['"])[^'"]*${escapedKey}['"]`, 'gi');
    modifiedHtml = modifiedHtml.replace(regexExact, `$1${dataUrl}"`);

    // Match just filename
    const regexFilename = new RegExp(`(src=['"])[^'"]*${escapedFilename}['"]`, 'gi');
    modifiedHtml = modifiedHtml.replace(regexFilename, `$1${dataUrl}"`);

    // Match background-image url
    const regexBg = new RegExp(`url\\(['"]?[^'")]+${escapedFilename}['"]?\\)`, 'gi');
    modifiedHtml = modifiedHtml.replace(regexBg, `url("${dataUrl}")`);
  });

  return modifiedHtml;
}

/**
 * Unpacks a ZIP archive (which may contain HTML + image folder or XLSX)
 */
async function parseZipArchive(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<ImportedDocument> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Check if it's an XLSX archive (has xl/workbook.xml)
  if (zip.file('xl/workbook.xml') || zip.file('xl/sharedStrings.xml') || zip.file('xl/media/')) {
    return parseWithExcelJS(arrayBuffer, fileName);
  }

  // Otherwise, look for .html or .htm files inside the ZIP
  const htmlFiles = Object.keys(zip.files).filter(
    (name) => (name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm')) && !zip.files[name].dir
  );

  // Extract all images in the zip into an imageMap
  const imageMap = new Map<string, string>();
  const imageFiles = Object.keys(zip.files).filter((name) => {
    const lower = name.toLowerCase();
    return (
      (lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.svg') ||
        lower.endsWith('.bmp')) &&
      !zip.files[name].dir
    );
  });

  for (const imgPath of imageFiles) {
    const file = zip.file(imgPath);
    if (file) {
      const bytes = await file.async('uint8array');
      const mimeType = getMimeTypeFromExt(imgPath);
      const dataUrl = uint8ArrayToDataUrl(bytes, mimeType);
      const simpleName = imgPath.split('/').pop() || imgPath;

      imageMap.set(imgPath, dataUrl);
      imageMap.set(simpleName, dataUrl);
      imageMap.set(`./${simpleName}`, dataUrl);
      imageMap.set(decodeURIComponent(simpleName), dataUrl);
    }
  }

  if (htmlFiles.length > 0) {
    // Pick the primary HTML file
    const mainHtmlPath = htmlFiles[0];
    const htmlContent = await zip.file(mainHtmlPath)!.async('text');
    const enrichedHtml = injectImagesIntoHtml(htmlContent, imageMap);
    return parseHtmlDocument(enrichedHtml, fileName.replace('.zip', '.html'), imageMap);
  }

  // Fallback: Try SheetJS
  return parseWithSheetJS(arrayBuffer, fileName);
}

/**
 * Universal safe document importer.
 * Automatically checks magic bytes / MIME type / content to route to the correct parser.
 * Handles HTML, HTM, real XLSX (zip), ZIP archives (HTML + images folder), legacy XLS, CSV.
 */
export async function importDocumentFromFile(
  file: File,
  additionalFiles: File[] = []
): Promise<ImportedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  // If additional files (images) were provided alongside the HTML file
  const imageMap = new Map<string, string>();
  if (additionalFiles.length > 0) {
    for (const addFile of additionalFiles) {
      const lower = addFile.name.toLowerCase();
      if (
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.svg') ||
        lower.endsWith('.bmp')
      ) {
        const bytes = new Uint8Array(await addFile.arrayBuffer());
        const mimeType = getMimeTypeFromExt(addFile.name);
        const dataUrl = uint8ArrayToDataUrl(bytes, mimeType);

        imageMap.set(addFile.name, dataUrl);
        imageMap.set(`./${addFile.name}`, dataUrl);
        imageMap.set((addFile as any).webkitRelativePath || addFile.name, dataUrl);
      }
    }
  }

  // 1. If it has genuine ZIP header (PK\x03\x04), could be XLSX or ZIP with HTML+Images
  if (isZipBuffer(arrayBuffer)) {
    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        return await parseZipArchive(arrayBuffer, file.name);
      }
      return await parseWithExcelJS(arrayBuffer, file.name);
    } catch (excelJsErr) {
      console.warn('ExcelJS failed on zip buffer, trying parseZipArchive / SheetJS fallback:', excelJsErr);
      try {
        return await parseZipArchive(arrayBuffer, file.name);
      } catch (zipErr) {
        return parseWithSheetJS(arrayBuffer, file.name);
      }
    }
  }

  // 2. If it has legacy XLS (BIFF8 OLE2) header, parse with SheetJS
  if (isLegacyXlsBuffer(arrayBuffer)) {
    return parseWithSheetJS(arrayBuffer, file.name);
  }

  // 3. Otherwise, it is text-based (HTML, XML, CSV, TSV, JSON, etc.)
  const decoder = new TextDecoder('utf-8');
  let text = decoder.decode(arrayBuffer);

  // If text contains HTML tags
  if (
    text.includes('<html') ||
    text.includes('<table') ||
    text.includes('<!DOCTYPE') ||
    text.includes('<body') ||
    text.includes('<div') ||
    text.includes('class="waffle"')
  ) {
    if (imageMap.size > 0) {
      text = injectImagesIntoHtml(text, imageMap);
    }
    return parseHtmlDocument(text, file.name, imageMap);
  }

  // 4. Try parsing as SheetJS (handles XML Spreadsheet 2003, CSV, TSV, etc.)
  try {
    return parseWithSheetJS(arrayBuffer, file.name);
  } catch (sheetJsErr) {
    console.warn('SheetJS text parse failed, attempting HTML fallback:', sheetJsErr);
    return parseHtmlDocument(text, file.name, imageMap);
  }
}
