const fs = require('fs');
const path = require('path');
const { MODELS_DATA } = require('./models-dataset.cjs');

// Build clean individualized model entries
const cleanRows = [];
let lp = 1;

MODELS_DATA.forEach((item) => {
  cleanRows.push({
    id: lp,
    lp: lp,
    brand: item.brand,
    model: item.model,
    factoryCode: item.factoryCode,
    years: item.years,
    staticSignal: item.statSig || 'Statyczny LED',
    priceClientStatic: item.pClientStat,
    priceBrokerStatic: item.pBrokStat,
    dynamicSignal: item.dynSig || 'Dynamiczny LED',
    priceClientDynamic: item.pClientDyn,
    priceBrokerDynamic: item.pBrokDyn,
    installation: 'TAK',
    coding: item.cod || 'W cenie',
    lampCount: item.lamps || '4 szt.',
    imageUrl: ''
  });
  lp++;
});

const doc = {
  id: 'auto-catalog-master',
  fileName: 'data-catalog.json',
  fileType: 'json',
  size: 380000,
  sizeFormatted: '380 KB',
  importedAt: new Date().toISOString(),
  totalRows: cleanRows.length,
  brandsCount: new Set(cleanRows.map(r => r.brand)).size,
  headers: [
    'Lp.', 'Marka', 'Model', 'Generacja / Kod', 'Roczniki',
    'Kierunkowskaz Stat.', 'Cena Stat. Klient', 'Cena Stat. Hurt',
    'Kierunkowskaz Dyn.', 'Cena Dyn. Klient', 'Cena Dyn. Hurt',
    'Montaż', 'Kodowanie', 'Ilość lamp', 'Zdjęcie'
  ],
  rows: cleanRows,
  images: {},
  rawHtml: ''
};

fs.writeFileSync(path.join(process.cwd(), 'data-catalog.json'), JSON.stringify(doc, null, 2), 'utf8');
console.log('Clean catalog saved to data-catalog.json with rows:', cleanRows.length);
