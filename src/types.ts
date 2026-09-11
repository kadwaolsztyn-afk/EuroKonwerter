export type MainTab = 'client' | 'wholesale' | 'settings';
export type ViewMode = 'original' | 'grid' | 'gallery' | 'analytics' | 'backup' | 'security';
export type SettingsTab = 'basic' | 'advanced';

export interface DocumentRow {
  id: number;
  lp?: string | number;
  brand: string;
  model: string;
  factoryCode: string;
  years: string;
  staticSignal: string;
  priceClientStatic: string;
  basePriceClientStatic?: string;
  priceBrokerStatic: string;
  basePriceBrokerStatic?: string;
  dynamicSignal: string;
  priceClientDynamic: string;
  basePriceClientDynamic?: string;
  priceBrokerDynamic: string;
  basePriceBrokerDynamic?: string;
  installation: string;
  coding: string;
  lampCount: string;
  imageUrl?: string;
  imageAlt?: string;
  customNotes?: string;
  multimediaVersion?: string;
  multimediaPriceClient?: string;
  multimediaPriceBroker?: string;
  multimediaImageUrl?: string;
  multimediaNotes?: string;
  multimediaItems?: MultimediaItem[];
  rawCells?: string[];
}

export interface MultimediaItem {
  id: string;
  title?: string;
  version?: string;
  priceClient?: string;
  priceBroker?: string;
  imageUrl?: string;
  notes?: string;
}

export interface DocumentColumn {
  key: string;
  label: string;
  width?: number;
}

export interface ExtractedImage {
  id: string;
  src: string;
  originalSrc: string;
  name?: string;
  brand?: string;
  model?: string;
  rowIndex?: number;
  rowId?: number;
  width?: number;
  height?: number;
}

export interface ImportedDocument {
  id: string;
  name: string;
  fileType: 'html' | 'excel' | 'csv' | 'sample' | 'json';
  sizeFormatted: string;
  importedAt: Date;
  version?: string;
  rawHtml?: string;
  rows: DocumentRow[];
  headers: string[];
  images: ExtractedImage[];
  totalRows: number;
  brandsCount: number;
  customCss?: string;
}
