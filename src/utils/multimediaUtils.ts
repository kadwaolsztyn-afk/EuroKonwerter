import { DocumentRow, MultimediaItem } from '../types';

/**
 * Normalizes multimedia items for a given row.
 * If multimediaItems array exists and is non-empty, returns it.
 * Otherwise, falls back to legacy multimedia fields (multimediaVersion, multimediaImageUrl, etc.).
 */
export function normalizeMultimediaItems(row: Partial<DocumentRow> | null | undefined): MultimediaItem[] {
  if (!row) {
    return [
      {
        id: 'mm-1',
        title: 'Multimedia 1',
        version: '',
        priceClient: '',
        priceBroker: '',
        imageUrl: '',
        notes: '',
      },
    ];
  }

  if (Array.isArray(row.multimediaItems) && row.multimediaItems.length > 0) {
    return row.multimediaItems.map((item, idx) => ({
      id: item.id || `mm-${idx + 1}`,
      title: item.title?.trim() || `Multimedia ${idx + 1}`,
      version: item.version || '',
      priceClient: item.priceClient || '',
      priceBroker: item.priceBroker || '',
      imageUrl: item.imageUrl || '',
      notes: item.notes || '',
    }));
  }

  // Fallback to legacy single-item multimedia fields
  return [
    {
      id: 'mm-1',
      title: 'Multimedia 1',
      version: row.multimediaVersion || '',
      priceClient: row.multimediaPriceClient || '',
      priceBroker: row.multimediaPriceBroker || '',
      imageUrl: row.multimediaImageUrl || '',
      notes: row.multimediaNotes || '',
    },
  ];
}

/**
 * Synchronizes row fields with the multimedia items list.
 * Updates both the `multimediaItems` array and primary legacy fields (for backward compatibility).
 */
export function syncMultimediaFields(row: DocumentRow, items: MultimediaItem[]): DocumentRow {
  const safeItems = items.length > 0 ? items : [
    {
      id: 'mm-1',
      title: 'Multimedia 1',
      version: '',
      priceClient: '',
      priceBroker: '',
      imageUrl: '',
      notes: '',
    },
  ];

  const primary = safeItems[0];

  return {
    ...row,
    multimediaVersion: primary.version || '',
    multimediaPriceClient: primary.priceClient || '',
    multimediaPriceBroker: primary.priceBroker || '',
    multimediaImageUrl: primary.imageUrl || '',
    multimediaNotes: primary.notes || '',
    multimediaItems: safeItems,
  };
}

/**
 * Generates a new multimedia item with an incremental name and unique ID.
 */
export function createNewMultimediaItem(existingItems: MultimediaItem[]): MultimediaItem {
  const nextNum = existingItems.length + 1;
  const uniqueId = `mm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: uniqueId,
    title: `Multimedia ${nextNum}`,
    version: '',
    priceClient: '',
    priceBroker: '',
    imageUrl: '',
    notes: '',
  };
}
