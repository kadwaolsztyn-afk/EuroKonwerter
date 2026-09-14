import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating high-resolution application icons...');

  // Ensure directories exist
  fs.mkdirSync(path.resolve('public'), { recursive: true });
  fs.mkdirSync(path.resolve('electron'), { recursive: true });

  // 1. 512x512 Master PNG for Desktop Installer & App
  const p512 = await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/icon.png'));
  console.log('Created public/icon.png (512x512)');

  // 2. Electron App & Taskbar Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('electron/icon.png'));
  console.log('Created electron/icon.png (512x512)');

  // 3. 256x256 Desktop Shortcut Icon
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.resolve('electron/icon-256.png'));

  // 4. Copy SVG to electron folder and favicon
  fs.copyFileSync(svgPath, path.resolve('electron/icon.svg'));
  fs.copyFileSync(svgPath, path.resolve('public/favicon.svg'));

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
