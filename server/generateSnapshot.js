import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { refreshData, getCache } from './sheetsFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
  console.log('Fetching live sheet data for snapshot...');
  await refreshData();
  const cache = getCache();
  const targetPath = path.join(__dirname, '../client/src/dataSnapshot.json');
  fs.writeFileSync(targetPath, JSON.stringify(cache, null, 2));
  console.log(`Successfully generated static data snapshot at ${targetPath}`);
}

generate().catch(err => {
  console.error('Failed to generate snapshot:', err);
  process.exit(1);
});
