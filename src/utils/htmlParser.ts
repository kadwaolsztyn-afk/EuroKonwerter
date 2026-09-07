import { ImportedDocument, DocumentRow, ExtractedImage } from '../types';

/**
 * Normalizes image URLs (converts Google Drive share links, removes tracking, handles encoded paths)
 */
export function normalizeImageUrl(rawUrl: string, imageMap?: Map<string, string>): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // 1. Check local image map first (e.g. from zip or attached files)
  if (imageMap && imageMap.size > 0) {
    const filename = url.split('/').pop() || url;
    const cleanFilename = filename.split('?')[0];
    const mapped =
      imageMap.get(url) ||
      imageMap.get(filename) ||
      imageMap.get(cleanFilename) ||
      imageMap.get(`./${cleanFilename}`) ||
      imageMap.get(decodeURIComponent(cleanFilename));
    if (mapped) return mapped;
  }

  // 2. Convert Google Drive Links to Direct Display URLs
  // e.g. drive.google.com/file/d/FILE_ID/view -> https://lh3.googleusercontent.com/d/FILE_ID
  const driveMatch1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch1 && driveMatch1[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch1[1]}`;
  }

  const driveMatch2 = url.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (driveMatch2 && driveMatch2[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch2[1]}`;
  }

  const docsMatch = url.match(/docs\.google\.com\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${docsMatch[1]}`;
  }

  // 3. If googleusercontent url without sizing, ensure it renders nicely
  if (url.includes('googleusercontent.com') && !url.includes('=s') && !url.includes('=w')) {
    return `${url}=w1000`;
  }

  return url;
}

/**
 * Extracts all image URLs from a DOM element (checking src, data-src, background-image, etc.)
 */
export function extractImageSrcFromElement(
  el: Element | null,
  imageMap?: Map<string, string>
): string {
  if (!el) return '';

  const img = el.tagName === 'IMG' ? (el as HTMLImageElement) : el.querySelector('img');
  if (img) {
    const rawSrc =
      img.getAttribute('src') ||
      img.getAttribute('data-src') ||
      img.getAttribute('data-original-src') ||
      img.getAttribute('data-url') ||
      '';

    if (rawSrc) {
      return normalizeImageUrl(rawSrc, imageMap);
    }
  }

  // Check inline background-image style
  const style = el.getAttribute('style') || '';
  const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
  if (bgMatch && bgMatch[1]) {
    return normalizeImageUrl(bgMatch[1], imageMap);
  }

  // Check data attributes on parent element
  const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-image');
  if (dataSrc) {
    return normalizeImageUrl(dataSrc, imageMap);
  }

  return '';
}

export function parseHtmlDocument(
  htmlContent: string,
  fileName: string = 'Dokument_1to1.html',
  imageMap?: Map<string, string>
): ImportedDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const rows: DocumentRow[] = [];
  const extractedImages: ExtractedImage[] = [];

  // Map overlay images from Google Sheets if present (e.g. embed_... objects)
  const overlayMapByRow = new Map<number, string>();
  const overlayList: string[] = [];

  try {
    // 1. Look for posObj scripts: e.g. posObj('viewport', 'embed_2045629525', 91, 16, 1, 16)
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => {
      const text = script.textContent || '';
      const matches = text.matchAll(/posObj\s*\([^,]+,\s*['"]([^'"]+)['"],\s*(\d+)/gi);
      for (const match of matches) {
        const embedId = match[1];
        const rowNum = parseInt(match[2], 10);
        const embedEl = doc.getElementById(embedId);
        const src = extractImageSrcFromElement(embedEl, imageMap);
        if (src) {
          overlayMapByRow.set(rowNum, src);
          overlayMapByRow.set(rowNum + 1, src);
          overlayList.push(src);
        }
      }
    });

    // 2. Also find all direct overlay divs: .waffle-embedded-object-overlay or div[id^="embed_"]
    const overlayElements = doc.querySelectorAll(
      '.waffle-embedded-object-overlay, div[id^="embed_"], div[id^="embedded-object-"], .embedded-object'
    );
    overlayElements.forEach((el) => {
      const src = extractImageSrcFromElement(el, imageMap);
      if (src && !overlayList.includes(src)) {
        overlayList.push(src);
      }
    });

    // 3. Find all images in the entire document body
    const allImgs = doc.querySelectorAll('img');
    allImgs.forEach((imgEl, idx) => {
      const src = extractImageSrcFromElement(imgEl, imageMap);
      if (src && !overlayList.includes(src)) {
        overlayList.push(src);
        extractedImages.push({
          id: `raw-img-${idx}`,
          src,
          originalSrc: src,
          rowIndex: idx + 1,
        });
      }
    });
  } catch (e) {
    console.warn('Overlay image parsing note:', e);
  }

  const trElements = doc.querySelectorAll('tr');
  let rowCounter = 1;
  let overlayIndex = 0;

  trElements.forEach((tr, trIdx) => {
    const tds = tr.querySelectorAll('td, th');
    if (tds.length < 3) return;

    let lpVal = '';
    let brandVal = '';
    let modelVal = '';
    let factoryCodeVal = '';
    let yearsVal = '';
    let staticSignalVal = '';
    let priceClientStaticVal = '';
    let priceBrokerStaticVal = '';
    let dynamicSignalVal = '';
    let priceClientDynamicVal = '';
    let priceBrokerDynamicVal = '';
    let installationVal = '';
    let codingVal = '';
    let lampCountVal = '';
    let imgUrl = '';

    const textCells: string[] = [];
    tds.forEach((td) => {
      textCells.push(td.textContent?.trim() || '');
      if (!imgUrl) {
        imgUrl = extractImageSrcFromElement(td, imageMap);
      }
    });

    // If still no image in cells, check overlay maps
    if (!imgUrl) {
      imgUrl =
        overlayMapByRow.get(trIdx) ||
        overlayMapByRow.get(trIdx - 1) ||
        overlayMapByRow.get(trIdx + 1) ||
        '';
    }

    // Try finding brand index
    let foundBrandIndex = -1;

    for (let i = 0; i < textCells.length - 1; i++) {
      const cellText = textCells[i];
      if (
        cellText === 'LP.' ||
        cellText === 'Marka' ||
        cellText === 'Cennik modyfikacji lamp' ||
        cellText.includes('Niniejszy dokument')
      ) {
        return;
      }

      const candidateBrand = cellText.trim();
      const candidateModel = (textCells[i + 1] || '').trim();
      // Ensure candidateBrand is a real brand name (not an LP number, not empty, not document header)
      const isNumberOrLp = /^\d+[\.\)]?$/.test(candidateBrand) || !isNaN(Number(candidateBrand));

      if (
        candidateBrand &&
        candidateModel &&
        candidateBrand.length >= 2 &&
        !isNumberOrLp &&
        candidateBrand !== 'LP.' &&
        candidateBrand !== 'Marka' &&
        candidateBrand !== 'Model' &&
        !candidateBrand.includes('Cennik') &&
        !candidateBrand.includes('Wersja') &&
        !candidateBrand.includes('Rabat')
      ) {
        const cellYears = textCells[i + 3] || textCells[i + 2] || '';
        if (
          /\d{4}/.test(cellYears) ||
          cellYears.includes('20') ||
          cellYears.includes('19') ||
          cellYears === '-' ||
          textCells.length >= 6
        ) {
          foundBrandIndex = i;
          break;
        }
      }
    }

    if (foundBrandIndex !== -1) {
      brandVal = textCells[foundBrandIndex] || '';
      modelVal = textCells[foundBrandIndex + 1] || '';
      factoryCodeVal = textCells[foundBrandIndex + 2] || '-';
      yearsVal = textCells[foundBrandIndex + 3] || '';
      staticSignalVal = textCells[foundBrandIndex + 4] || '';
      priceClientStaticVal = textCells[foundBrandIndex + 5] || '';
      priceBrokerStaticVal = textCells[foundBrandIndex + 6] || '';
      dynamicSignalVal = textCells[foundBrandIndex + 7] || '';
      priceClientDynamicVal = textCells[foundBrandIndex + 8] || '';
      priceBrokerDynamicVal = textCells[foundBrandIndex + 9] || '';
      installationVal = textCells[foundBrandIndex + 10] || '';
      codingVal = textCells[foundBrandIndex + 11] || '';
      lampCountVal = textCells[foundBrandIndex + 12] || '';
      lpVal = textCells[foundBrandIndex - 1] || `${rowCounter}`;

      // If no cell image found but we have sequential overlays/images
      if (!imgUrl && overlayList.length > 0 && overlayIndex < overlayList.length) {
        imgUrl = overlayList[overlayIndex];
        overlayIndex++;
      }

      if (imgUrl) {
        const existing = extractedImages.find((img) => img.src === imgUrl);
        if (existing) {
          existing.brand = brandVal;
          existing.model = modelVal;
          existing.rowIndex = rowCounter;
        } else {
          extractedImages.push({
            id: `img-${trIdx}-${rowCounter}`,
            src: imgUrl,
            originalSrc: imgUrl,
            brand: brandVal,
            model: modelVal,
            rowIndex: rowCounter,
          });
        }
      }

      rows.push({
        id: rowCounter,
        lp: lpVal || rowCounter,
        brand: brandVal,
        model: modelVal,
        factoryCode: factoryCodeVal,
        years: yearsVal,
        staticSignal: staticSignalVal,
        priceClientStatic: priceClientStaticVal,
        basePriceClientStatic: priceClientStaticVal,
        priceBrokerStatic: priceBrokerStaticVal,
        basePriceBrokerStatic: priceBrokerStaticVal,
        dynamicSignal: dynamicSignalVal,
        priceClientDynamic: priceClientDynamicVal,
        basePriceClientDynamic: priceClientDynamicVal,
        priceBrokerDynamic: priceBrokerDynamicVal,
        basePriceBrokerDynamic: priceBrokerDynamicVal,
        installation: installationVal,
        coding: codingVal,
        lampCount: lampCountVal,
        imageUrl: imgUrl,
        imageAlt: `${brandVal} ${modelVal}`,
        rawCells: textCells,
      });

      rowCounter++;
    }
  });

  // Fallback for general table if specialized pattern didn't yield rows
  if (rows.length === 0) {
    trElements.forEach((tr, trIdx) => {
      if (trIdx === 0) return; // Skip header
      const tds = tr.querySelectorAll('td');
      if (tds.length < 2) return;

      const cells = Array.from(tds).map((td) => td.textContent?.trim() || '');
      let img = extractImageSrcFromElement(tr, imageMap);

      if (!img && overlayList[trIdx - 1]) {
        img = overlayList[trIdx - 1];
      }

      if (img) {
        extractedImages.push({
          id: `img-fallback-${trIdx}`,
          src: img,
          originalSrc: img,
          rowIndex: rowCounter,
        });
      }

      rows.push({
        id: rowCounter,
        lp: cells[0] || `${rowCounter}`,
        brand: cells[1] || cells[0] || `Pozycja ${rowCounter}`,
        model: cells[2] || '',
        factoryCode: cells[3] || '-',
        years: cells[4] || '',
        staticSignal: cells[5] || '',
        priceClientStatic: cells[6] || '',
        basePriceClientStatic: cells[6] || '',
        priceBrokerStatic: cells[7] || '',
        dynamicSignal: cells[8] || '',
        priceClientDynamic: cells[9] || '',
        basePriceClientDynamic: cells[9] || '',
        priceBrokerDynamic: cells[10] || '',
        installation: cells[11] || '',
        coding: cells[12] || '',
        lampCount: cells[13] || '',
        imageUrl: img,
        imageAlt: cells[1] || `Wiersz ${rowCounter}`,
        rawCells: cells,
      });
      rowCounter++;
    });
  }

  // Ensure rawHtml includes meta referrer and referrerpolicy
  let safeRawHtml = htmlContent;
  if (!safeRawHtml.includes('name="referrer"')) {
    if (safeRawHtml.includes('<head>')) {
      safeRawHtml = safeRawHtml.replace(
        '<head>',
        '<head><meta name="referrer" content="no-referrer">'
      );
    } else if (safeRawHtml.includes('<html>')) {
      safeRawHtml = safeRawHtml.replace(
        '<html>',
        '<html><head><meta name="referrer" content="no-referrer"></head>'
      );
    }
  }

  const brandsSet = new Set(rows.map((r) => r.brand).filter(Boolean));

  return {
    id: `doc-${Date.now()}`,
    name: fileName,
    fileType: 'html',
    sizeFormatted: `${(htmlContent.length / 1024).toFixed(1)} KB`,
    importedAt: new Date(),
    rawHtml: safeRawHtml,
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
    images: extractedImages,
    totalRows: rows.length,
    brandsCount: brandsSet.size,
  };
}
