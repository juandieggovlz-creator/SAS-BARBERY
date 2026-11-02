import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

const SAMPLE_TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 INICIANDO PRUEBAS DE INTEGRACIÓN: CLOUDINARY + NEON + PRISMA');
  console.log('================================================================\n');

  // 1. Verificación de credenciales de Cloudinary (Ping)
  console.log('1️⃣  Comprobando conexión y ping a Cloudinary...');
  const ping = await cloudinary.api.ping();
  if (ping.status !== 'ok') {
    throw new Error('Cloudinary ping falló');
  }
  console.log('   ✅ Cloudinary Ping exitoso. Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

  // 2. Obtener un negocio existente de prueba en Neon
  console.log('\n2️⃣  Obteniendo negocio existente en base de datos Neon...');
  const business = await prisma.business.findFirst({
    include: { page: true },
  });

  if (!business) {
    throw new Error('No se encontró ningún negocio en Neon para probar');
  }
  console.log(`   ✅ Negocio encontrado: "${business.name}" (ID: ${business.id}, Slug: ${business.slug})`);

  // Guardar estado original para restaurar
  const originalLogo = business.logo;
  const originalGallery = Array.isArray(business.page?.gallery) ? business.page.gallery : [];

  try {
    // 3. Prueba de subida de Logo a Cloudinary y persistencia en Neon
    console.log('\n3️⃣  Subiendo logo de prueba a Cloudinary...');
    const logoUpload = await cloudinary.uploader.upload(SAMPLE_TINY_PNG_BASE64, {
      folder: `barberos/${business.id}/logo`,
      resource_type: 'image',
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
    });

    console.log('   ✅ Logo subido a Cloudinary exitosamente.');
    console.log('      - Secure URL:', logoUpload.secure_url);
    console.log('      - Public ID:', logoUpload.public_id);

    console.log('   Guardando URL del logo en Neon mediante Prisma...');
    const updatedBiz = await prisma.business.update({
      where: { id: business.id },
      data: { logo: logoUpload.secure_url },
      select: { id: true, logo: true },
    });
    console.log('   ✅ Logo persistido en Neon:', updatedBiz.logo === logoUpload.secure_url ? 'CORRECTO' : 'ERROR');

    // 4. Verificación de lectura después de guardar
    console.log('\n4️⃣  Consultando base de datos para confirmar lectura...');
    const readBiz = await prisma.business.findUnique({
      where: { id: business.id },
      select: { logo: true },
    });
    if (readBiz?.logo !== logoUpload.secure_url) {
      throw new Error('El logo guardado no coincide en la consulta de Neon');
    }
    console.log('   ✅ Verificado: La referencia en Neon coincide exactamente con la URL segura de Cloudinary.');

    // 5. Prueba de subida a Galería (Categoría: Cortes)
    console.log('\n5️⃣  Subiendo fotografía a la galería (categoría "cortes")...');
    const galleryUpload = await cloudinary.uploader.upload(SAMPLE_TINY_PNG_BASE64, {
      folder: `barberos/${business.id}/gallery`,
      resource_type: 'image',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    });
    console.log('   ✅ Foto de galería subida a Cloudinary.');
    console.log('      - Secure URL:', galleryUpload.secure_url);
    console.log('      - Public ID:', galleryUpload.public_id);

    const testItem = {
      id: 'test-item-' + Date.now(),
      url: galleryUpload.secure_url,
      publicId: galleryUpload.public_id,
      caption: 'Fade Texturizado Prueba Automatizada',
      category: 'cortes',
      createdAt: new Date().toISOString(),
    };

    // Asegurar que exista BusinessPage
    let page = await prisma.businessPage.findUnique({
      where: { businessId: business.id },
    });
    if (!page) {
      page = await prisma.businessPage.create({
        data: { businessId: business.id, gallery: [testItem] },
      });
    } else {
      const currentItems = Array.isArray(page.gallery) ? page.gallery : [];
      await prisma.businessPage.update({
        where: { businessId: business.id },
        data: { gallery: [...currentItems, testItem] },
      });
    }

    const readPage = await prisma.businessPage.findUnique({
      where: { businessId: business.id },
      select: { gallery: true },
    });
    const itemsInDb = readPage?.gallery || [];
    const itemExists = itemsInDb.some((i) => i.id === testItem.id);
    if (!itemExists) {
      throw new Error('El elemento no se guardó en BusinessPage.gallery');
    }
    console.log('   ✅ Elemento guardado y verificado en Neon BusinessPage.gallery.');

    // 6. Prueba de reemplazo de imagen en Galería
    console.log('\n6️⃣  Probando reemplazo de fotografía en la galería...');
    const replaceUpload = await cloudinary.uploader.upload(SAMPLE_TINY_PNG_BASE64, {
      folder: `barberos/${business.id}/gallery`,
      resource_type: 'image',
    });
    console.log('   ✅ Nueva imagen cargada para reemplazo:', replaceUpload.public_id);

    // Eliminar la imagen anterior de Cloudinary
    const delOld = await cloudinary.uploader.destroy(testItem.publicId);
    console.log('   ✅ Imagen antigua eliminada de Cloudinary:', delOld.result);

    // Actualizar registro en Neon
    const currentItemsAfterReplace = itemsInDb.map((i) => {
      if (i.id === testItem.id) {
        return {
          ...i,
          url: replaceUpload.secure_url,
          publicId: replaceUpload.public_id,
          caption: 'Corte Reemplazado Exitosamente',
        };
      }
      return i;
    });

    await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { gallery: currentItemsAfterReplace },
    });
    console.log('   ✅ Referencia actualizada en Neon tras el reemplazo.');

    // 7. Prueba de eliminación controlada (limpieza de recursos de prueba)
    console.log('\n7️⃣  Probando eliminación de imágenes de prueba y limpieza...');
    const delReplace = await cloudinary.uploader.destroy(replaceUpload.public_id);
    console.log('   ✅ Imagen reemplazada eliminada de Cloudinary:', delReplace.result);

    const delLogo = await cloudinary.uploader.destroy(logoUpload.public_id);
    console.log('   ✅ Logo de prueba eliminado de Cloudinary:', delLogo.result);

    // Restaurar base de datos
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: originalLogo },
    });

    const finalGalleryCleaned = currentItemsAfterReplace.filter((i) => i.id !== testItem.id);
    await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { gallery: originalGallery.length > 0 ? originalGallery : finalGalleryCleaned },
    });
    console.log('   ✅ Base de datos restaurada al estado original sin referencias rotas.');

    console.log('\n================================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE CLOUDINARY Y NEON PASARON EXITOSAMENTE');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ ERROR DURANTE LA PRUEBA:', err);
    // Intentar restaurar DB en caso de error
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: originalLogo },
    }).catch(() => {});
    await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { gallery: originalGallery },
    }).catch(() => {});
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
