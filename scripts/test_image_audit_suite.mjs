import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import {
  isBusinessOwnedCloudinaryImage,
  isDefaultOrPresetImage,
  safeDeleteTenantImage,
  extractPublicIdFromUrl,
} from '../lib/cloudinary.js';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const TINY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function runAuditTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 SUITE DE PRUEBAS AUTOMATIZADAS - AUDITORÍA DE IMÁGENES');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test multi-tenant isolation & preset protection helpers
    console.log('1️⃣  Comprobando protección de recursos y aislamiento multiempresa (Tenant Isolation)...');
    
    const tenantA = 'business-aaa-111';
    const tenantB = 'business-bbb-222';

    // Default/Preset protection
    assert(isDefaultOrPresetImage('/imagenes/banner1.jpg') === true, 'Detecta presets locales /imagenes/...');
    assert(isDefaultOrPresetImage('https://images.unsplash.com/photo-123') === true, 'Detecta imágenes externas Unsplash');
    assert(isDefaultOrPresetImage('') === true, 'Trata cadenas vacías como predeterminadas/seguras');
    assert(isDefaultOrPresetImage('https://res.cloudinary.com/demo/image/upload/v1/barberos/business-aaa-111/logo/abc.png') === false, 'Detecta correctamente imagen personalizada del tenant');

    // Tenant isolation
    const urlTenantA = 'https://res.cloudinary.com/vyaezxqj/image/upload/v1234/barberos/business-aaa-111/logo/sample_a.jpg';
    const urlTenantB = 'https://res.cloudinary.com/vyaezxqj/image/upload/v1234/barberos/business-bbb-222/logo/sample_b.jpg';

    assert(isBusinessOwnedCloudinaryImage(urlTenantA, tenantA) === true, 'Tenant A es dueño legítimo de su imagen');
    assert(isBusinessOwnedCloudinaryImage(urlTenantA, tenantB) === false, 'Tenant B NO puede reclamar la imagen del Tenant A');
    assert(isBusinessOwnedCloudinaryImage(urlTenantB, tenantA) === false, 'Tenant A NO puede reclamar la imagen del Tenant B');
    assert(isBusinessOwnedCloudinaryImage('https://images.unsplash.com/photo-999', tenantA) === false, 'Imágenes externas no pertenecen al tenant');

    // Safe delete defense
    const deletePreset = await safeDeleteTenantImage('/imagenes/corte1.jpg', tenantA);
    assert(deletePreset.deleted === false && deletePreset.reason === 'preset_or_default_image', 'safeDeleteTenantImage BLOQUEA el borrado de presets');

    const deleteForeign = await safeDeleteTenantImage(urlTenantB, tenantA);
    assert(deleteForeign.deleted === false && deleteForeign.reason === 'not_owned_by_tenant', 'safeDeleteTenantImage BLOQUEA el borrado de imágenes de otros negocios');

    // 2. Real upload, DB link, replace and delete in Cloudinary + Neon
    console.log('\n2️⃣  Comprobando ciclo de vida real (Subida -> DB -> Reemplazo -> Eliminación)...');
    
    const business = await prisma.business.findFirst();
    if (!business) {
      throw new Error('No hay negocios en la base de datos para la prueba');
    }
    console.log(`   Negocio de prueba: "${business.name}" (ID: ${business.id})`);

    // Subir imagen 1 a Cloudinary
    const upload1 = await cloudinary.uploader.upload(TINY_PNG_BASE64, {
      folder: `barberos/${business.id}/audit_test`,
    });
    assert(upload1.secure_url.includes(business.id), 'Imagen 1 subida correctamente a Cloudinary con namespace del negocio');

    // Asociar a Neon
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: upload1.secure_url },
    });
    const checkNeon1 = await prisma.business.findUnique({
      where: { id: business.id },
      select: { logo: true },
    });
    assert(checkNeon1.logo === upload1.secure_url, 'Referencia guardada correctamente en Neon PostgreSQL');

    // Reemplazo: Subir imagen 2
    const upload2 = await cloudinary.uploader.upload(TINY_PNG_BASE64, {
      folder: `barberos/${business.id}/audit_test`,
    });
    assert(upload2.secure_url.includes(business.id), 'Imagen 2 (reemplazo) subida correctamente');

    // Guardar referencia nueva en Neon ANTES de borrar la anterior
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: upload2.secure_url },
    });
    const checkNeon2 = await prisma.business.findUnique({
      where: { id: business.id },
      select: { logo: true },
    });
    assert(checkNeon2.logo === upload2.secure_url, 'Referencia actualizada en Neon antes de eliminar la anterior');

    // Limpiar imagen 1 usando safeDeleteTenantImage
    const cleanOld = await safeDeleteTenantImage(upload1.secure_url, business.id);
    assert(cleanOld.deleted === true, 'Imagen antigua eliminada de Cloudinary únicamente tras confirmarse guardado en Neon');

    // Eliminación final confirmada
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: null },
    });
    const cleanFinal = await safeDeleteTenantImage(upload2.secure_url, business.id);
    assert(cleanFinal.deleted === true, 'Imagen final eliminada de Cloudinary tras desvincularla en Neon');

    const checkNeonFinal = await prisma.business.findUnique({
      where: { id: business.id },
      select: { logo: true },
    });
    assert(checkNeonFinal.logo === null, 'Neon queda consistente en null sin referencias rotas');

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`🏁 RESULTADO: ${passed} pasadas, ${failed} falladas.`);
    console.log('════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error fatal durante la auditoría:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuditTests();
