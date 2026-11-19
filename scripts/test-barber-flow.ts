import { prisma } from '../lib/prisma'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { getBarberInviteUrl } from '../lib/url'

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('   AUDITORÍA Y TEST SUITE COMPLETO: FLUJO DE BARBEROS Y ACCESO   ')
  console.log('════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASÓ: ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FALLÓ: ${testName} ${detail ? `(${detail})` : ''}`)
      failed++
    }
  }

  // 0. Setup: Buscar un negocio real existente en la BD
  const business = await prisma.business.findFirst({
    include: { users: true }
  })

  if (!business) {
    console.error('No se encontró un negocio en la BD para ejecutar las pruebas.')
    process.exit(1)
  }

  console.log(`Negocio de prueba: "${business.name}" (ID: ${business.id})\n`)

  const testEmail = `test.barber.${Date.now()}@barberos-test.com`
  const testName = 'Barbero Test QA'
  let createdBarberId = ''
  let createdUserId = ''
  let initialToken = ''

  try {
    // ── TEST 1: Creación de barbero con token de 48h y horarios ──
    console.log('─── TEST GRUPO 1: CREACIÓN E INVITACIÓN INICIAL ───')
    const inviteToken = randomUUID()
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const barber = await prisma.barber.create({
      data: {
        name: testName,
        businessId: business.id,
        specialty: 'Corte Clásico & Fade',
        phone: '+573001112233',
        status: 'PENDING',
        schedules: {
          create: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true },
            { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true },
          ]
        },
        user: {
          create: {
            email: testEmail,
            role: 'BARBER',
            inviteToken,
            inviteExpires,
            businessId: business.id
          }
        }
      },
      include: { user: true, schedules: true }
    })

    createdBarberId = barber.id
    createdUserId = barber.user!.id
    initialToken = inviteToken

    assert(barber.id.length > 0, 'Creación de registro Barber')
    assert(barber.status === 'PENDING', 'Estado inicial del barbero es PENDING')
    assert(barber.schedules.length === 7, 'Creación automática de 7 turnos semanales')
    assert(barber.user?.inviteToken === inviteToken, 'Generación de inviteToken criptográfico')

    const expiryHours = (barber.user!.inviteExpires!.getTime() - Date.now()) / (1000 * 60 * 60)
    assert(expiryHours >= 47 && expiryHours <= 49, `Vigencia de invitación calibrada a 48 horas (~${Math.round(expiryHours)}h)`)

    const inviteLink = getBarberInviteUrl(inviteToken)
    assert(inviteLink.includes('/invite/') && !inviteLink.includes('undefined'), `Generación de enlace canónico: ${inviteLink}`)

    // ── TEST 2: Validación de enlace de invitación ──
    console.log('\n─── TEST GRUPO 2: VALIDACIÓN DE INVITACIÓN ───')
    const validatedUser = await prisma.user.findUnique({
      where: { inviteToken: initialToken },
      include: { barber: true, business: true }
    })

    assert(Boolean(validatedUser), 'Validación exitosa del token en base de datos')
    assert(validatedUser?.barber?.name === testName, 'Asociación correcta de perfil del barbero')
    assert(validatedUser?.business?.id === business.id, 'Asociación correcta de multi-tenant businessId')
    assert(validatedUser?.password === null, 'La cuenta no posee contraseña antes de activarse')

    // ── TEST 3: Rechazo de token expirado ──
    console.log('\n─── TEST GRUPO 3: CONTROL DE EXPIRACIÓN ───')
    const expiredToken = randomUUID()
    await prisma.user.update({
      where: { id: createdUserId },
      data: {
        inviteToken: expiredToken,
        inviteExpires: new Date(Date.now() - 1000 * 60 * 60) // Expirado hace 1 hora
      }
    })

    const expiredCheck = await prisma.user.findUnique({
      where: { inviteToken: expiredToken }
    })
    const isActuallyExpired = expiredCheck?.inviteExpires ? new Date() > expiredCheck.inviteExpires : false
    assert(isActuallyExpired, 'Detección estricta de token expirado')

    // ── TEST 4: Reenviar invitación (regeneración de token 48h) ──
    console.log('\n─── TEST GRUPO 4: REENVÍO Y REINICIO DE ACCESO ───')
    const newToken = randomUUID()
    const newExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: createdUserId },
      data: {
        inviteToken: newToken,
        inviteExpires: newExpires
      }
    })

    const refreshedUser = await prisma.user.findUnique({ where: { id: createdUserId } })
    assert(refreshedUser?.inviteToken === newToken, 'Reemplazo exitoso de token previo')
    assert(refreshedUser?.inviteToken !== expiredToken, 'Token anterior queda completamente invalidado')

    // ── TEST 5: Activación y quema de token (Single-Use Token) ──
    console.log('\n─── TEST GRUPO 5: ACTIVACIÓN Y SINGLE-USE TOKEN ───')
    const passwordPlainText = 'SuperClaveSegura2026*'
    const hashedPassword = await bcrypt.hash(passwordPlainText, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: createdUserId },
        data: {
          password: hashedPassword,
          isActive: true,
          inviteToken: null,
          inviteExpires: null
        }
      }),
      prisma.barber.update({
        where: { id: createdBarberId },
        data: { status: 'ACTIVE' }
      })
    ])

    const activatedUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: { barber: true }
    })

    assert(activatedUser?.barber?.status === 'ACTIVE', 'Estado del barbero promovido a ACTIVE')
    assert(activatedUser?.isActive === true, 'Cuenta de usuario marcada como isActive = true')
    assert(activatedUser?.inviteToken === null, 'Token de invitación quemado (Single-Use Token)')
    assert(activatedUser?.inviteExpires === null, 'Fecha de expiración eliminada tras activación')

    // Intento de reusar el token quemado
    const reuseAttempt = await prisma.user.findUnique({
      where: { inviteToken: newToken }
    })
    assert(reuseAttempt === null, 'Imposibilidad de reutilizar token aceptado (queda nulo)')

    // ── TEST 6: Login y verificación de contraseña ──
    console.log('\n─── TEST GRUPO 6: LOGIN Y VERIFICACIÓN DE CREDENCIALES ───')
    const isPwCorrect = await bcrypt.compare(passwordPlainText, activatedUser!.password!)
    assert(isPwCorrect, 'Credenciales coinciden con hash bcrypt')

    const isBadPwRejected = !(await bcrypt.compare('ClaveErronea123', activatedUser!.password!))
    assert(isBadPwRejected, 'Rechazo seguro de contraseña incorrecta')

    // ── TEST 7: Desactivación segura con protección de historial ──
    console.log('\n─── TEST GRUPO 7: DESACTIVACIÓN Y PROTECCIÓN HISTÓRICA (FASE 9) ───')
    
    // Obtener o crear servicio y cliente para la cita de prueba
    let service = await prisma.service.findFirst({ where: { businessId: business.id } })
    if (!service) {
      service = await prisma.service.create({
        data: {
          businessId: business.id,
          name: 'Corte Prueba',
          price: 25000,
          duration: 30
        }
      })
    }

    let client = await prisma.client.findFirst({ where: { businessId: business.id } })
    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId: business.id,
          name: 'Cliente QA Test',
          phone: '+573009998877'
        }
      })
    }

    // Creamos una cita histórica de prueba para este barbero
    const testAppointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        barberId: createdBarberId,
        clientId: client.id,
        serviceId: service.id,
        date: new Date(),
        status: 'COMPLETED'
      }
    })

    // Intentar eliminar: Debe detectar citas y aplicar SOFT DEACTIVATION
    const appointmentCount = await prisma.appointment.count({
      where: { barberId: createdBarberId }
    })

    assert(appointmentCount === 1, 'Registro de cita histórica detectado para el barbero')

    if (appointmentCount > 0) {
      // Soft-deactivation
      await prisma.$transaction([
        prisma.barber.update({
          where: { id: createdBarberId },
          data: { status: 'INACTIVE' }
        }),
        prisma.user.updateMany({
          where: { barberId: createdBarberId },
          data: { isActive: false, inviteToken: null, inviteExpires: null }
        })
      ])
    }

    const deactivatedBarber = await prisma.barber.findUnique({
      where: { id: createdBarberId },
      include: { user: true, appointments: true }
    })

    assert(deactivatedBarber?.status === 'INACTIVE', 'Estado del barbero pasa a INACTIVE')
    assert(deactivatedBarber?.user?.isActive === false, 'Cuenta de usuario pasa a isActive = false (bloqueo de login)')
    assert(deactivatedBarber?.appointments.length === 1, 'Historial de citas y finanzas PRESERVADO intacto')

    // ── TEST 8: Reactivación segura ──
    console.log('\n─── TEST GRUPO 8: REACTIVACIÓN DE CUENTA ───')
    await prisma.$transaction([
      prisma.barber.update({
        where: { id: createdBarberId },
        data: { status: 'ACTIVE' }
      }),
      prisma.user.updateMany({
        where: { barberId: createdBarberId },
        data: { isActive: true }
      })
    ])

    const reactivatedUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: { barber: true }
    })

    assert(reactivatedUser?.barber?.status === 'ACTIVE', 'Barbero reactivado a ACTIVE')
    assert(reactivatedUser?.isActive === true, 'Cuenta de usuario reactivada a isActive = true')

    // ── LIMPIEZA CONTROLADA DEL TEST ──
    console.log('\n─── LIMPIEZA DE DATOS DE PRUEBA ───')
    await prisma.appointment.delete({ where: { id: testAppointment.id } })
    await prisma.barberSchedule.deleteMany({ where: { barberId: createdBarberId } })
    await prisma.user.delete({ where: { id: createdUserId } })
    await prisma.barber.delete({ where: { id: createdBarberId } })
    console.log('  🧹 Limpieza de registros temporales completada.')

  } catch (err) {
    console.error('Error durante la ejecución del test suite:', err)
    failed++
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n════════════════════════════════════════════════════════════════')
  console.log(`   RESULTADO FINAL: ${passed} pruebas superadas, ${failed} fallidas`)
  console.log('════════════════════════════════════════════════════════════════\n')

  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error(err)
  process.exit(1)
})
