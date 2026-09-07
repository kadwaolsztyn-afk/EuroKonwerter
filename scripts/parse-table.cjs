const fs = require('fs');
const { getLampSvg } = require('./svg-helpers.cjs');

// Let's create a parser that parses the Google Sheets HTML table or builds the rows
function parseGoogleSheetTable(html) {
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  const rows = [];
  let match;
  let lpCounter = 1;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      let val = cellMatch[1]
        .replace(/<div[^>]*>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(val);
    }

    // A valid catalog row has LP in column C/D or mark name
    // Let's check cell columns
    // Header row has LP, Marka, Model...
    if (cells.length >= 10) {
      // Find lp index
      const lpIdx = cells.findIndex((c, i) => i < 5 && /^\d+$/.test(c.trim()));
      if (lpIdx !== -1 && cells.length > lpIdx + 8) {
        const lp = cells[lpIdx];
        const brand = cells[lpIdx + 1];
        const model = cells[lpIdx + 2];
        const factoryCode = cells[lpIdx + 3] || '-';
        const years = cells[lpIdx + 4] || '-';
        const staticSignal = cells[lpIdx + 5] || '-';
        const priceClientStatic = cells[lpIdx + 6] || '-';
        const priceBrokerStatic = cells[lpIdx + 7] || '-';
        const dynamicSignal = cells[lpIdx + 8] || '-';
        const priceClientDynamic = cells[lpIdx + 9] || '-';
        const priceBrokerDynamic = cells[lpIdx + 10] || '-';
        const installation = cells[lpIdx + 11] || 'Tak';
        const coding = cells[lpIdx + 12] || 'Tak';
        const lampCount = cells[lpIdx + 13] || '2';

        if (brand && model && brand !== 'Marka') {
          rows.push({
            id: parseInt(lp, 10) || lpCounter,
            lp: lp || String(lpCounter),
            brand: brand.trim(),
            model: model.trim(),
            factoryCode: factoryCode.trim(),
            years: years.trim(),
            staticSignal: staticSignal.trim(),
            priceClientStatic: priceClientStatic.trim(),
            basePriceClientStatic: priceClientStatic.trim(),
            priceBrokerStatic: priceBrokerStatic.trim(),
            basePriceBrokerStatic: priceBrokerStatic.trim(),
            dynamicSignal: dynamicSignal.trim(),
            priceClientDynamic: priceClientDynamic.trim(),
            basePriceClientDynamic: priceClientDynamic.trim(),
            priceBrokerDynamic: priceBrokerDynamic.trim(),
            basePriceBrokerDynamic: priceBrokerDynamic.trim(),
            installation: installation.trim(),
            coding: coding.trim(),
            lampCount: lampCount.trim(),
            imageUrl: getLampSvg(brand.trim(), model.trim()),
            imageAlt: `${brand} ${model} Lampa LED / Dynamic`,
            customNotes: `${factoryCode} • Kierunkowskazy: ${staticSignal} / ${dynamicSignal} • Kodowanie: ${coding}`
          });
          lpCounter++;
        }
      }
    }
  }

  return rows;
}

module.exports = { parseGoogleSheetTable };
