import { DocumentRow } from '../types';

// Polish stop words to ignore when other meaningful keywords are present
const STOP_WORDS = new Set([
  'w',
  'z',
  'ze',
  'dla',
  'oraz',
  'i',
  'do',
  'od',
  'rok',
  'roku',
  'rocznik',
  'rocznika',
  'roczniki',
  'lat',
  'lata',
  'auto',
  'samochod',
  'model',
  'marka',
  'pojazd',
]);

// Generic domain terms that apply to the whole conversion catalog
const DOMAIN_TERMS = new Set([
  'lampa',
  'lampy',
  'swiatla',
  'swiatlo',
  'kierunkowskaz',
  'kierunkowskazy',
  'kierunki',
  'kierunek',
  'konwersja',
  'przerobka',
  'ameryka',
  'amerykanski',
  'usa',
  'europa',
  'eu',
  'kodowanie',
  'montaz',
  'przerobienie',
]);

const normCache = new Map<string, string>();
const compactCache = new Map<string, string>();
const yearSegmentsCache = new Map<string, Array<{ start: number; end: number; isSingleYear: boolean }>>();

/**
 * Normalizes text for case, accent, diacritics and dash insensitive search.
 * Converts Polish letters (ą, ć, ę, ł, ń, ó, ś, ź, ż) to their base ASCII counterparts.
 */
export function normalizeForSearch(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  const key = String(str);
  const cached = normCache.get(key);
  if (cached !== undefined) return cached;

  const result = key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritic accents
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .replace(/[\u2010-\u2015\u2212_]/g, '-') // normalize all Unicode dashes/hyphens
    .replace(/\s+/g, ' ')
    .replace(/cherockee/g, 'cherokee') // Fix common spreadsheet typo in Jeep Grand Cherokee
    .replace(/\bpolift(?:owy|owa|owe|u|em)?\b/g, 'lift')
    .replace(/\bpo\s+lifcie\b/g, 'lift')
    .replace(/\bfacelift\b/g, 'lift')
    .replace(/\bprzedlift(?:owy|owa|owe|u|em)?\b/g, 'przed lift')
    .replace(/\bprzed\s+liftem\b/g, 'przed lift')
    .trim();

  normCache.set(key, result);
  return result;
}

/**
 * Strips all non-alphanumeric characters for compact code searching (e.g. 'a6c7' <-> 'a6 c7', 'crv' <-> 'cr-v').
 */
export function toCompactSearch(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  const key = String(str);
  const cached = compactCache.get(key);
  if (cached !== undefined) return cached;

  const result = normalizeForSearch(key).replace(/[^a-z0-9]/g, '');
  compactCache.set(key, result);
  return result;
}

/**
 * Normalizes year strings to consistent dash notation.
 */
export function normalizeYears(str?: string): string {
  if (!str) return '';
  return normalizeForSearch(str).replace(/\s*-\s*/g, '-').trim();
}

/**
 * Parses multiple year ranges/segments from strings like:
 * "2015-2018/2018-", "2013-2020", "2016-", "2018+", "2015-18", "2021", "od 2018", "do 2014"
 */
export function parseYearSegments(str?: string): Array<{ start: number; end: number; isSingleYear: boolean }> {
  if (!str || str.trim() === '-' || str.trim() === '') return [];
  const cached = yearSegmentsCache.get(str);
  if (cached !== undefined) return cached;

  const parts = str.split(/[\/,;]/);
  const segments: Array<{ start: number; end: number; isSingleYear: boolean }> = [];

  for (const part of parts) {
    const clean = normalizeYears(part);
    const matches4 = clean.match(/\b(19\d\d|20\d\d)\b/g);

    if (matches4 && matches4.length >= 2) {
      const s = parseInt(matches4[0], 10);
      const e = parseInt(matches4[1], 10);
      segments.push({ start: Math.min(s, e), end: Math.max(s, e), isSingleYear: false });
    } else if (matches4 && matches4.length === 1) {
      const start = parseInt(matches4[0], 10);
      const twoDigitMatch = clean.match(/\b(?:19\d\d|20\d\d)\s*-\s*(\d{2})\b/);
      if (twoDigitMatch) {
        const century = Math.floor(start / 100) * 100;
        const end = century + parseInt(twoDigitMatch[1], 10);
        segments.push({ start, end, isSingleYear: false });
      } else if (clean.includes('-') || clean.includes('+') || clean.includes('od')) {
        segments.push({ start, end: 2035, isSingleYear: false });
      } else if (clean.includes('do')) {
        segments.push({ start: 1990, end: start, isSingleYear: false });
      } else {
        segments.push({ start, end: start, isSingleYear: true });
      }
    }
  }

  yearSegmentsCache.set(str, segments);
  return segments;
}

/**
 * Returns the primary year range for a given year string, or null if none parsed.
 */
export function parseYearRange(str?: string): { start: number; end: number; isSingleYear: boolean } | null {
  if (!str) return null;
  const segments = parseYearSegments(str);
  if (segments.length === 0) return null;
  return segments[0];
}

