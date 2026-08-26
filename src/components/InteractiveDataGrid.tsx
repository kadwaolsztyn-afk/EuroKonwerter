import React, { useState, useMemo, useRef, useEffect, useDeferredValue, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Car,
  X,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ImageIcon,
  Download,
  Upload,
  ImagePlus,
  Trash2,
  Calendar,
  Eye,
  Info,
  Check,
  Building2,
  Lightbulb,
  Tv,
  Edit2,
  RotateCcw,
  ZoomIn,
  Wifi,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Table,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ImportedDocument, DocumentRow } from '../types';
import { PriceModifierPanel } from './PriceModifierPanel';

export type SortColumnKey =
  | 'lp'
  | 'brand'
  | 'model'
  | 'factoryCode'
  | 'years'
  | 'staticSignal'
  | 'priceClientStatic'
  | 'priceBrokerStatic'
  | 'dynamicSignal'
  | 'priceClientDynamic'
  | 'priceBrokerDynamic'
  | 'installation'
  | 'coding'
  | 'lampCount';

export type SortDirection = 'asc' | 'desc';

interface MultimediaZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  title?: string;
  subtitle?: string;
  version?: string;
  badgeText?: string;
}

export const MultimediaZoomImage: React.FC<MultimediaZoomImageProps> = ({
  src,
  alt,
  className = 'max-h-full max-w-full object-contain',
  containerClassName = '',
  title,
  subtitle,
  version,
  badgeText = 'Multimedia',
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed(true);
        }}
        className={`relative group/zoom cursor-pointer inline-flex items-center justify-center ${containerClassName}`}
        title="Kliknij lupkę lub zdjęcie, aby powiększyć"
      >
        <img
          src={src}
          alt={alt}
          className={`${className} transition-transform duration-200 group-hover/zoom:scale-[1.02]`}
          referrerPolicy="no-referrer"
        />

        {/* Lupka (Magnifying Glass) Icon Overlay */}
        <div className="absolute right-1 bottom-1 p-1 rounded-md bg-slate-950/80 hover:bg-amber-500 border border-slate-700 hover:border-amber-400 text-amber-400 hover:text-slate-950 transition-all duration-150 shadow-md flex items-center justify-center z-10">
          <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      </div>

      {/* Enlarged Lightbox Popup via Portal */}
      {isZoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
          >
            <div
              className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-md">
                        {badgeText}
                      </span>
                      {version && (
                        <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 truncate">
                          {version}
                        </span>
                      )}
                    </div>
                    {title && (
                      <h4 className="text-sm sm:text-base font-extrabold text-white mt-1 truncate">
                        {title} {subtitle ? `(${subtitle})` : ''}
                      </h4>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-lg font-bold">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>Powiększenie</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsZoomed(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                    title="Zamknij powiększenie"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Large Image Box */}
              <div className="p-4 sm:p-6 bg-slate-950 flex items-center justify-center flex-1 overflow-hidden min-h-[300px]">
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Footer */}
              <div className="p-3 sm:px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] text-slate-400">
                  Kliknij poza oknem lub przycisk &quot;Zamknij&quot;, aby powrócić.
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const DelayedHoverZoomImage = MultimediaZoomImage;

interface InteractiveDataGridProps {
  document: ImportedDocument;
  onExportExcel?: () => void;
  onUpdateRowImage?: (rowId: number, imageUrl: string) => void;
  onBatchAttachImages?: (files: File[]) => void;
  onUpdateRows?: (updatedRows: DocumentRow[]) => void;
  readOnly?: boolean;
  showBrokerPrices?: boolean;
}

const plCollator = new Intl.Collator('pl', { sensitivity: 'base', numeric: true });
const normYearMap = new Map<string, string>();
const yearRangeMap = new Map<string, { start: number; end: number; isSingleYear: boolean } | null>();
const priceSortMap = new Map<string, number>();
const lpSortMap = new Map<string | number, number>();

function normalizeYears(str: string): string {
  if (!str) return '';
  const cached = normYearMap.get(str);
  if (cached !== undefined) return cached;
  const result = str
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .trim();
  normYearMap.set(str, result);
  return result;
}

function parseYearRange(str: string): { start: number; end: number; isSingleYear: boolean } | null {
  if (!str) return null;
  if (yearRangeMap.has(str)) return yearRangeMap.get(str)!;

  const clean = normalizeYears(str);
  const matches = clean.match(/\b(19\d\d|20\d\d)\b/g);
  if (!matches || matches.length === 0) {
    yearRangeMap.set(str, null);
    return null;
  }
  const start = parseInt(matches[0], 10);
  const isSingle =
    matches.length === 1 &&
    !clean.includes('-') &&
    !clean.includes('+') &&
    !clean.includes('od') &&
    !clean.includes('do');
  const end =
    matches.length >= 2
      ? parseInt(matches[1], 10)
      : clean.includes('-') || clean.includes('+') || clean.includes('od')
      ? 2035
      : start;
  const res = { start, end, isSingleYear: isSingle };
  yearRangeMap.set(str, res);
  return res;
}

export function matchesYearFilter(rowYears: string, yearFilter: string): boolean {
  if (!yearFilter || yearFilter === 'all') return true;
  if (!rowYears || rowYears === '-') return false;

  const normRow = normalizeYears(rowYears);
  const normFilter = normalizeYears(yearFilter);

  // Exact normalized match (e.g. "2018-2024" === "2018-2024")
  if (normRow === normFilter || normRow.includes(normFilter)) {
    return true;
  }

  const rowParsed = parseYearRange(rowYears);
  const filterParsed = parseYearRange(yearFilter);

  if (!rowParsed || !filterParsed) {
    return normRow.includes(normFilter);
  }

  // If filter is a single calendar year (e.g. "2021" or single year)
  if (filterParsed.isSingleYear || /^\d{4}$/.test(normFilter)) {
    const targetYear = filterParsed.start;
    return targetYear >= rowParsed.start && targetYear <= rowParsed.end;
  }

  // If filter is a specific range (e.g. "2018-2024")
  if (filterParsed.start === rowParsed.start && filterParsed.end === rowParsed.end) {
    return true;
  }

  return false;
}

function parsePriceForSort(str?: string): number {
  if (!str) return -1;
  const cached = priceSortMap.get(str);
  if (cached !== undefined) return cached;
  const clean = str.replace(/[^\d]/g, '');
  const num = clean ? parseInt(clean, 10) : -1;
  priceSortMap.set(str, num);
  return num;
}

function parseLpForSort(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 999999;
  const cached = lpSortMap.get(val);
  if (cached !== undefined) return cached;
  const num = parseInt(String(val).replace(/[^\d]/g, ''), 10);
  const res = isNaN(num) ? 999999 : num;
  lpSortMap.set(val, res);
  return res;
}

interface PositionGridCardProps {
  row: DocumentRow;
  showBrokerPrices: boolean;
  readOnly?: boolean;
  onOpenDetails: (row: DocumentRow, initialTab: 'lighting' | 'multimedia') => void;
}

const PositionGridCardComponent: React.FC<PositionGridCardProps> = ({
  row,
  showBrokerPrices,
  readOnly = false,
  onOpenDetails,
}) => {
  const [activeCardTab, setActiveCardTab] = useState<'lighting' | 'multimedia'>('lighting');

  const hasMultimedia = Boolean(
    row.multimediaVersion ||
    row.multimediaPriceClient ||
    row.multimediaPriceBroker ||
    row.multimediaImageUrl ||
    row.multimediaNotes
  );

  return (
    <div
      onClick={() => onOpenDetails(row, activeCardTab)}
      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-400/5 group flex flex-col justify-between gap-3 relative overflow-hidden"
    >
      {/* Top Details & Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                {row.brand}
              </span>
              {row.factoryCode && (
                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                  {row.factoryCode}
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
              {row.model}
            </h4>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Lata: <strong className="text-slate-200">{row.years}</strong></span>
            </div>
          </div>

          {/* Photo Thumbnail */}
          <div className="w-16 h-12 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-amber-400/40 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
            {activeCardTab === 'lighting' ? (
              row.imageUrl ? (
                <img
                  src={row.imageUrl}
                  alt={`${row.brand} ${row.model}`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-700" />
              )
            ) : (
              row.multimediaImageUrl ? (
                <DelayedHoverZoomImage
                  src={row.multimediaImageUrl}
                  alt={`Multimedia ${row.brand} ${row.model}`}
                  title={`${row.brand} ${row.model}`}
                  subtitle={row.years}
                  version={row.multimediaVersion}
                  containerClassName="w-full h-full flex items-center justify-center"
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <Tv className="w-5 h-5 text-slate-700" />
              )
            )}
          </div>
        </div>

        {/* 2 Tabs Switcher on Card: Oświetlenie | Multimedia */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 text-xs mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCardTab('lighting');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer ${
              activeCardTab === 'lighting'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Oświetlenie</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCardTab('multimedia');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer ${
              activeCardTab === 'multimedia'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Multimedia</span>
          </button>
        </div>

        {/* Card Tab Content */}
        {activeCardTab === 'lighting' ? (
          <div>
            {showBrokerPrices ? (
              <div className="bg-slate-950/85 rounded-xl p-2.5 border border-slate-800 space-y-2 text-xs">
                {/* Kierunkowskaz Statyczny */}
                <div className="space-y-1 pb-1.5 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Kier. Statyczny:</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${row.staticSignal && row.staticSignal !== '-' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-600'}`}>
                      {row.staticSignal || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Klient</span>
                      <span className="font-mono font-bold text-amber-300 text-xs truncate">
                        {row.priceClientStatic && row.priceClientStatic !== '-' ? row.priceClientStatic : 'Brak'}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-blue-500/25 flex flex-col">
                      <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-wider">Broker</span>
                      <span className="font-mono font-bold text-blue-400 text-xs truncate">
                        {row.priceBrokerStatic && row.priceBrokerStatic !== '-' ? row.priceBrokerStatic : 'Brak'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kierunkowskaz Dynamiczny */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Kier. Dynamiczny:</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${row.dynamicSignal && row.dynamicSignal !== '-' ? 'bg-blue-400/20 text-blue-300' : 'text-slate-600'}`}>
                      {row.dynamicSignal || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Klient</span>
                      <span className="font-mono font-bold text-amber-300 text-xs truncate">
                        {row.priceClientDynamic && row.priceClientDynamic !== '-' ? row.priceClientDynamic : 'Brak'}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-blue-500/25 flex flex-col">
                      <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-wider">Broker</span>
                      <span className="font-mono font-bold text-blue-400 text-xs truncate">
                        {row.priceBrokerDynamic && row.priceBrokerDynamic !== '-' ? row.priceBrokerDynamic : 'Brak'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Kier. Statyczny</span>
                  <div className="font-mono font-bold text-sky-400 text-xs mt-0.5">
                    {row.priceClientStatic && row.priceClientStatic !== '-' ? row.priceClientStatic : 'Brak'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Kier. Dynamiczny</span>
                  <div className="font-mono font-bold text-sky-400 text-xs mt-0.5">
                    {row.priceClientDynamic && row.priceClientDynamic !== '-' ? row.priceClientDynamic : 'Brak'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : hasMultimedia ? (
          <div className="bg-slate-950/85 rounded-xl p-2.5 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-800/80">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-medium block">Wersja / Urządzenie:</span>
                <span className="text-xs font-bold text-amber-300 truncate block">
                  {row.multimediaVersion || 'Brak informacji'}
                </span>
              </div>
              {row.multimediaImageUrl && (
                <div className="w-10 h-8 rounded bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <DelayedHoverZoomImage
                    src={row.multimediaImageUrl}
                    alt="Multimedia"
                    title={`${row.brand} ${row.model}`}
                    subtitle={row.years}
                    version={row.multimediaVersion}
                    containerClassName="w-full h-full flex items-center justify-center"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>

            {showBrokerPrices ? (
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800 flex flex-col">
                  <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Klient</span>
                  <span className="font-mono font-bold text-amber-300 text-xs truncate">
                    {row.multimediaPriceClient || 'Brak informacji'}
                  </span>
                </div>
                <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-blue-500/25 flex flex-col">
                  <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-wider">Broker</span>
                  <span className="font-mono font-bold text-blue-400 text-xs truncate">
                    {row.multimediaPriceBroker || 'Brak informacji'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Cena:</span>
                <span className="font-mono font-bold text-sky-400 text-xs">
                  {row.multimediaPriceClient || 'Brak informacji'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center min-h-[90px]">
            <Tv className="w-5 h-5 text-amber-400 mb-1.5" />
            <span className="text-xs font-bold text-white">Brak informacji</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Multimedia dla {row.brand} {row.model}</span>
          </div>
        )}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetails(row, activeCardTab);
        }}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md group-hover:shadow-amber-500/20 mt-1"
      >
        {activeCardTab === 'lighting' ? (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>Otwórz pełne dane oświetlenia</span>
          </>
        ) : !readOnly ? (
          <>
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edytuj multimedia</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>Otwórz szczegóły multimediów</span>
          </>
        )}
      </button>
    </div>
  );
};

const PositionGridCard = React.memo(PositionGridCardComponent);

interface DataGridTableRowProps {
  row: DocumentRow;
  index: number;
  readOnly: boolean;
  showBrokerPrices: boolean;
  onOpenDetails: (row: DocumentRow, initialTab: 'lighting' | 'multimedia') => void;
  onOpenImageModal: (row: DocumentRow) => void;
  onUploadImageClick?: (row: DocumentRow) => void;
}

const DataGridTableRow = React.memo<DataGridTableRowProps>(({
  row,
  index,
  readOnly,
  showBrokerPrices,
  onOpenDetails,
  onOpenImageModal,
  onUploadImageClick,
}) => {
  return (
    <tr className="hover:bg-slate-800/60 transition-colors group text-slate-200">
      {/* LP */}
      <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
        {row.lp || index + 1}
      </td>

      {/* Marka */}
      <td className="py-2.5 px-3 font-bold text-amber-400 whitespace-nowrap">
        {row.brand}
      </td>

      {/* Model */}
      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
        {row.model}
      </td>

      {/* Kod fabryczny */}
      <td className="py-2.5 px-2.5 font-mono text-slate-300 whitespace-nowrap">
        {row.factoryCode ? (
          <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            {row.factoryCode}
          </span>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </td>

      {/* Lata */}
      <td className="py-2.5 px-2.5 text-slate-300 whitespace-nowrap text-[11px]">
        {row.years || '-'}
      </td>

      {/* Kier. Stat. */}
      <td className="py-2.5 px-2 text-center">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            row.staticSignal && row.staticSignal !== '-'
              ? 'bg-amber-400/20 text-amber-300'
              : 'text-slate-600'
          }`}
        >
          {row.staticSignal || '-'}
        </span>
      </td>

      {/* Cena Klient (Stat) */}
      <td className="py-2.5 px-2.5 text-right font-bold text-amber-300 font-mono whitespace-nowrap text-xs">
        {row.priceClientStatic || '-'}
      </td>

      {/* Cena Broker (Stat) */}
      {(showBrokerPrices || !readOnly) && (
        <td className="py-2.5 px-2.5 text-right text-blue-300 font-mono font-bold whitespace-nowrap text-xs">
          {row.priceBrokerStatic || '-'}
        </td>
      )}

      {/* Kier. Dyn. */}
      <td className="py-2.5 px-2 text-center">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            row.dynamicSignal && row.dynamicSignal !== '-'
              ? 'bg-blue-400/20 text-blue-300'
              : 'text-slate-600'
          }`}
        >
          {row.dynamicSignal || '-'}
        </span>
      </td>

      {/* Cena Klient (Dyn) */}
      <td className="py-2.5 px-2.5 text-right font-bold text-amber-300 font-mono whitespace-nowrap text-xs">
        {row.priceClientDynamic || '-'}
      </td>

      {/* Cena Broker (Dyn) */}
      {(showBrokerPrices || !readOnly) && (
        <td className="py-2.5 px-2.5 text-right text-blue-300 font-mono font-bold whitespace-nowrap text-xs">
          {row.priceBrokerDynamic || '-'}
        </td>
      )}

      {/* Montaż */}
      <td className="py-2.5 px-2 text-center text-slate-300">
        {row.installation || '-'}
      </td>

      {/* Kodowanie */}
      <td className="py-2.5 px-2 text-center text-slate-300">
        {row.coding || '-'}
      </td>

      {/* Lampy */}
      <td className="py-2.5 px-2 text-center font-bold text-slate-200">
        {row.lampCount || '-'}
      </td>

      {/* Zdjęcie */}
      <td className="py-2.5 px-2 text-center">
        {row.imageUrl ? (
          <div className="flex items-center justify-center gap-1">
            <div
              onClick={() => onOpenImageModal(row)}
              className="relative group/img cursor-pointer inline-flex items-center justify-center bg-slate-950 p-1 rounded-lg border border-slate-700 hover:border-amber-400 transition-all w-16 h-10 overflow-hidden shadow-sm"
              title="Kliknij, aby otworzyć podgląd zdjęcia"
            >
              <img
                src={row.imageUrl}
                alt={`${row.brand} ${row.model}`}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain rounded group-hover/img:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-amber-300 font-bold">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>
            {!readOnly && onUploadImageClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadImageClick(row);
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-amber-400 text-slate-400 hover:text-slate-950 border border-slate-700 hover:border-amber-400 transition-all cursor-pointer"
                title="Wgraj nowe zdjęcie z dysku"
              >
                <Upload className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : !readOnly && onUploadImageClick ? (
          <button
            type="button"
            onClick={() => onUploadImageClick(row)}
            className="px-2 py-1 bg-slate-800 hover:bg-amber-400/20 text-slate-400 hover:text-amber-300 rounded-lg text-[10px] border border-dashed border-slate-700 hover:border-amber-400/50 transition-all flex items-center gap-1 mx-auto cursor-pointer font-medium"
            title="Dodaj zdjęcie dla tego modelu"
          >
            <Upload className="w-3 h-3" />
            <span>+ Dodaj</span>
          </button>
        ) : (
          <span className="text-slate-600 font-mono text-[11px]">-</span>
        )}
      </td>

      {/* Multimedia */}
      <td className="py-2.5 px-2 text-center">
        <button
          type="button"
          onClick={() => onOpenDetails(row, 'multimedia')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all inline-flex items-center gap-1 cursor-pointer ${
            row.multimediaVersion || row.multimediaPriceClient || row.multimediaImageUrl
              ? 'bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Otwórz i edytuj dane multimediów"
        >
          <Tv className="w-3 h-3" />
          <span className="truncate max-w-[70px]">
            {row.multimediaVersion ? row.multimediaVersion : !readOnly ? 'Konfiguruj' : 'Szczegóły'}
          </span>
        </button>
      </td>

      {/* Karta / Szczegóły */}
      <td className="py-2.5 px-2 text-center">
        <button
          type="button"
          onClick={() => onOpenDetails(row, 'lighting')}
          className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 hover:text-amber-200 font-bold rounded-lg text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer"
          title="Otwórz pełną kartę wyceny i specyfikacji"
        >
          <Eye className="w-3 h-3" />
          <span>Karta</span>
        </button>
      </td>
    </tr>
  );
});

export const InteractiveDataGrid: React.FC<InteractiveDataGridProps> = ({
  document,
  onExportExcel,
  onUpdateRowImage,
  onBatchAttachImages,
  onUpdateRows,
  readOnly = false,
  showBrokerPrices = false,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortColumnKey>('model');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');
  const [activeImageModal, setActiveImageModal] = useState<{
    row: DocumentRow;
  } | null>(null);
  const [selectedDetailsRow, setSelectedDetailsRow] = useState<DocumentRow | null>(null);
  const [detailsModalTab, setDetailsModalTab] = useState<'lighting' | 'multimedia'>('lighting');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [editMultimediaVersion, setEditMultimediaVersion] = useState('');
  const [editMultimediaPriceClient, setEditMultimediaPriceClient] = useState('');
  const [editMultimediaPriceBroker, setEditMultimediaPriceBroker] = useState('');
  const [editMultimediaImageUrl, setEditMultimediaImageUrl] = useState('');
  const [editMultimediaNotes, setEditMultimediaNotes] = useState('');
  const [multimediaSavedToast, setMultimediaSavedToast] = useState(false);
  const multimediaFileInputRef = useRef<HTMLInputElement>(null);

  // Online / Offline connection status tracking
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedDetailsRow) {
      setEditMultimediaVersion(selectedDetailsRow.multimediaVersion || '');
      setEditMultimediaPriceClient(selectedDetailsRow.multimediaPriceClient || '');
      setEditMultimediaPriceBroker(selectedDetailsRow.multimediaPriceBroker || '');
      setEditMultimediaImageUrl(selectedDetailsRow.multimediaImageUrl || '');
      setEditMultimediaNotes(selectedDetailsRow.multimediaNotes || '');
      setMultimediaSavedToast(false);
    }
  }, [selectedDetailsRow]);

  const handleSaveMultimedia = (rowToUpdate: DocumentRow) => {
    const updatedRow: DocumentRow = {
      ...rowToUpdate,
      multimediaVersion: editMultimediaVersion.trim(),
      multimediaPriceClient: editMultimediaPriceClient.trim(),
      multimediaPriceBroker: editMultimediaPriceBroker.trim(),
      multimediaImageUrl: editMultimediaImageUrl.trim(),
      multimediaNotes: editMultimediaNotes.trim(),
    };

    if (onUpdateRows) {
      const updatedRows = document.rows.map((r) => (r.id === rowToUpdate.id ? updatedRow : r));
      onUpdateRows(updatedRows);
    }
    setSelectedDetailsRow(updatedRow);
    setMultimediaSavedToast(true);
    setTimeout(() => {
      setMultimediaSavedToast(false);
    }, 3500);
  };

  const handleMultimediaFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditMultimediaImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDetails = useCallback((row: DocumentRow, initialTab: 'lighting' | 'multimedia' = 'lighting') => {
    setSelectedDetailsRow(row);
    setDetailsModalTab(initialTab);
  }, []);

  const handleOpenImageModal = useCallback((row: DocumentRow) => {
    setActiveImageModal({ row });
  }, []);

  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const singleRowFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const [editingRowForUpload, setEditingRowForUpload] = useState<DocumentRow | null>(null);

  const handleUploadImageClick = useCallback((row: DocumentRow) => {
    setEditingRowForUpload(row);
    singleRowFileInputRef.current?.click();
  }, []);

  const [openDropdown, setOpenDropdown] = useState<'brand' | 'model' | 'year' | null>(null);
  const [brandSearchInput, setBrandSearchInput] = useState('');
  const [modelSearchInput, setModelSearchInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lista unikalnych marek (Kolumna 2: Marka)
  const allBrands = useMemo(() => {
    const set = new Set<string>();
    document.rows.forEach((r) => {
      const b = (r.brand || '').trim();
      // Odrzucamy puste, myślniki i przypadkowe liczby (LP)
      if (b && b !== '-' && !/^\d+[\.\)]?$/.test(b)) {
        set.add(b);
      }
    });
    return Array.from(set).sort();
  }, [document]);

  // Lista unikalnych modeli (Kolumna 3: Model, opcjonalnie powiązana z wybraną marką)
  const availableModels = useMemo(() => {
    const set = new Set<string>();
    document.rows.forEach((r) => {
      const b = (r.brand || '').trim();
      const m = (r.model || '').trim();
      if (selectedBrand === 'all' || b.toLowerCase() === selectedBrand.toLowerCase()) {
        if (m && m !== '-' && !/^\d+[\.\)]?$/.test(m)) {
          set.add(m);
          // Also if model contains slashes, add clean individual variants
          if (m.includes('/')) {
            const bracketMatch = m.match(/\(([^)]+)\)/);
            const gen = bracketMatch ? ` (${bracketMatch[1]})` : '';
            const rawClean = m.replace(/\([^)]+\)/g, '').trim();
            const subModels = rawClean.split('/').map(s => s.trim()).filter(Boolean);
            subModels.forEach(sub => {
              if (sub.length >= 2) {
                set.add(gen ? `${sub}${gen}` : sub);
                set.add(sub);
              }
            });
          }
        }
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'base', numeric: true }));
  }, [document, selectedBrand]);

  // Lista roczników i przedziałów lat (Kolumna 5: Lata) - dopasowana do wybranej marki i modelu
  const availableYears = useMemo(() => {
    const rawRangesSet = new Set<string>();
    const singleYearsSet = new Set<number>();

    document.rows.forEach((r) => {
      const b = (r.brand || '').trim().toLowerCase();
      const m = (r.model || '').trim().toLowerCase();
      const matchBrand = selectedBrand === 'all' || b === selectedBrand.toLowerCase().trim();
      const targetModel = selectedModel.toLowerCase().trim();
      const cleanTarget = targetModel.replace(/\([^)]+\)/g, '').trim();
      const matchModel = selectedModel === 'all' || 
        m === targetModel ||
        m.includes(targetModel) ||
        (cleanTarget.length >= 2 && m.includes(cleanTarget)) ||
        targetModel.includes(m);

      if (matchBrand && matchModel) {
        const y = (r.years || '').trim();
        if (y && y !== '-') {
          rawRangesSet.add(y);
          const parsed = parseYearRange(y);
          if (parsed) {
            const maxEnd = Math.min(parsed.end, 2030);
            for (let yr = parsed.start; yr <= maxEnd; yr++) {
              singleYearsSet.add(yr);
            }
          }
        }
      }
    });

    const sortedRanges = Array.from(rawRangesSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    const sortedSingleYears = Array.from(singleYearsSet).sort((a, b) => b - a);

    return {
      ranges: sortedRanges,
      singleYears: sortedSingleYears.map(String),
      totalCount: sortedRanges.length,
    };
  }, [document, selectedBrand, selectedModel]);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredBrandSearch = useDeferredValue(brandSearchInput);
  const deferredModelSearch = useDeferredValue(modelSearchInput);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // Filtrowanie wierszy: Marka (Kol. 2), Model (Kol. 3), Rocznik (Kol. 5) oraz fraza
  const filteredRows = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    const brandTarget = selectedBrand !== 'all' ? selectedBrand.toLowerCase().trim() : '';
    const modelTarget = selectedModel !== 'all' ? selectedModel.toLowerCase().trim() : '';
    const cleanModelTarget = modelTarget ? modelTarget.replace(/\([^)]+\)/g, '').trim() : '';

    return document.rows.filter((row) => {
      // 1. Marka (Kolumna 2)
      if (brandTarget) {
        const brandVal = (row.brand || '').toLowerCase().trim();
        if (brandVal !== brandTarget) {
          return false;
        }
      }

      // 2. Model (Kolumna 3)
      if (modelTarget) {
        const modelVal = (row.model || '').toLowerCase().trim();
        const matchExact = modelVal === modelTarget;
        const matchIncluded = modelVal.includes(modelTarget) || (cleanModelTarget.length >= 2 && modelVal.includes(cleanModelTarget));
        const targetIncluded = modelTarget.includes(modelVal);
        if (!matchExact && !matchIncluded && !targetIncluded) {
          return false;
        }
      }

      // 3. Rocznik (Kolumna 5: Lata)
      if (selectedYear !== 'all' && !matchesYearFilter(row.years, selectedYear)) {
        return false;
      }

      // 4. Szukaj frazy
      if (q) {
        const matches =
          (row.brand || '').toLowerCase().includes(q) ||
          (row.model || '').toLowerCase().includes(q) ||
          (row.factoryCode || '').toLowerCase().includes(q) ||
          (row.years || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [document, selectedBrand, selectedModel, selectedYear, deferredSearchQuery]);

  // Uporządkowana baza danych z wielopoziomowym sortowaniem
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case 'lp':
          result = parseLpForSort(a.lp) - parseLpForSort(b.lp);
          break;
        case 'brand':
          result = plCollator.compare(a.brand || '', b.brand || '');
          break;
        case 'model':
          result = plCollator.compare(a.model || '', b.model || '');
          break;
        case 'factoryCode':
          result = plCollator.compare(a.factoryCode || '', b.factoryCode || '');
          break;
        case 'years': {
          const yA = parseYearRange(a.years)?.start ?? 0;
          const yB = parseYearRange(b.years)?.start ?? 0;
          result = yA - yB;
          break;
        }
        case 'staticSignal':
          result = plCollator.compare(a.staticSignal || '', b.staticSignal || '');
          break;
        case 'priceClientStatic':
          result = parsePriceForSort(a.priceClientStatic) - parsePriceForSort(b.priceClientStatic);
          break;
        case 'priceBrokerStatic':
          result = parsePriceForSort(a.priceBrokerStatic) - parsePriceForSort(b.priceBrokerStatic);
          break;
        case 'dynamicSignal':
          result = plCollator.compare(a.dynamicSignal || '', b.dynamicSignal || '');
          break;
        case 'priceClientDynamic':
          result = parsePriceForSort(a.priceClientDynamic) - parsePriceForSort(b.priceClientDynamic);
          break;
        case 'priceBrokerDynamic':
          result = parsePriceForSort(a.priceBrokerDynamic) - parsePriceForSort(b.priceBrokerDynamic);
          break;
        case 'installation':
          result = plCollator.compare(a.installation || '', b.installation || '');
          break;
        case 'coding':
          result = plCollator.compare(a.coding || '', b.coding || '');
          break;
        case 'lampCount':
          result = plCollator.compare(a.lampCount || '', b.lampCount || '');
          break;
        default:
          result = 0;
      }

      if (result === 0) {
        // Drugorzędne sortowanie po marce, następnie po modelu
        const brandCompare = plCollator.compare(a.brand || '', b.brand || '');
        if (brandCompare !== 0) return brandCompare;
        return plCollator.compare(a.model || '', b.model || '');
      }

      return sortDirection === 'asc' ? result : -result;
    });
    return list;
  }, [filteredRows, sortKey, sortDirection]);

  // Reset do 1 strony przy zmianie filtrów lub sortowania
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedModel, selectedYear, deferredSearchQuery, sortKey, sortDirection]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(sortedRows.length / (pageSize as number)));
  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return sortedRows;
    const start = (currentPage - 1) * (pageSize as number);
    return sortedRows.slice(start, start + (pageSize as number));
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (key: SortColumnKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleSingleImageSelected = async (file: File) => {
    if (!editingRowForUpload || !onUpdateRowImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateRowImage(editingRowForUpload.id, result);
      if (selectedDetailsRow && selectedDetailsRow.id === editingRowForUpload.id) {
        setSelectedDetailsRow({
          ...selectedDetailsRow,
          imageUrl: result,
        });
      }
      if (activeImageModal && activeImageModal.row.id === editingRowForUpload.id) {
        setActiveImageModal({
          row: { ...activeImageModal.row, imageUrl: result },
        });
      }
      setEditingRowForUpload(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomUrl = () => {
    if (activeImageModal && onUpdateRowImage && customImageUrlInput.trim()) {
      const trimmedUrl = customImageUrlInput.trim();
      onUpdateRowImage(activeImageModal.row.id, trimmedUrl);
      if (selectedDetailsRow && selectedDetailsRow.id === activeImageModal.row.id) {
        setSelectedDetailsRow({
          ...selectedDetailsRow,
          imageUrl: trimmedUrl,
        });
      }
      setActiveImageModal({
        row: { ...activeImageModal.row, imageUrl: trimmedUrl },
      });
      setCustomImageUrlInput('');
    }
  };

  const [lightingUrlInput, setLightingUrlInput] = useState('');
  const [lightingSavedToast, setLightingSavedToast] = useState(false);

  const handleSaveLightingUrlForDetails = (row: DocumentRow) => {
    if (!lightingUrlInput.trim() || !onUpdateRowImage) return;
    const trimmed = lightingUrlInput.trim();
    onUpdateRowImage(row.id, trimmed);
    setSelectedDetailsRow({
      ...row,
      imageUrl: trimmed,
    });
    setLightingUrlInput('');
    setLightingSavedToast(true);
    setTimeout(() => setLightingSavedToast(false), 3000);
  };

  const handleDeleteLightingImageForDetails = (row: DocumentRow) => {
    if (!onUpdateRowImage) return;
    onUpdateRowImage(row.id, '');
    setSelectedDetailsRow({
      ...row,
      imageUrl: '',
    });
    setLightingSavedToast(true);
    setTimeout(() => setLightingSavedToast(false), 3000);
  };

  const hasActiveFilters =
    selectedBrand !== 'all' ||
    selectedModel !== 'all' ||
    selectedYear !== 'all' ||
    searchQuery.trim() !== '';

  const handleBrandChange = (newBrand: string) => {
    setSelectedBrand(newBrand);
    setSelectedModel('all');
    setSelectedYear('all');
    setSelectedDetailsRow(null);
    setHasSearched(false);
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    setSelectedYear('all');
    setSelectedDetailsRow(null);
    setHasSearched(false);
    if (newModel !== 'all') {
      // Otwórz listę roczników do wyboru dla wybranego modelu
      setOpenDropdown('year');
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    if (newYear !== 'all') {
      setHasSearched(true);
      const matched = document.rows.find((row) => {
        const matchBrand =
          selectedBrand === 'all' ||
          (row.brand || '').toLowerCase().trim() === selectedBrand.toLowerCase().trim();
        const matchModel =
          selectedModel === 'all' ||
          (row.model || '').toLowerCase().trim() === selectedModel.toLowerCase().trim();
        return matchBrand && matchModel && matchesYearFilter(row.years, newYear);
      });
      if (matched) {
        setSelectedDetailsRow(matched);
      }
    } else {
      setSelectedDetailsRow(null);
      setHasSearched(false);
    }
  };

  const handleExecuteSearch = () => {
    setHasSearched(true);
    if (selectedYear !== 'all') {
      const matched = document.rows.find((row) => {
        const matchBrand =
          selectedBrand === 'all' ||
          (row.brand || '').toLowerCase().trim() === selectedBrand.toLowerCase().trim();
        const matchModel =
          selectedModel === 'all' ||
          (row.model || '').toLowerCase().trim() === selectedModel.toLowerCase().trim();
        return matchBrand && matchModel && matchesYearFilter(row.years, selectedYear);
      });
      if (matched) {
        setSelectedDetailsRow(matched);
        return;
      }
    }

    if (selectedModel !== 'all' && selectedYear === 'all') {
      if (availableYears.ranges.length === 1 && availableYears.singleYears.length === 0) {
        const onlyYear = availableYears.ranges[0];
        handleYearChange(onlyYear);
        return;
      }
      // Jeśli model posiada kilka roczników, otwórz listę wyboru rocznika
      setOpenDropdown('year');
      return;
    }

    if (sortedRows.length === 1) {
      const singleRow = sortedRows[0];
      if (singleRow.years) {
        setSelectedYear(singleRow.years);
      }
      setSelectedDetailsRow(singleRow);
    }
  };

  const handleResetFilters = () => {
    setSelectedBrand('all');
    setSelectedModel('all');
    setSelectedYear('all');
    setSearchQuery('');
    setSelectedDetailsRow(null);
    setHasSearched(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden inputs for image uploading (only in edit mode) */}
      {!readOnly && (
        <>
          <input
            ref={singleRowFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSingleImageSelected(e.target.files[0]);
              }
            }}
          />

          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept="image/*,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && onBatchAttachImages) {
                onBatchAttachImages(Array.from(e.target.files));
              }
            }}
          />

          {/* Panel Modyfikacji Cen Procentowej w 3 Zakresach */}
          <PriceModifierPanel
            rows={document.rows}
            onApplyPrices={(updatedRows) => {
              if (onUpdateRows) {
                onUpdateRows(updatedRows);
              }
            }}
          />
        </>
      )}

      {/* Structured Search Form: Marka, Model, Rocznik oraz szukaj */}
      <div ref={dropdownRef} className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-800 flex flex-col gap-4 relative z-30">
        {/* Primary Search Row: Marka, Model, Rocznik, Szukaj frazy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Marka */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>Marka</span>
              </span>
              {selectedBrand !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleBrandChange('all')}
                  className="text-[11px] text-amber-400 hover:underline font-normal cursor-pointer"
                >
                  Wszystkie
                </button>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(openDropdown === 'brand' ? null : 'brand');
                  setBrandSearchInput('');
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  openDropdown === 'brand'
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10'
                    : selectedBrand !== 'all'
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm hover:bg-amber-400/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-800'
                }`}
              >
                <span className="truncate">
                  {selectedBrand !== 'all' ? selectedBrand : `Wybierz markę (${allBrands.length})`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 shrink-0 ml-2 ${
                    openDropdown === 'brand' ? 'rotate-180 text-amber-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Rozwinięta lista Marka */}
              {openDropdown === 'brand' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-xl border-2 border-amber-400/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
                  {allBrands.length > 6 && (
                    <div className="p-2 border-b border-slate-800 bg-slate-950/80">
                      <div className="relative">
                        <input
                          type="text"
                          value={brandSearchInput}
                          onChange={(e) => setBrandSearchInput(e.target.value)}
                          placeholder="Filtruj markę..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          autoFocus
                        />
                        {brandSearchInput && (
                          <button
                            type="button"
                            onClick={() => setBrandSearchInput('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        handleBrandChange('all');
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedBrand === 'all'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                          : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                      }`}
                    >
                      <span>Wszystkie marki ({allBrands.length})</span>
                      {selectedBrand === 'all' && <Check className="w-4 h-4 text-slate-950" />}
                    </button>

                    {allBrands
                      .filter((b) =>
                        b.toLowerCase().includes(brandSearchInput.trim().toLowerCase())
                      )
                      .map((b) => {
                        const isSelected = selectedBrand.toLowerCase() === b.toLowerCase();
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              handleBrandChange(b);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                            }`}
                          >
                            <span className="truncate">{b}</span>
                            {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Model */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Model</span>
              </span>
              {selectedModel !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleModelChange('all')}
                  className="text-[11px] text-amber-400 hover:underline font-normal cursor-pointer"
                >
                  Wszystkie
                </button>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                disabled={availableModels.length === 0}
                onClick={() => {
                  if (availableModels.length > 0) {
                    setOpenDropdown(openDropdown === 'model' ? null : 'model');
                    setModelSearchInput('');
                  }
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  openDropdown === 'model'
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10'
                    : selectedModel !== 'all'
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm hover:bg-amber-400/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-800'
                }`}
              >
                <span className="truncate">
                  {selectedModel !== 'all'
                    ? selectedModel
                    : selectedBrand !== 'all'
                    ? `Wybierz model ${selectedBrand} (${availableModels.length})`
                    : `Wybierz model (${availableModels.length})`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 shrink-0 ml-2 ${
                    openDropdown === 'model' ? 'rotate-180 text-amber-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Rozwinięta lista Model */}
              {openDropdown === 'model' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-xl border-2 border-amber-400/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
                  {availableModels.length > 6 && (
                    <div className="p-2 border-b border-slate-800 bg-slate-950/80">
                      <div className="relative">
                        <input
                          type="text"
                          value={modelSearchInput}
                          onChange={(e) => setModelSearchInput(e.target.value)}
                          placeholder="Filtruj model..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          autoFocus
                        />
                        {modelSearchInput && (
                          <button
                            type="button"
                            onClick={() => setModelSearchInput('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        handleModelChange('all');
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedModel === 'all'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                          : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                      }`}
                    >
                      <span>
                        {selectedBrand !== 'all'
                          ? `Wszystkie modele ${selectedBrand}`
                          : 'Wszystkie modele'}
                      </span>
                      {selectedModel === 'all' && <Check className="w-4 h-4 text-slate-950" />}
                    </button>

                    {availableModels
                      .filter((m) =>
                        m.toLowerCase().includes(modelSearchInput.trim().toLowerCase())
                      )
                      .map((m) => {
                        const isSelected = selectedModel.toLowerCase() === m.toLowerCase();
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              handleModelChange(m);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                            }`}
                          >
                            <span className="truncate">{m}</span>
                            {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Rocznik */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Rocznik</span>
              </span>
              {selectedYear !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleYearChange('all')}
                  className="text-[11px] text-amber-400 hover:underline font-normal cursor-pointer"
                >
                  Wszystkie
                </button>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  openDropdown === 'year'
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10'
                    : selectedYear !== 'all'
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm hover:bg-amber-400/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-800'
                }`}
              >
                <span className="truncate">
                  {selectedYear !== 'all'
                    ? selectedYear
                    : `Wybierz rocznik (${availableYears.totalCount})`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 shrink-0 ml-2 ${
                    openDropdown === 'year' ? 'rotate-180 text-amber-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Rozwinięta lista Rocznik */}
              {openDropdown === 'year' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-xl border-2 border-amber-400/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
                  <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        handleYearChange('all');
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedYear === 'all'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                          : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                      }`}
                    >
                      <span>Wszystkie roczniki ({availableYears.totalCount})</span>
                      {selectedYear === 'all' && <Check className="w-4 h-4 text-slate-950" />}
                    </button>

                    {availableYears.ranges.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 bg-slate-950/40 rounded-md my-1">
                          Przedziały lat (z cennika)
                        </div>
                        {availableYears.ranges.map((r) => {
                          const isSelected = selectedYear === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                handleYearChange(r);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                  : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                              }`}
                            >
                              <span className="truncate">{r}</span>
                              {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {availableYears.singleYears.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 bg-slate-950/40 rounded-md my-1">
                          Pojedynczy rok
                        </div>
                        {availableYears.singleYears.map((yr) => {
                          const yrStr = String(yr);
                          const isSelected = selectedYear === yrStr;
                          return (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => {
                                handleYearChange(yrStr);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                  : 'text-slate-200 hover:bg-amber-400 hover:text-slate-950 hover:font-bold hover:shadow-sm'
                              }`}
                            >
                              <span className="truncate">Rok {yr}</span>
                              {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Szukaj frazy */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Szukaj frazy</span>
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-amber-400 hover:underline font-normal cursor-pointer"
                >
                  Wyczyść
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteSearch();
                  }
                }}
                placeholder="Wpisz np. G20, Mustang, LED..."
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Active Filters Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
            {hasActiveFilters && (
              <>
                <span className="text-slate-400 font-semibold">Aktywne filtry:</span>
                {selectedBrand !== 'all' && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                    Marka: {selectedBrand}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrand('all');
                        setSelectedModel('all');
                      }}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedModel !== 'all' && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                    Model: {selectedModel}
                    <button
                      type="button"
                      onClick={() => setSelectedModel('all')}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedYear !== 'all' && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                    Rocznik: {selectedYear}
                    <button
                      type="button"
                      onClick={() => setSelectedYear('all')}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md font-mono text-[11px] flex items-center gap-1">
                    Fraza: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all flex items-center gap-1 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                  <span>Wyczyść</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={() => batchFileInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-slate-700"
                title="Wgraj folder lub pliki ze zdjęciami"
              >
                <ImagePlus className="w-4 h-4 text-amber-400" />
                <span>Dołącz Zdjęcia</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar / Results bar with quick summary, sorting stats and layout switcher - only in Settings / Admin */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-xl">
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">
                Baza modeli: <strong className="text-amber-300 font-extrabold">{sortedRows.length}</strong> {sortedRows.length === 1 ? 'pozycja' : 'pozycji'}
              </span>
            </div>

            {selectedBrand !== 'all' && (
              <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500">Marka:</span>
                <strong className="text-amber-400 font-bold">{selectedBrand}</strong>
              </span>
            )}
            {selectedModel !== 'all' && (
              <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500">Model:</span>
                <strong className="text-amber-400 font-bold">{selectedModel}</strong>
              </span>
            )}
            {selectedYear !== 'all' && (
              <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500">Rocznik:</span>
                <strong className="text-amber-400 font-bold">{selectedYear}</strong>
              </span>
            )}

            {showBrokerPrices && (
              <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Strefa Hurtowa (Klient + Broker)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Widok: Tabela vs Kafelki */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'table'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Widok tabeli"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Widok kart"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Karty</span>
              </button>
            </div>

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Eksportuj do Excel"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {readOnly ? (
        /* W widokach Klienta i Hurtu - baza i proponowane kafelki są całkowicie schowane.
           Szczegóły pojawiają się w dedykowanym oknie dialogowym po wyborze / kliknięciu Wyszukaj */
        hasSearched && sortedRows.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-3">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Nie znaleziono pojazdu
            </h3>
            <p className="text-slate-400 text-xs mb-4 max-w-md">
              Nie znaleziono pozycji spełniających podane kryteria. Sprawdź pisownię lub wybierz inną markę/model z list rozwijanych powyżej.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              Wyczyść i szukaj ponownie
            </button>
          </div>
        ) : selectedModel !== 'all' || selectedBrand !== 'all' || searchQuery.trim() !== '' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center shadow-inner">
              <Car className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-md">
                {selectedBrand !== 'all' ? selectedBrand : 'Wszystkie marki'}
                {selectedModel !== 'all' && ` • ${selectedModel}`}
                {selectedYear !== 'all' && ` (${selectedYear})`}
              </span>
              <h3 className="text-lg font-bold text-white mt-3">
                {selectedModel !== 'all'
                  ? `${selectedBrand} ${selectedModel}`
                  : selectedBrand !== 'all'
                  ? `Marka: ${selectedBrand}`
                  : `Wyszukiwanie: "${searchQuery}"`}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                {selectedModel !== 'all' && selectedYear === 'all'
                  ? 'Wybierz rocznik pojazdu z listy powyżej, aby otworzyć okienko z dedykowaną wyceną.'
                  : sortedRows.length > 0
                  ? `Dopasowano ${sortedRows.length} ${sortedRows.length === 1 ? 'pozycję' : 'pozycji'}. Wybierz rocznik z listy powyżej, aby otworzyć okno ze szczegółami.`
                  : 'Wybierz markę, model i rocznik z listy powyżej.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Cennik konwersji lamp i multimediów
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
              Wybierz markę, model oraz rocznik pojazdu w panelu powyżej, aby natychmiast wyświetlić okienko ze szczegółową wyceną, wariantami i zdjęciami.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-left">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-extrabold flex items-center justify-center mb-2 border border-amber-400/20">1</span>
                <h4 className="text-xs font-bold text-white">Wybierz Markę</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Wybierz markę z listy rozwijanej</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-extrabold flex items-center justify-center mb-2 border border-amber-400/20">2</span>
                <h4 className="text-xs font-bold text-white">Wybierz Model i Rocznik</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Wybierz model, a następnie rocznik</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-extrabold flex items-center justify-center mb-2 border border-amber-400/20">3</span>
                <h4 className="text-xs font-bold text-white">Sprawdź Szczegóły</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Okienko z danymi otworzy się automatycznie</p>
              </div>
            </div>
          </div>
        )
      ) : sortedRows.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Brak wyników w bazie
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            Nie znaleziono pozycji spełniających wybrane filtry wyszukiwania.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedRows.map((row) => (
              <PositionGridCard
                key={row.id}
                row={row}
                showBrokerPrices={showBrokerPrices || !readOnly}
                readOnly={readOnly}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>

          {/* Paginacja dla widoku Grid */}
          {sortedRows.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <span>Wyświetlono:</span>
                <span className="text-white font-bold">
                  {pageSize === 'all' ? sortedRows.length : Math.min(sortedRows.length, (currentPage - 1) * pageSize + 1)} - {pageSize === 'all' ? sortedRows.length : Math.min(sortedRows.length, currentPage * pageSize)}
                </span>
                <span>z</span>
                <span className="text-amber-400 font-bold">{sortedRows.length}</span>
                <span>pozycji</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Na stronę:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setPageSize(val);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">Wszystkie</option>
                  </select>
                </div>

                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Pierwsza strona"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Poprzednia strona"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-2 py-1 text-slate-300 font-mono text-xs font-semibold">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Następna strona"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Ostatnia strona"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Główna tabela bazy danych – ZAWSZE wyświetlana po uruchomieniu */
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden w-full space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider select-none">
                  {/* LP */}
                  <th
                    onClick={() => handleSort('lp')}
                    className="py-3 px-2 text-center w-12 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po pozycji LP"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>LP.</span>
                      {sortKey === 'lp' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Marka */}
                  <th
                    onClick={() => handleSort('brand')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj alfabetycznie po Marce"
                  >
                    <div className="inline-flex items-center gap-1 font-bold">
                      <span>Marka</span>
                      {sortKey === 'brand' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Model */}
                  <th
                    onClick={() => handleSort('model')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj alfabetycznie po Modelu"
                  >
                    <div className="inline-flex items-center gap-1 font-bold">
                      <span>Model</span>
                      {sortKey === 'model' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Kod fabryczny */}
                  <th
                    onClick={() => handleSort('factoryCode')}
                    className="py-3 px-2.5 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po kodzie fabrycznym"
                  >
                    <div className="inline-flex items-center gap-1 font-bold">
                      <span>Kod</span>
                      {sortKey === 'factoryCode' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Roczniki / Lata */}
                  <th
                    onClick={() => handleSort('years')}
                    className="py-3 px-2.5 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po rocznikach produkcji"
                  >
                    <div className="inline-flex items-center gap-1 font-bold">
                      <span>Lata</span>
                      {sortKey === 'years' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Kier. Statyczny */}
                  <th
                    onClick={() => handleSort('staticSignal')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po kierunkowskazie statycznym"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>Kier. Stat.</span>
                      {sortKey === 'staticSignal' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Cena Klient (Stat) */}
                  <th
                    onClick={() => handleSort('priceClientStatic')}
                    className="py-3 px-2.5 text-right whitespace-nowrap cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po cenie klienta (statyczny)"
                  >
                    <div className="inline-flex items-center justify-end gap-1 font-bold">
                      <span>Cena Klient (Stat)</span>
                      {sortKey === 'priceClientStatic' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Cena Broker (Stat) - w trybie Hurt lub Ustawienia */}
                  {(showBrokerPrices || !readOnly) && (
                    <th
                      onClick={() => handleSort('priceBrokerStatic')}
                      className="py-3 px-2.5 text-right whitespace-nowrap cursor-pointer hover:bg-slate-850 hover:text-blue-300 transition-colors text-blue-300"
                      title="Sortuj po cenie brokera (statyczny)"
                    >
                      <div className="inline-flex items-center justify-end gap-1 font-bold">
                        <span>Cena Broker (Stat)</span>
                        {sortKey === 'priceBrokerStatic' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Kier. Dynamiczny */}
                  <th
                    onClick={() => handleSort('dynamicSignal')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po kierunkowskazie dynamicznym"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>Kier. Dyn.</span>
                      {sortKey === 'dynamicSignal' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Cena Klient (Dyn) */}
                  <th
                    onClick={() => handleSort('priceClientDynamic')}
                    className="py-3 px-2.5 text-right whitespace-nowrap cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po cenie klienta (dynamiczny)"
                  >
                    <div className="inline-flex items-center justify-end gap-1 font-bold">
                      <span>Cena Klient (Dyn)</span>
                      {sortKey === 'priceClientDynamic' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Cena Broker (Dyn) */}
                  {(showBrokerPrices || !readOnly) && (
                    <th
                      onClick={() => handleSort('priceBrokerDynamic')}
                      className="py-3 px-2.5 text-right whitespace-nowrap cursor-pointer hover:bg-slate-850 hover:text-blue-300 transition-colors text-blue-300"
                      title="Sortuj po cenie brokera (dynamiczny)"
                    >
                      <div className="inline-flex items-center justify-end gap-1 font-bold">
                        <span>Cena Broker (Dyn)</span>
                        {sortKey === 'priceBrokerDynamic' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Instalacja */}
                  <th
                    onClick={() => handleSort('installation')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po instalacji"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>Montaż</span>
                      {sortKey === 'installation' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Kodowanie */}
                  <th
                    onClick={() => handleSort('coding')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po kodowaniu"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>Kodowanie</span>
                      {sortKey === 'coding' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Lampy */}
                  <th
                    onClick={() => handleSort('lampCount')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition-colors"
                    title="Sortuj po ilości lamp"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span>Lampy</span>
                      {sortKey === 'lampCount' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Zdjęcie */}
                  <th className="py-3 px-2 text-center w-24">Zdjęcie</th>

                  {/* Multimedia */}
                  <th className="py-3 px-2 text-center w-28">Multimedia</th>

                  {/* Karta / Akcje */}
                  <th className="py-3 px-2 text-center w-24">Karta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedRows.map((row, idx) => (
                  <DataGridTableRow
                    key={row.id}
                    row={row}
                    index={pageSize === 'all' ? idx : (currentPage - 1) * pageSize + idx}
                    readOnly={readOnly}
                    showBrokerPrices={showBrokerPrices}
                    onOpenDetails={handleOpenDetails}
                    onOpenImageModal={handleOpenImageModal}
                    onUploadImageClick={!readOnly && onUpdateRowImage ? handleUploadImageClick : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginacja dla widoku tabeli */}
          {sortedRows.length > 0 && (
            <div className="bg-slate-950/80 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <span>Wyświetlono:</span>
                <span className="text-white font-bold">
                  {pageSize === 'all' ? sortedRows.length : Math.min(sortedRows.length, (currentPage - 1) * pageSize + 1)} - {pageSize === 'all' ? sortedRows.length : Math.min(sortedRows.length, currentPage * pageSize)}
                </span>
                <span>z</span>
                <span className="text-amber-400 font-bold">{sortedRows.length}</span>
                <span>pozycji</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Na stronę:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setPageSize(val);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">Wszystkie</option>
                  </select>
                </div>

                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Pierwsza strona"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Poprzednia strona"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-2 py-1 text-slate-300 font-mono text-xs font-semibold">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Następna strona"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Ostatnia strona"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Details Modal Window for Client View Search */}
      {selectedDetailsRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    {selectedDetailsRow.brand}
                  </span>
                  {selectedDetailsRow.factoryCode && (
                    <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      Kod: {selectedDetailsRow.factoryCode}
                    </span>
                  )}
                  {selectedDetailsRow.lp && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Poz. #{selectedDetailsRow.lp}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-xl text-white">
                  {selectedDetailsRow.model}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Roczniki produkcji: <strong className="text-slate-200">{selectedDetailsRow.years}</strong></span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailsRow(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Oświetlenie vs Multimedia */}
            <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 sm:px-6 pt-2.5 gap-2">
              <button
                type="button"
                onClick={() => setDetailsModalTab('lighting')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  detailsModalTab === 'lighting'
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
                }`}
              >
                <Lightbulb className={`w-4 h-4 ${detailsModalTab === 'lighting' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Oświetlenie</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailsModalTab('multimedia')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  detailsModalTab === 'multimedia'
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
                }`}
              >
                <Tv className={`w-4 h-4 ${detailsModalTab === 'multimedia' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Multimedia</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {detailsModalTab === 'lighting' ? (
                <>
                  {/* Photo Area */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[190px] relative overflow-hidden">
                    {selectedDetailsRow.imageUrl ? (
                      <div className="relative flex flex-col items-center">
                        <img
                          src={selectedDetailsRow.imageUrl}
                          alt={`${selectedDetailsRow.brand} ${selectedDetailsRow.model}`}
                          className="max-h-[230px] max-w-full object-contain rounded-xl shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Zdjęcie referencyjne lampy</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs flex flex-col items-center gap-2 py-6">
                        <ImageIcon className="w-12 h-12 text-slate-700 stroke-1" />
                        <span>Brak przypisanego zdjęcia lampy dla tego modelu</span>
                      </div>
                    )}
                  </div>

                  {/* Lighting Photo Editor (Available strictly in Settings / editable mode) */}
                  {!readOnly && onUpdateRowImage && (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edycja zdjęcia lampy dla tej pozycji</span>
                        </label>
                        {selectedDetailsRow.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLightingImageForDetails(selectedDetailsRow)}
                            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                            title="Usuń przypisane zdjęcie"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Usuń zdjęcie</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRowForUpload(selectedDetailsRow);
                            singleRowFileInputRef.current?.click();
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{selectedDetailsRow.imageUrl ? 'Zmień zdjęcie z dysku' : 'Wgraj zdjęcie z dysku'}</span>
                        </button>

                        <div className="flex-1 w-full flex items-center gap-2">
                          <input
                            type="text"
                            value={lightingUrlInput}
                            onChange={(e) => setLightingUrlInput(e.target.value)}
                            placeholder="Lub wklej bezpośredni link URL do zdjęcia..."
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveLightingUrlForDetails(selectedDetailsRow)}
                            disabled={!lightingUrlInput.trim()}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer shrink-0"
                          >
                            Zapisz URL
                          </button>
                        </div>
                      </div>

                      {lightingSavedToast && (
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1 animate-pulse">
                          <Check className="w-3.5 h-3.5" />
                          <span>Zaktualizowano zdjęcie lampy!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specification Grid (All Hidden Table Data) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pełna specyfikacja i wycena z tabeli</span>
                      </h4>
                      {showBrokerPrices && (
                        <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                          Ceny Klient + Broker
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {/* Marka */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Marka</span>
                        <span className="text-sm font-bold text-amber-400">{selectedDetailsRow.brand || '-'}</span>
                      </div>

                      {/* Model */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Model</span>
                        <span className="text-sm font-bold text-white">{selectedDetailsRow.model || '-'}</span>
                      </div>

                      {/* Kod Fabryczny */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Kod fabryczny</span>
                        <span className="text-sm font-bold font-mono text-slate-200">{selectedDetailsRow.factoryCode || '-'}</span>
                      </div>

                      {/* Rocznik / Lata */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Lata produkcji</span>
                        <span className="text-sm font-bold text-slate-200">{selectedDetailsRow.years || '-'}</span>
                      </div>

                      {/* Ilość Lamp */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Ilość lamp</span>
                        <span className="text-sm font-bold text-slate-200">{selectedDetailsRow.lampCount || '-'}</span>
                      </div>

                      {/* Instalacja */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Instalacja</span>
                        <span className="text-sm font-bold text-slate-200">{selectedDetailsRow.installation || '-'}</span>
                      </div>

                      {/* Kodowanie */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Kodowanie</span>
                        <span className="text-sm font-bold text-slate-200">{selectedDetailsRow.coding || '-'}</span>
                      </div>

                      {/* Kierunkowskaz Statyczny */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Kierunkowskaz Statyczny</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          selectedDetailsRow.staticSignal && selectedDetailsRow.staticSignal !== '-'
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'text-slate-500'
                        }`}>
                          {selectedDetailsRow.staticSignal || '-'}
                        </span>
                      </div>

                      {/* Cena Klient (Statyczny) */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Cena Klient (Stat)</span>
                        <span className="text-sm font-extrabold text-amber-300 font-mono">
                          {selectedDetailsRow.priceClientStatic || '-'}
                        </span>
                      </div>

                      {showBrokerPrices && (
                        <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3">
                          <span className="text-[11px] text-blue-300 block mb-0.5 font-medium">Cena Broker (Stat)</span>
                          <span className="text-sm font-extrabold text-blue-400 font-mono">
                            {selectedDetailsRow.priceBrokerStatic || '-'}
                          </span>
                        </div>
                      )}

                      {/* Kierunkowskaz Dynamiczny */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Kierunkowskaz Dynamiczny</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          selectedDetailsRow.dynamicSignal && selectedDetailsRow.dynamicSignal !== '-'
                            ? 'bg-blue-400/20 text-blue-300'
                            : 'text-slate-500'
                        }`}>
                          {selectedDetailsRow.dynamicSignal || '-'}
                        </span>
                      </div>

                      {/* Cena Klient (Dynamiczny) */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Cena Klient (Dyn)</span>
                        <span className="text-sm font-extrabold text-amber-300 font-mono">
                          {selectedDetailsRow.priceClientDynamic || '-'}
                        </span>
                      </div>

                      {showBrokerPrices && (
                        <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3">
                          <span className="text-[11px] text-blue-300 block mb-0.5 font-medium">Cena Broker (Dyn)</span>
                          <span className="text-sm font-extrabold text-blue-400 font-mono">
                            {selectedDetailsRow.priceBrokerDynamic || '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : !readOnly ? (
                /* Editable Multimedia Form in Settings Mode */
                <div className="space-y-4 py-1">
                  <div className="flex items-center justify-between bg-amber-400/10 border border-amber-400/20 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <Edit2 className="w-4 h-4 text-amber-400" />
                      <span>Edycja modułu Multimedia dla tej pozycji</span>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-800">
                      Tryb konfiguracji
                    </span>
                  </div>

                  {/* Photo Section */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Zdjęcie multimediów (ekran / stacja / moduł)</span>
                      </label>
                      {editMultimediaImageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditMultimediaImageUrl('')}
                          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Usuń zdjęcie</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-28 h-20 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {editMultimediaImageUrl ? (
                          <DelayedHoverZoomImage
                            src={editMultimediaImageUrl}
                            alt="Multimedia preview"
                            title={`${selectedDetailsRow.brand} ${selectedDetailsRow.model}`}
                            subtitle={selectedDetailsRow.years}
                            version={editMultimediaVersion}
                            containerClassName="w-full h-full flex items-center justify-center"
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <div className="text-center text-slate-600 flex flex-col items-center">
                            <Tv className="w-6 h-6 mb-1" />
                            <span className="text-[9px]">Brak zdjęcia</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={multimediaFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleMultimediaFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => multimediaFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Wybierz plik z dysku</span>
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Lub wklej bezpośredni adres URL zdjęcia:</span>
                          <input
                            type="text"
                            value={editMultimediaImageUrl}
                            onChange={(e) => setEditMultimediaImageUrl(e.target.value)}
                            placeholder="https://domena.pl/zdjecie-multimediow.jpg"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Version and Prices Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Wersja */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wersja / Typ urządzenia / Nawigacja</span>
                      </label>
                      <input
                        type="text"
                        value={editMultimediaVersion}
                        onChange={(e) => setEditMultimediaVersion(e.target.value)}
                        placeholder="np. MIB 3 / Apple CarPlay & Android Auto / Ekran 10.25 cala"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Pozostawienie pustego pola wyświetli &quot;Brak informacji&quot; w widokach Klienta i Brokera.
                      </span>
                    </div>

                    {/* Cena Klient */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                      <label className="text-xs font-bold text-amber-400 block mb-1.5">
                        Cena dla Klienta
                      </label>
                      <input
                        type="text"
                        value={editMultimediaPriceClient}
                        onChange={(e) => setEditMultimediaPriceClient(e.target.value)}
                        placeholder="np. 1500 PLN lub 1500 zł"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-bold"
                      />
                    </div>

                    {/* Cena Broker */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                      <label className="text-xs font-bold text-blue-400 block mb-1.5">
                        Cena dla Brokera / Hurtowa
                      </label>
                      <input
                        type="text"
                        value={editMultimediaPriceBroker}
                        onChange={(e) => setEditMultimediaPriceBroker(e.target.value)}
                        placeholder="np. 1100 PLN lub 1100 zł"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono font-bold"
                      />
                    </div>

                    {/* Dodatkowe uwagi / opis */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Uwagi / Zakres prac (opcjonalnie)
                      </label>
                      <textarea
                        rows={2}
                        value={editMultimediaNotes}
                        onChange={(e) => setEditMultimediaNotes(e.target.value)}
                        placeholder="np. W cenie aktywacja modułu, profesjonalny montaż i kodowanie..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Save button & feedback */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMultimediaVersion('');
                        setEditMultimediaPriceClient('');
                        setEditMultimediaPriceBroker('');
                        setEditMultimediaImageUrl('');
                        setEditMultimediaNotes('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-800"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Wyczyść formularz</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {multimediaSavedToast && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                          <Check className="w-4 h-4" />
                          <span>Zapisano pomyślnie!</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveMultimedia(selectedDetailsRow)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Zapisz dane multimediów</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Read-Only Multimedia Tab Content in Client/Broker Mode */
                (() => {
                  const hasAnyMultimedia = Boolean(
                    selectedDetailsRow.multimediaVersion ||
                    selectedDetailsRow.multimediaPriceClient ||
                    selectedDetailsRow.multimediaPriceBroker ||
                    selectedDetailsRow.multimediaImageUrl ||
                    selectedDetailsRow.multimediaNotes
                  );

                  if (!hasAnyMultimedia) {
                    return (
                      <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-slate-950/70 rounded-2xl border border-slate-800/80 my-2">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center mb-4 shadow-xl">
                          <Tv className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-extrabold text-white mb-2">
                          Brak informacji
                        </h4>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                          Dla wybranego modelu <strong className="text-white">{selectedDetailsRow.brand} {selectedDetailsRow.model} ({selectedDetailsRow.years})</strong> nie wprowadzono jeszcze szczegółowych danych w kategorii Multimedia.
                        </p>
                        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
                          <Info className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Kategoria: Multimedia i nawigacje</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 py-1">
                      {/* Photo Box */}
                      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-center min-h-[180px]">
                        {selectedDetailsRow.multimediaImageUrl ? (
                          <div className="relative flex flex-col items-center">
                            <DelayedHoverZoomImage
                              src={selectedDetailsRow.multimediaImageUrl}
                              alt={`Multimedia ${selectedDetailsRow.brand} ${selectedDetailsRow.model}`}
                              title={`${selectedDetailsRow.brand} ${selectedDetailsRow.model}`}
                              subtitle={selectedDetailsRow.years}
                              version={selectedDetailsRow.multimediaVersion}
                              containerClassName="max-h-[220px] max-w-full flex items-center justify-center"
                              className="max-h-[220px] max-w-full object-contain rounded-xl shadow-lg"
                            />
                            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Tv className="w-3.5 h-3.5 text-amber-400" />
                              <span>Zdjęcie zestawu multimedialnego (kliknij lupkę, aby powiększyć)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs flex flex-col items-center gap-2 py-6">
                            <Tv className="w-10 h-10 text-slate-700 stroke-1" />
                            <span>Zdjęcie: <strong className="text-slate-400">Brak informacji</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Spec Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Wersja */}
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:col-span-2">
                          <span className="text-[11px] text-slate-400 block mb-0.5">Wersja / Typ urządzenia</span>
                          <span className="text-sm font-bold text-amber-300">
                            {selectedDetailsRow.multimediaVersion || 'Brak informacji'}
                          </span>
                        </div>

                        {/* Cena Klient */}
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                          <span className="text-[11px] text-slate-400 block mb-0.5">Cena dla Klienta</span>
                          <span className="text-sm font-extrabold text-amber-300 font-mono">
                            {selectedDetailsRow.multimediaPriceClient || 'Brak informacji'}
                          </span>
                        </div>

                        {/* Cena Broker */}
                        {showBrokerPrices && (
                          <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3">
                            <span className="text-[11px] text-blue-300 block mb-0.5 font-medium">Cena dla Brokera</span>
                            <span className="text-sm font-extrabold text-blue-400 font-mono">
                              {selectedDetailsRow.multimediaPriceBroker || 'Brak informacji'}
                            </span>
                          </div>
                        )}

                        {/* Uwagi */}
                        {selectedDetailsRow.multimediaNotes && (
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:col-span-2">
                            <span className="text-[11px] text-slate-400 block mb-0.5">Uwagi / Zakres prac</span>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {selectedDetailsRow.multimediaNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailsRow(null)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Zamknij okno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High Res Lightbox & Image Customizer */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {activeImageModal.row.brand}
                </span>
                <h3 className="font-bold text-base text-white">
                  {activeImageModal.row.model} ({activeImageModal.row.years})
                </h3>
              </div>
              <button
                onClick={() => setActiveImageModal(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[260px]">
              {activeImageModal.row.imageUrl ? (
                <img
                  src={activeImageModal.row.imageUrl}
                  alt={activeImageModal.row.brand}
                  className="max-h-[280px] max-w-full object-contain rounded-lg shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 text-slate-600" />
                  <span>Brak przypisanego zdjęcia</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3 text-xs">
              {!readOnly && onUpdateRowImage ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRowForUpload(activeImageModal.row);
                          singleRowFileInputRef.current?.click();
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Wgraj z dysku</span>
                      </button>

                      {activeImageModal.row.imageUrl && onUpdateRowImage && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateRowImage(activeImageModal.row.id, '');
                            if (selectedDetailsRow && selectedDetailsRow.id === activeImageModal.row.id) {
                              setSelectedDetailsRow({
                                ...selectedDetailsRow,
                                imageUrl: '',
                              });
                            }
                            setActiveImageModal({
                              row: { ...activeImageModal.row, imageUrl: '' },
                            });
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Usuń</span>
                        </button>
                      )}
                    </div>

                    <div className="text-slate-400 text-[11px]">
                      Cena Klient: <strong className="text-sky-400 font-mono font-bold text-xs">{activeImageModal.row.priceClientStatic || activeImageModal.row.priceClientDynamic || '-'}</strong>
                    </div>
                  </div>

                  {/* Wklej link URL */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <input
                      type="text"
                      value={customImageUrlInput}
                      onChange={(e) => setCustomImageUrlInput(e.target.value)}
                      placeholder="Lub wklej link URL do zdjęcia..."
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomUrl}
                      disabled={!customImageUrlInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer shrink-0"
                    >
                      Zastosuj URL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300">
                      Kod: <strong className="text-white font-mono">{activeImageModal.row.factoryCode || '-'}</strong>
                    </span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300">
                      Lampy: <strong className="text-white">{activeImageModal.row.lampCount || '-'}</strong>
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Cena Klient: <strong className="text-sky-400 font-mono font-bold text-xs">{activeImageModal.row.priceClientStatic || activeImageModal.row.priceClientDynamic || '-'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
