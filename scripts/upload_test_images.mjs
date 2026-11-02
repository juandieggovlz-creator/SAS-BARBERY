import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

async function main() {
  const imagesDir = resolve(process.cwd(), 'public', 'imagenes');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Subiendo ${files.length} imágenes de prueba de public/imagenes a Cloudinary...`);
  const uploadedUrls = {};

  for (const file of files) {
    const fullPath = resolve(imagesDir, file);
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: 'barberos/d93ff19d-5055-4d51-ae66-2d27536e9964/covers',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    uploadedUrls[file] = result.secure_url;
    console.log(`✅ ${file} -> ${result.secure_url}`);
  }

  // Si banner-corte-navaja.jpeg fue subida, actualizar la página de Barbería Elite SAS en Neon
  if (uploadedUrls['banner-corte-navaja.jpeg']) {
    const navajaUrl = uploadedUrls['banner-corte-navaja.jpeg'];
    await prisma.businessPage.updateMany({
      where: { businessId: 'd93ff19d-5055-4d51-ae66-2d27536e9964' },
      data: { bannerUrl: navajaUrl }
    });
    console.log(`✅ BusinessPage bannerUrl actualizada con Cloudinary: ${navajaUrl}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
