const fs = require('fs');
const path = require('path');
const { getLampSvg } = require('./svg-helpers.cjs');
const { brandsAC } = require('./data-part-ac.cjs');
const { brandsBmwCadChev } = require('./data-part-bmw-chev.cjs');
const { brandsDodgeJeep } = require('./data-part-dodge-jeep.cjs');
const { brandsKiaMerc } = require('./data-part-kia-merc.cjs');
const { brandsMiniVolvo } = require('./data-part-mini-volvo.cjs');

// Combine all 461 records
const allRawRows = [
  ...brandsAC,
  ...brandsBmwCadChev,
  ...brandsDodgeJeep,
  ...brandsKiaMerc,
  ...brandsMiniVolvo
];

console.log(`Total assembled rows: ${allRawRows.length}`);

// Enrich rows with standard schema properties
const enrichedRows = allRawRows.map((r, index) => {
  const brand = r.brand.trim();
  const model = r.model.trim();
  const factoryCode = (r.factoryCode || '-').trim();
  const years = (r.years || '-').trim();
  const staticSignal = (r.staticSignal || '-').trim();
  const priceClientStatic = (r.priceClientStatic || '-').trim();
  const priceBrokerStatic = (r.priceBrokerStatic || '-').trim();
  const dynamicSignal = (r.dynamicSignal || '-').trim();
  const priceClientDynamic = (r.priceClientDynamic || '-').trim();
  const priceBrokerDynamic = (r.priceBrokerDynamic || '-').trim();
  const installation = (r.installation || 'Tak').trim();
  const coding = (r.coding || 'Tak').trim();
  const lampCount = (r.lampCount || '2').trim();

  return {
    id: r.id || index + 1,
    lp: String(r.lp || index + 1),
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
    imageUrl: getLampSvg(brand, model),
    imageAlt: `${brand} ${model} (${factoryCode}) Lampy USA->EU`,
    customNotes: `${factoryCode !== '-' ? factoryCode : ''} ${years !== '-' ? `(${years})` : ''} • Lamp: ${lampCount} • Montaż: ${installation} • Kodowanie: ${coding}`.trim()
  };
});

const brands = [...new Set(enrichedRows.map(r => r.brand))].sort();
console.log(`Brands count: ${brands.length}`);

// Write data-catalog.json
const catalogDoc = {
  id: "cennik-all-461-master",
  name: "Baza Pojazdów USA/EU (Cennik 2026 - 461 Pozycji)",
  fileType: "json",
  sizeFormatted: "240 KB",
  importedAt: "2026-08-30T12:00:00.000Z",
  version: "2026.03_ALL_v461",
  updatedAt: "2026-08-30T12:00:00.000Z",
  brandsCount: brands.length,
  totalRows: enrichedRows.length,
  headers: [
    "LP", "Marka", "Model", "Kod fabryczny", "Rocznik",
    "Sygnał statyczny", "Cena Klient (Stat)", "Cena Pośrednik (Stat)",
    "Sygnał dynamiczny", "Cena Klient (Dyn)", "Cena Pośrednik (Dyn)",
    "Instalacja", "Kodowanie", "Ilość lamp"
  ],
  images: [],
  rows: enrichedRows
};

fs.writeFileSync(path.join(__dirname, '../data-catalog.json'), JSON.stringify(catalogDoc, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/data-catalog.json'), JSON.stringify(catalogDoc, null, 2), 'utf8');

// Write src/data/initialCatalog.ts
const tsCode = `import { DocumentRow, ImportedDocument } from '../types';

export const CURRENT_DATABASE_VERSION = "2026.03_ALL_v461";

export const INITIAL_461_CATALOG_ROWS: DocumentRow[] = ${JSON.stringify(enrichedRows, null, 2)};

export const INITIAL_COMPREHENSIVE_CATALOG: ImportedDocument = {
  id: "cennik-all-461-master",
  name: "Baza Pojazdów USA/EU (Cennik 2026 - 461 Pozycji)",
  fileType: "json",
  sizeFormatted: "240 KB",
  importedAt: new Date("2026-08-30T12:00:00.000Z"),
  version: CURRENT_DATABASE_VERSION,
  totalRows: ${enrichedRows.length},
  brandsCount: ${brands.length},
  headers: [
    "LP", "Marka", "Model", "Kod fabryczny", "Rocznik",
    "Sygnał statyczny", "Cena Klient (Stat)", "Cena Pośrednik (Stat)",
    "Sygnał dynamiczny", "Cena Klient (Dyn)", "Cena Pośrednik (Dyn)",
    "Instalacja", "Kodowanie", "Ilość lamp"
  ],
  images: [],
  rows: INITIAL_461_CATALOG_ROWS
};

// Backwards compatibility alias
export const INITIAL_35_BRANDS_DOCUMENT = INITIAL_COMPREHENSIVE_CATALOG;
`;

fs.writeFileSync(path.join(__dirname, '../src/data/initialCatalog.ts'), tsCode, 'utf8');
console.log('Successfully generated master dataset files!');
