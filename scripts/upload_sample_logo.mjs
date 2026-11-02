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
  const logoPath = resolve(process.cwd(), 'Logo dorado de barbería clásica.png');
  if (!fs.existsSync(logoPath)) {
    console.error('No se encontró el archivo de logo');
    return;
  }

  console.log('Subiendo "Logo dorado de barbería clásica.png" a Cloudinary...');
  const result = await cloudinary.uploader.upload(logoPath, {
    folder: 'barberos/d93ff19d-5055-4d51-ae66-2d27536e9964/logo',
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  console.log('✅ Subido con éxito a Cloudinary:', result.secure_url);

  // Actualizar negocio en Neon
  const updated = await prisma.business.update({
    where: { id: 'd93ff19d-5055-4d51-ae66-2d27536e9964' },
    data: { logo: result.secure_url },
    select: { id: true, name: true, slug: true, logo: true }
  });

  console.log('✅ Actualizado en Neon DB:', updated);
  await prisma.$disconnect();
}

main().catch(console.error);
