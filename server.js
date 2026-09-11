// Root compatibility entry point for Cloud Run and production runners
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

if (!process.env.NODE_ENV && (process.env.K_SERVICE || fs.existsSync(path.join(process.cwd(), 'dist')))) {
  process.env.NODE_ENV = 'production';
}

const serverCjsPath = path.join(process.cwd(), 'dist', 'server.cjs');
if (fs.existsSync(serverCjsPath)) {
  require(serverCjsPath);
} else {
  // If dist/server.cjs is not compiled yet, run server.ts directly using Node 22 native TypeScript support
  console.log('[Runner] dist/server.cjs not found, launching server.ts directly...');
  import('./server.ts').catch((err) => {
    console.error('Fatal startup error in server.ts:', err);
    process.exit(1);
  });
}


