const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Build an ICO buffer from multiple PNG buffers (16x16, 32x32, 48x48)
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  // Header: 6 bytes
  // Directory entries: 16 bytes each
  const headerSize = 6;
  const dirSize = 16 * count;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  for (const { buffer, size } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset to image data
    dirEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function main() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'app');

  const lightSource = path.join(publicDir, 'logo tema claro.png');
  const darkSource = path.join(publicDir, 'logo tema oscuro.png');

  if (!fs.existsSync(lightSource) || !fs.existsSync(darkSource)) {
    console.error('Source logos not found in public/');
    process.exit(1);
  }

  console.log('Generating optimized brand assets...');

  // 1. Optimize Light Logo
  await sharp(lightSource)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(publicDir, 'logo-light.png'));
  console.log('✓ public/logo-light.png created');

  // 2. Optimize Dark Logo
  await sharp(darkSource)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(publicDir, 'logo-dark.png'));
  console.log('✓ public/logo-dark.png created');

  // 3. Fallback / Standard logo.png (using the primary Dark theme logo)
  await sharp(darkSource)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ public/logo.png updated with new brand logo');

  // 4. Favicon & Icons
  // app/icon.png (Next.js automatically uses this for metadata /icon)
  await sharp(darkSource)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(appDir, 'icon.png'));
  console.log('✓ app/icon.png updated');

  // public/icon.png
  await sharp(darkSource)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('✓ public/icon.png created');

  // public/favicon.png (32x32 and 192x192)
  await sharp(darkSource)
    .resize(32, 32, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ public/favicon.png updated');

  await sharp(darkSource)
    .resize(192, 192, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon-192.png'));
  console.log('✓ public/favicon-192.png created');

  // public/apple-touch-icon.png (180x180)
  await sharp(darkSource)
    .resize(180, 180, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png created');

  // 5. Multi-resolution favicon.ico (16, 32, 48)
  const ico16 = await sharp(darkSource).resize(16, 16, { fit: 'contain' }).png().toBuffer();
  const ico32 = await sharp(darkSource).resize(32, 32, { fit: 'contain' }).png().toBuffer();
  const ico48 = await sharp(darkSource).resize(48, 48, { fit: 'contain' }).png().toBuffer();

  const icoBuffer = createIco([
    { buffer: ico16, size: 16 },
    { buffer: ico32, size: 32 },
    { buffer: ico48, size: 48 },
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ public/favicon.ico created');

  console.log('All brand assets successfully generated and optimized!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
