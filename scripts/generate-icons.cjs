const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcoFromPngs(pngBuffersWithSizes) {
  // pngBuffersWithSizes is array of { size, buffer }
  const count = pngBuffersWithSizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved (0)
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  const imageBuffers = [];

  for (const item of pngBuffersWithSizes) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0); // Width
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1); // Height
    entry.writeUInt8(0, 2); // Palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Size
    entry.writeUInt32LE(offset, 12); // Offset

    entries.push(entry);
    imageBuffers.push(item.buffer);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

async function main() {
  const svgPath = path.join(__dirname, '../electron/icon.svg');
  const pngPath = path.join(__dirname, '../electron/icon.png');
  const png256Path = path.join(__dirname, '../electron/icon-256.png');
  const icoPath = path.join(__dirname, '../electron/icon.ico');

  console.log('Generating clean icons from SVG...');
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngList = [];

  for (const size of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngList.push({ size, buffer: buf });
  }

  // Save 256x256 PNGs
  const png256 = pngList.find(p => p.size === 256).buffer;
  fs.writeFileSync(pngPath, png256);
  fs.writeFileSync(png256Path, png256);
  console.log(`Saved PNG: ${pngPath}`);

  // Create multi-size ICO
  const icoBuffer = await createIcoFromPngs(pngList);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Saved Multi-resolution Windows ICO (${sizes.join(', ')} px, total ${icoBuffer.length} bytes): ${icoPath}`);
}

main().catch(console.error);
