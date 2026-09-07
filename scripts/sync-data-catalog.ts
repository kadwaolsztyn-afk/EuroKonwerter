import fs from 'fs';
import path from 'path';
import { INITIAL_35_BRANDS_DOCUMENT } from '../src/data/initialCatalog';

const DATA_FILE = path.join(process.cwd(), 'data-catalog.json');

try {
  const jsonContent = JSON.stringify(INITIAL_35_BRANDS_DOCUMENT, null, 2);
  fs.writeFileSync(DATA_FILE, jsonContent, 'utf-8');
  console.log(`Successfully generated ${DATA_FILE} (${(jsonContent.length / 1024 / 1024).toFixed(2)} MB, ${INITIAL_35_BRANDS_DOCUMENT.rows.length} rows)`);
} catch (err) {
  console.error('Error writing data-catalog.json:', err);
  process.exit(1);
}