/**
 * Determines whether a row's year specification matches a year filter (e.g. single year '2018' or range '2015-2020').
 */
export function matchesYearFilter(rowYears: string, yearFilter: string): boolean {
  if (!yearFilter || yearFilter === 'all') return true;
  if (!rowYears || rowYears.trim() === '-' || rowYears.trim() === '') return false;

  const normRow = normalizeYears(rowYears);
  const normFilter = normalizeYears(yearFilter);

  // Exact string match (e.g. "2018-2024" === "2018-2024")
  if (normRow === normFilter || normRow.includes(normFilter)) {
    return true;
  }

  const rowSegments = parseYearSegments(rowYears);
  if (rowSegments.length === 0) {
    return normRow.includes(normFilter);
  }

  // 1. Filter is a 4-digit calendar year (e.g. "2021")
  if (/^\d{4}$/.test(normFilter)) {
    const targetYear = parseInt(normFilter, 10);
    return rowSegments.some((seg) => targetYear >= seg.start && targetYear <= seg.end);
  }

  // 2. Filter is a year range (e.g. "2018-2024" or "2018-")
  const filterSegments = parseYearSegments(yearFilter);
  if (filterSegments.length > 0) {
    const f = filterSegments[0];
    return rowSegments.some((seg) => Math.max(seg.start, f.start) <= Math.min(seg.end, f.end));
  }

  return normRow.includes(normFilter);
}

/**
 * Builds the searchable composite text for a given document row.
 * Separates vehicle identity (brand, model, factoryCode, years) from secondary fields (notes, specs)
 * to prevent false positives (e.g. searching 'f-150' or 'a6' matching arbitrary prices).
 */
export function buildRowSearchableText(row: DocumentRow): {
  norm: string;
  compact: string;
  vehicleNorm: string;
  vehicleCompact: string;
} {
  const vehicleParts = [
    row.brand,
    row.model,
    row.factoryCode && row.factoryCode !== '-' ? row.factoryCode : '',
    row.years && row.years !== '-' ? row.years : '',
  ];
  const vehicleJoined = vehicleParts.filter(Boolean).join(' ');
  const vehicleNorm = normalizeForSearch(vehicleJoined);
  const vehicleCompact = toCompactSearch(vehicleJoined);

  const extraParts = [
    row.staticSignal,
    row.dynamicSignal,
    row.installation,
    row.coding,
    row.customNotes,
    row.multimediaVersion,
    row.multimediaNotes,
  ];
  const extraJoined = extraParts.filter(Boolean).join(' ');
  const extraNorm = normalizeForSearch(extraJoined);

  const fullNorm = `${vehicleNorm} ${extraNorm}`.trim();
  const fullCompact = `${vehicleCompact}${toCompactSearch(extraJoined)}`;

  return {
    norm: fullNorm,
    compact: fullCompact,
    vehicleNorm,
    vehicleCompact,
  };
}

/**
 * Checks if a single search token matches a catalog row.
 */
function tokenMatchesRow(
  token: string,
  searchable: { norm: string; compact: string; vehicleNorm: string; vehicleCompact: string },
  row: DocumentRow
): boolean {
  const tokenNorm = normalizeForSearch(token);
  if (!tokenNorm) return true;

  // 1. Generic domain keywords (e.g. "lampa", "swiatla", "usa", "konwersja", "europa")
  if (DOMAIN_TERMS.has(tokenNorm)) {
    return true;
  }

  // 2. 4-digit calendar year match against row year range (e.g. "2018" matches "2015-2020" or "2018-")
  if (/^\d{4}$/.test(tokenNorm)) {
    if (matchesYearFilter(row.years, tokenNorm)) {
      return true;
    }
  }

  // 3. 2-digit year match (e.g. '18' -> 2018)
  if (/^\d{2}$/.test(tokenNorm)) {
    const num = parseInt(tokenNorm, 10);
    const fullYear = num < 50 ? `20${tokenNorm}` : `19${tokenNorm}`;
    if (matchesYearFilter(row.years, fullYear)) {
      return true;
    }
  }

  // 4. Compact alphanumeric match against vehicle identity (e.g. 'f150', 'a6c7', 'w213', 'g20', 'mustang', 'crv', 'cx5')
  const tokenCompact = toCompactSearch(token);
  if (tokenCompact.length >= 2 && searchable.vehicleCompact.includes(tokenCompact)) {
    return true;
  }

  // 5. Standard substring match in normalized vehicle text (brand, model, code, years)
  if (searchable.vehicleNorm.includes(tokenNorm)) {
    return true;
  }

  // 6. Substring match in secondary specifications/notes (for keywords >= 3 chars)
  if (tokenNorm.length >= 3 && searchable.norm.includes(tokenNorm)) {
    return true;
  }

  // 7. Polish grammatical ending stemming (e.g. dynamiczny / dynamiczna / dynamiczne -> dynamiczn; statyczny / statyczna -> statyczn)
  const tokenStem = tokenNorm.replace(/(?:nego|nemu|nymi|nych|nym|ych|ym|ej|ie|ego|emu|ą|ę|em|ami|ach|y|a|e|u|i)$/g, '');
  if (tokenStem.length >= 4 && (searchable.norm.includes(tokenStem) || searchable.vehicleNorm.includes(tokenStem))) {
    return true;
  }

  // 8. Split composite alphanumeric tokens like 'a6c7' into chunks ['a6', 'c7']
  // Must match against vehicle identity
  const subChunks = tokenNorm.match(/[a-z]+\d+|\d+[a-z]+|[a-z]{2,}|\d{2,}/g);
  if (subChunks && subChunks.length > 1) {
    const allChunksMatch = subChunks.every((chunk) => {
      const cNorm = normalizeForSearch(chunk);
      const cCompact = toCompactSearch(chunk);
      return (
        searchable.vehicleNorm.includes(cNorm) ||
        (cCompact.length >= 2 && searchable.vehicleCompact.includes(cCompact)) ||
        (/^\d{4}$/.test(cNorm) && matchesYearFilter(row.years, cNorm))
      );
    });
    if (allChunksMatch) return true;
  }

  return false;
}

