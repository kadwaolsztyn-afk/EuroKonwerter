import ExcelJS from 'exceljs';
import { ImportedDocument, DocumentRow } from '../types';

export async function exportToExcel(doc: ImportedDocument) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cennik 1to1');

  // Add header
  worksheet.columns = [
    { header: 'LP.', key: 'lp', width: 8 },
    { header: 'Marka', key: 'brand', width: 20 },
    { header: 'Model', key: 'model', width: 22 },
    { header: 'Kod fabryczny', key: 'factoryCode', width: 18 },
    { header: 'Lata produkcji', key: 'years', width: 16 },
    { header: 'Kierunkowskaz Statyczny', key: 'staticSignal', width: 22 },
    { header: 'Cena Klient (Stat)', key: 'priceClientStatic', width: 18 },
    { header: 'Cena Broker (Stat)', key: 'priceBrokerStatic', width: 18 },
    { header: 'Kierunkowskaz Dynamiczny', key: 'dynamicSignal', width: 24 },
    { header: 'Cena Klient (Dyn)', key: 'priceClientDynamic', width: 18 },
    { header: 'Cena Broker (Dyn)', key: 'priceBrokerDynamic', width: 18 },
    { header: 'Instalacja', key: 'installation', width: 12 },
    { header: 'Kodowanie', key: 'coding', width: 12 },
    { header: 'Ilość lamp', key: 'lampCount', width: 12 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: '000000' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC000' },
  };

  doc.rows.forEach((row) => {
    worksheet.addRow({
      lp: row.lp,
      brand: row.brand,
      model: row.model,
      factoryCode: row.factoryCode,
      years: row.years,
      staticSignal: row.staticSignal,
      priceClientStatic: row.priceClientStatic,
      priceBrokerStatic: row.priceBrokerStatic,
      dynamicSignal: row.dynamicSignal,
      priceClientDynamic: row.priceClientDynamic,
      priceBrokerDynamic: row.priceBrokerDynamic,
      installation: row.installation,
      coding: row.coding,
      lampCount: row.lampCount,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = window.document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${doc.name.replace(/\.[^/.]+$/, '')}_eksport.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToHtml(doc: ImportedDocument) {
  const htmlStr = doc.rawHtml || generateHtmlFromDocument(doc);
  const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8;' });
  const link = window.document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${doc.name.replace(/\.[^/.]+$/, '')}_1to1.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function generateHtmlFromDocument(doc: ImportedDocument): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>${doc.name}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 20px; background: #fff; color: #000; }
  h1 { color: #1e293b; border-bottom: 3px solid #ffc000; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
  th { background-color: #ffc000; color: #000; font-weight: bold; padding: 10px; border: 1px solid #000; text-align: center; }
  td { padding: 8px; border: 1px solid #cbd5e1; text-align: center; }
  tr:nth-child(even) { background-color: #f8fafc; }
  img { max-width: 140px; max-height: 80px; object-fit: contain; }
</style>
</head>
<body>
  <h1>${doc.name}</h1>
  <table>
    <thead>
      <tr>
        <th>LP.</th><th>Marka</th><th>Model</th><th>Kod fabryczny</th><th>Lata</th>
        <th>Kierunkowskaz Stat.</th><th>Cena Klient (Stat)</th><th>Cena Broker (Stat)</th>
        <th>Kierunkowskaz Dyn.</th><th>Cena Klient (Dyn)</th><th>Cena Broker (Dyn)</th>
        <th>Instalacja</th><th>Kodowanie</th><th>Ilość lamp</th><th>Zdjęcie</th>
      </tr>
    </thead>
    <tbody>
      ${doc.rows
        .map(
          (r) => `
        <tr>
          <td>${r.lp}</td>
          <td><strong>${r.brand}</strong></td>
          <td>${r.model}</td>
          <td>${r.factoryCode}</td>
          <td>${r.years}</td>
          <td>${r.staticSignal}</td>
          <td>${r.priceClientStatic}</td>
          <td>${r.priceBrokerStatic}</td>
          <td>${r.dynamicSignal}</td>
          <td>${r.priceClientDynamic}</td>
          <td>${r.priceBrokerDynamic}</td>
          <td>${r.installation}</td>
          <td>${r.coding}</td>
          <td>${r.lampCount}</td>
          <td>${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.brand}">` : '-'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
}
