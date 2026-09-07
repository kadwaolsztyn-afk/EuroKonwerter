import { ImportedDocument, DocumentRow, ExtractedImage } from '../types';
import { generateHtmlFromRows } from './fileImporter';

export interface MergeResult {
  updatedDocument: ImportedDocument;
  addedCount: number;
  updatedCount: number;
  totalCount: number;
}

/**
 * Appends new rows from an incoming document into an existing document.
 * Avoids duplicate identical rows if they already exist, or appends them as new catalog items.
 */
export function mergeDocuments(
  existingDoc: ImportedDocument,
  newDoc: ImportedDocument,
  mode: 'append' | 'replace' = 'append'
): MergeResult {
  if (mode === 'replace') {
    return {
      updatedDocument: newDoc,
      addedCount: newDoc.rows.length,
      updatedCount: 0,
      totalCount: newDoc.rows.length,
    };
  }

  const existingRows = [...existingDoc.rows];
  let addedCount = 0;
  let updatedCount = 0;

  // Track existing rows by a signature: (brand + model + factoryCode + years).toLowerCase()
  const existingSignatures = new Map<string, number>(); // signature -> index in existingRows
  existingRows.forEach((row, idx) => {
    const sig = `${(row.brand || '').trim()}|||${(row.model || '').trim()}|||${(row.factoryCode || '').trim()}|||${(row.years || '').trim()}`.toLowerCase();
    existingSignatures.set(sig, idx);
  });

  const mergedRows: DocumentRow[] = [...existingRows];

  newDoc.rows.forEach((newRow) => {
    const sig = `${(newRow.brand || '').trim()}|||${(newRow.model || '').trim()}|||${(newRow.factoryCode || '').trim()}|||${(newRow.years || '').trim()}`.toLowerCase();
    
    // If brand and model are non-empty and signature exists in existing list
    if (newRow.brand && newRow.model && existingSignatures.has(sig)) {
      const targetIdx = existingSignatures.get(sig)!;
      const target = mergedRows[targetIdx];
      // Update fields if incoming row has non-empty values
      let changed = false;
      if (newRow.imageUrl && !target.imageUrl) {
        target.imageUrl = newRow.imageUrl;
        changed = true;
      }
      if (newRow.priceClientStatic && !target.priceClientStatic) {
        target.priceClientStatic = newRow.priceClientStatic;
        changed = true;
      }
      if (newRow.priceClientDynamic && !target.priceClientDynamic) {
        target.priceClientDynamic = newRow.priceClientDynamic;
        changed = true;
      }
      if (newRow.priceBrokerStatic && !target.priceBrokerStatic) {
        target.priceBrokerStatic = newRow.priceBrokerStatic;
        changed = true;
      }
      if (newRow.priceBrokerDynamic && !target.priceBrokerDynamic) {
        target.priceBrokerDynamic = newRow.priceBrokerDynamic;
        changed = true;
      }
      if (newRow.staticSignal && !target.staticSignal) {
        target.staticSignal = newRow.staticSignal;
        changed = true;
      }
      if (newRow.dynamicSignal && !target.dynamicSignal) {
        target.dynamicSignal = newRow.dynamicSignal;
        changed = true;
      }
      if (newRow.lampCount && !target.lampCount) {
        target.lampCount = newRow.lampCount;
        changed = true;
      }
      if (newRow.installation && !target.installation) {
        target.installation = newRow.installation;
        changed = true;
      }
      if (newRow.coding && !target.coding) {
        target.coding = newRow.coding;
        changed = true;
      }
      if (changed) {
        updatedCount++;
      }
    } else {
      // Append as new position
      mergedRows.push({
        ...newRow,
        id: mergedRows.length + 1,
        lp: `${mergedRows.length + 1}`,
      });
      addedCount++;
    }
  });

  // Re-number all rows sequentially
  mergedRows.forEach((row, idx) => {
    row.id = idx + 1;
    row.lp = `${idx + 1}`;
  });

  // Merge images
  const mergedImages: ExtractedImage[] = [...existingDoc.images];
  const existingImageUrls = new Set(existingDoc.images.map((img) => img.src));

  newDoc.images.forEach((newImg) => {
    if (!existingImageUrls.has(newImg.src)) {
      mergedImages.push({
        ...newImg,
        id: `img-${Date.now()}-${mergedImages.length}`,
      });
      existingImageUrls.add(newImg.src);
    }
  });

  // Calculate unique brands
  const brandsSet = new Set(mergedRows.map((r) => r.brand).filter(Boolean));

  // Regenerate 1:1 HTML from all rows
  const documentName = existingDoc.name.includes(newDoc.name)
    ? existingDoc.name
    : `${existingDoc.name} + ${newDoc.name}`;

  const generatedHtml = generateHtmlFromRows(documentName, mergedRows);

  const updatedDocument: ImportedDocument = {
    ...existingDoc,
    name: documentName,
    rows: mergedRows,
    images: mergedImages,
    totalRows: mergedRows.length,
    brandsCount: brandsSet.size,
    rawHtml: generatedHtml,
    importedAt: new Date(),
  };

  return {
    updatedDocument,
    addedCount,
    updatedCount,
    totalCount: mergedRows.length,
  };
}
