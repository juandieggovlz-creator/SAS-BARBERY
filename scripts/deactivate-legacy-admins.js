/**
 * BarberOS — Retiro Seguro de Cuentas Super Admin Delegadas Legacy
 * 
 * Política de seguridad:
 * 1. NO elimina registros para preservar integridad referencial e historial de auditoría.
 * 2. Marca isActive: false en User.
 * 3. Invalida y revoca todas las sesiones persistentes en la tabla Session.
 * 4. Registra evento de auditoría oficial de desactivación.
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const LEGACY_EMAILS = [
  'superadmin@barberos.com',
  'admin@barberos.co'
];

async function main() {
  console.log('\n======================================================');
  console.log('   BARBEROS — DESACTIVACIÓN DE CUENTAS ADMIN LEGACY');
  console.log('======================================================\n');

  // Verificar primero que el Root Platform Owner esté activo y con MFA
  const rootOwner = await prisma.user.findUnique({
    where: { email: 'juandieggovlz@gmail.com' }
  });

  if (!rootOwner || rootOwner.role !== 'ROOT_PLATFORM_OWNER' || !rootOwner.isActive || !rootOwner.mfaEnabled) {
    console.error('❌ ABORTADO: La cuenta principal ROOT_PLATFORM_OWNER no está lista o verificada.');
    process.exit(1);
  }

  console.log(`🛡️ Propietario Verificado: ${rootOwner.email} (ID: ${rootOwner.id})`);
  console.log('⏳ Procediendo con la desactivación segura de cuentas legadas...\n');

  for (const email of LEGACY_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`ℹ️ Usuario ${email} no encontrado en base de datos.`);
      continue;
    }

    // 1. Revocar todas las sesiones
    const revoked = await prisma.session.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true }
    });

    // 2. Desactivar cuenta
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false
      }
    });

    // 3. Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: rootOwner.id,
        userRole: rootOwner.role,
        userName: rootOwner.name || 'Root Platform Owner',
        action: 'LEGACY_SUPERADMIN_DEACTIVATED',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({
          targetEmail: email,
          previousRole: user.role,
          revokedSessionsCount: revoked.count,
          reason: 'Transición a Root Platform Owner y fortalecimiento de seguridad de BarberOS'
        }),
        ipAddress: '127.0.0.1'
      }
    });

    console.log(`✅ Cuenta desactivada: ${email}`);
    console.log(`   - isActive: false`);
    console.log(`   - Sesiones activas revocadas: ${revoked.count}`);
    console.log(`   - Registro de auditoría guardado: LEGACY_SUPERADMIN_DEACTIVATED`);
  }

  console.log('\n======================================================');
  console.log('🎉 Operación completada: La plataforma ahora está bajo');
  console.log('   el control exclusivo del Root Platform Owner.');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error desactivando cuentas legacy:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