/**
 * Checks if a catalog row matches all tokens in the search query.
 */
export function matchesSearchQuery(row: DocumentRow, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const rawTokens = trimmed.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  // Filter out stop words unless the query only contains stop words
  const meaningfulTokens = rawTokens.filter((t) => !STOP_WORDS.has(normalizeForSearch(t)));
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  const searchable = buildRowSearchableText(row);

  return tokens.every((token) => tokenMatchesRow(token, searchable, row));
}

/**
 * Main catalog filtering function with intelligent multi-field search and brand relaxation.
 */
export function filterCatalogRows(
  rows: DocumentRow[],
  options: {
    searchQuery?: string;
    selectedBrand?: string;
    selectedModel?: string;
    selectedYear?: string;
    allBrands?: string[];
  }
): {
  filteredRows: DocumentRow[];
  crossBrandCount: number;
} {
  const {
    searchQuery = '',
    selectedBrand = 'all',
    selectedModel = 'all',
    selectedYear = 'all',
    allBrands = [],
  } = options;

  const q = searchQuery.trim();
  const qNorm = normalizeForSearch(q);

  // Check if search query explicitly specifies a brand from allBrands
  const explicitBrandInQuery = allBrands.find((b) => {
    const bNorm = normalizeForSearch(b);
    return bNorm.length >= 3 && (qNorm === bNorm || qNorm.split(/\s+/).includes(bNorm) || qNorm.includes(bNorm));
  });

  // If user typed a specific brand in the search box that differs from the dropdown, prioritize query brand
  const effectiveBrand =
    explicitBrandInQuery && selectedBrand !== 'all' && normalizeForSearch(selectedBrand) !== normalizeForSearch(explicitBrandInQuery)
      ? 'all'
      : selectedBrand;

  // If brand is relaxed to 'all', also relax model to 'all' so stale model doesn't prevent results
  const effectiveModel = effectiveBrand === 'all' && selectedBrand !== 'all' ? 'all' : selectedModel;

  const brandTarget = effectiveBrand !== 'all' ? normalizeForSearch(effectiveBrand) : '';
  const modelTarget = effectiveModel !== 'all' ? normalizeForSearch(effectiveModel) : '';
  const cleanModelTarget = modelTarget ? modelTarget.replace(/\([^)]+\)/g, '').trim() : '';

  const filteredRows = rows.filter((row) => {
    // 1. Marka
    if (brandTarget) {
      const rowBrand = normalizeForSearch(row.brand);
      if (rowBrand !== brandTarget) {
        return false;
      }
    }

    // 2. Model
    if (modelTarget) {
      const rowModel = normalizeForSearch(row.model);
      const matchExact = rowModel === modelTarget;
      const matchIncluded = rowModel.includes(modelTarget) || (cleanModelTarget.length >= 2 && rowModel.includes(cleanModelTarget));
      const targetIncluded = modelTarget.includes(rowModel);
      if (!matchExact && !matchIncluded && !targetIncluded) {
        return false;
      }
    }

    // 3. Rocznik
    if (selectedYear !== 'all' && !matchesYearFilter(row.years, selectedYear)) {
      return false;
    }

    // 4. Szukaj frazy
    if (q && !matchesSearchQuery(row, q)) {
      return false;
    }

    return true;
  });

  // Calculate cross-brand count if current filter returned 0 and brand was selected
  let crossBrandCount = 0;
  if (filteredRows.length === 0 && selectedBrand !== 'all' && q) {
    crossBrandCount = rows.filter((row) => {
      if (selectedYear !== 'all' && !matchesYearFilter(row.years, selectedYear)) return false;
      return matchesSearchQuery(row, q);
    }).length;
  }

  return { filteredRows, crossBrandCount };
}
