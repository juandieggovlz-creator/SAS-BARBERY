import { prisma } from '../lib/prisma'

const SUPER_ADMIN_EMAIL = 'juandieggovlz@gmail.com'

async function executeCleanReset() {
  console.log('========================================================')
  console.log('   BARBEROS — EJECUCIÓN DE LIMPIEZA TRANSACCIONAL      ')
  console.log('========================================================')

  // 1. Localizar y proteger al Super Admin principal
  const masterAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  })

  if (!masterAdmin) {
    throw new Error(`CRÍTICO: No se encontró la cuenta principal de Super Admin (${SUPER_ADMIN_EMAIL}). Abortando operación.`)
  }

  if (masterAdmin.role !== 'ROOT_PLATFORM_OWNER' && masterAdmin.role !== 'SUPER_ADMIN') {
    throw new Error(`CRÍTICO: El usuario ${SUPER_ADMIN_EMAIL} no tiene rol de Super Admin. Abortando.`)
  }

  console.log(`[1/5] Protegiendo Super Admin: ${masterAdmin.name} (${masterAdmin.email}) [ID: ${masterAdmin.id}]`)

  // Desvincular de cualquier negocio previo para evitar que onDelete: Cascade lo afecte
  await prisma.user.update({
    where: { id: masterAdmin.id },
    data: {
      businessId: null,
      companyId: null,
      barberId: null,
      isActive: true,
    },
  })
  console.log('  -> Super Admin desvinculado de sedes anteriores y protegido 100%.')

  // 2. Ejecutar la limpieza dentro de una transacción interactiva
  console.log('[2/5] Ejecutando eliminación en cascada y limpieza relacional...')
  const result = await prisma.$transaction(async (tx) => {
    // A. Eliminar otras cuentas de usuario
    const deletedUsers = await tx.user.deleteMany({
      where: {
        id: { not: masterAdmin.id },
      },
    })

    // B. Eliminar todos los negocios y sedes (cascada limpia)
    const deletedBusinesses = await tx.business.deleteMany({})

    // C. Eliminar todas las compañías
    const deletedCompanies = await tx.company.deleteMany({})

    // D. Eliminar sesiones huérfanas
    const deletedSessions = await tx.session.deleteMany({
      where: {
        userId: { not: masterAdmin.id },
      },
    })

    // E. Eliminar anuncios o mensajes residuales si los hubiere
    const deletedAnnouncements = await tx.platformAnnouncement.deleteMany({})

    // F. Registrar en AuditLog la ejecución
    await tx.auditLog.create({
      data: {
        userId: masterAdmin.id,
        action: 'PLATFORM_PRODUCTION_CLEANUP',
        entity: 'PLATFORM',
        details: JSON.stringify({
          deletedUsers: deletedUsers.count,
          deletedBusinesses: deletedBusinesses.count,
          deletedCompanies: deletedCompanies.count,
          deletedSessions: deletedSessions.count,
          executedAt: new Date().toISOString(),
          preservedAdmin: masterAdmin.email,
        }),
      },
    })

    return {
      deletedUsers: deletedUsers.count,
      deletedBusinesses: deletedBusinesses.count,
      deletedCompanies: deletedCompanies.count,
      deletedSessions: deletedSessions.count,
      deletedAnnouncements: deletedAnnouncements.count,
    }
  })

  console.log('  -> Registros eliminados:', result)

  // 3. Verificación de integridad post-limpieza
  console.log('[3/5] Verificando estado resultante de la base de datos...')
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })
  const remainingBusinesses = await prisma.business.count()
  const remainingCompanies = await prisma.company.count()
  const remainingAppointments = await prisma.appointment.count()
  const remainingClients = await prisma.client.count()
  const remainingBarbers = await prisma.barber.count()
  const remainingPayments = await prisma.payment.count()
  const remainingPlans = await prisma.plan.findMany({
    select: { id: true, slug: true, name: true, price: true },
    orderBy: { price: 'asc' },
  })

  console.log('\n================ ESTADO FINAL DE LA BASE DE DATOS ================')
  console.log('Usuarios en sistema (DEBE SER EXACTAMENTE 1):', remainingUsers.length)
  console.log(JSON.stringify(remainingUsers, null, 2))
  console.log('Negocios:', remainingBusinesses)
  console.log('Compañías:', remainingCompanies)
  console.log('Citas / Reservas:', remainingAppointments)
  console.log('Clientes:', remainingClients)
  console.log('Barberos:', remainingBarbers)
  console.log('Pagos:', remainingPayments)
  console.log('Planes oficiales conservados:', remainingPlans.length)
  console.log(JSON.stringify(remainingPlans, null, 2))

  if (remainingUsers.length !== 1 || remainingUsers[0].email !== SUPER_ADMIN_EMAIL) {
    throw new Error('FALLO DE INTEGRIDAD: El usuario restante no coincide con el Super Admin esperado.')
  }

  if (remainingBusinesses !== 0) {
    throw new Error('FALLO DE INTEGRIDAD: Aún existen negocios residuales.')
  }

  console.log('\n✅ LIMPIEZA TRANSACCIONAL COMPLETADA EXITOSAMENTE Y VALIDADA AL 100%.')
  await prisma.$disconnect()
}

executeCleanReset().catch(e => {
  console.error('ERROR EN LIMPIEZA:', e)
  process.exit(1)
})
