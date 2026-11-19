import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { verifyTotpCode } from '@/lib/totp'
import { createPersistentSession } from '@/lib/session'
import { createSession } from '@/lib/auth'
import { rateLimitDB } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET requerido')
  return new TextEncoder().encode(secret)
}

const LEGACY_EMAILS = [
  'superadmin@barberos.com',
  'admin@barberos.co'
]

interface MfaSetupPayload {
  purpose: string
  email: string
  passwordHash: string
  encryptedSecret: string
  totpSecret: string
  hashedCodes: string[]
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de finalización de setup. Por favor utiliza la interfaz en http://localhost:3000/setup/owner',
    interfaceUrl: '/setup/owner'
  })
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'

    const rateCheck = await rateLimitDB(`setup_complete:${ip}`, { limit: 5, windowSeconds: 300 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { mfaSetupToken, totpCode, recoveryCodesConfirmed } = body

    if (!recoveryCodesConfirmed) {
      return NextResponse.json(
        { error: 'Debes confirmar que has guardado tus códigos de recuperación.' },
        { status: 400 }
      )
    }

    if (!totpCode || typeof totpCode !== 'string' || !/^\d{6}$/.test(totpCode.trim())) {
      return NextResponse.json(
        { error: 'Debes ingresar el código numérico de 6 dígitos de tu app autenticadora.' },
        { status: 400 }
      )
    }

    // 1. Verificar y decodificar el mfaSetupToken
    let payload: MfaSetupPayload
    try {
      const res = await jwtVerify(mfaSetupToken, getJwtSecret(), { algorithms: ['HS256'] })
      payload = res.payload as unknown as MfaSetupPayload
    } catch {
      return NextResponse.json(
        { error: 'La sesión de configuración ha expirado. Inicia el proceso nuevamente.' },
        { status: 401 }
      )
    }

    if (payload.purpose !== 'root_setup_mfa_pending') {
      return NextResponse.json({ error: 'Token no válido para completar configuración' }, { status: 403 })
    }

    // 2. Verificar criptográficamente el código TOTP con el secreto generado
    const totpResult = verifyTotpCode(payload.totpSecret, totpCode.trim(), 1)
    if (!totpResult.valid) {
      return NextResponse.json(
        { error: 'Código de 6 dígitos inválido o expirado. Revisa la hora de tu app autenticadora.' },
        { status: 400 }
      )
    }

    // 3. Transacción atómica en PostgreSQL:
    //    - Previene condiciones de carrera
    //    - Asigna ROOT_PLATFORM_OWNER a juandieggovlz@gmail.com
    //    - Desactiva las cuentas superadmin anteriores
    //    - Inserta los 8 recovery codes
    const result = await prisma.$transaction(async (tx) => {
      // Doble verificación: comprobar que no exista otro Root Owner completado
      const existingOwner = await tx.user.findFirst({
        where: {
          role: 'ROOT_PLATFORM_OWNER',
          mfaConfirmedAt: { not: null },
          isActive: true
        }
      })

      if (existingOwner && existingOwner.email !== payload.email) {
        throw new Error('Conflicto: Ya existe un Propietario Raíz activo en la plataforma.')
      }

      // Upsert o actualización del Root Owner
      const owner = await tx.user.upsert({
        where: { email: payload.email },
        update: {
          role: 'ROOT_PLATFORM_OWNER',
          password: payload.passwordHash,
          isActive: true,
          mfaEnabled: true,
          mfaSecret: payload.encryptedSecret,
          mfaConfirmedAt: new Date(),
          lastMfaUsedAt: new Date()
        },
        create: {
          email: payload.email,
          name: 'Juan Diego (Platform Owner)',
          role: 'ROOT_PLATFORM_OWNER',
          password: payload.passwordHash,
          isActive: true,
          mfaEnabled: true,
          mfaSecret: payload.encryptedSecret,
          mfaConfirmedAt: new Date(),
          lastMfaUsedAt: new Date()
        }
      })

      // Limpiar y guardar los 8 códigos de recuperación
      await tx.recoveryCode.deleteMany({
        where: { userId: owner.id }
      })

      for (const hash of payload.hashedCodes) {
        await tx.recoveryCode.create({
          data: {
            userId: owner.id,
            codeHash: hash
          }
        })
      }

      // Desactivar cuentas legacy
      for (const legacyEmail of LEGACY_EMAILS) {
        const legacyUser = await tx.user.findUnique({ where: { email: legacyEmail } })
        if (legacyUser) {
          await tx.user.update({
            where: { id: legacyUser.id },
            data: { isActive: false }
          })

          await tx.session.updateMany({
            where: { userId: legacyUser.id, isRevoked: false },
            data: { isRevoked: true }
          })

          await tx.auditLog.create({
            data: {
              userId: owner.id,
              userRole: owner.role,
              userName: owner.name || 'Root Platform Owner',
              action: 'LEGACY_SUPERADMIN_DEACTIVATED',
              entity: 'User',
              entityId: legacyUser.id,
              details: JSON.stringify({
                deactivatedEmail: legacyEmail,
                reason: 'Retiro definitivo al completar inicialización de ROOT_PLATFORM_OWNER'
              }),
              ipAddress: ip
            }
          })
        }
      }

      // Registrar auditoría de inicialización completada
      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userRole: owner.role,
          userName: owner.name || 'Root Platform Owner',
          action: 'ROOT_PLATFORM_OWNER_SETUP_COMPLETED',
          entity: 'User',
          entityId: owner.id,
          details: 'Inicialización de seguridad completa: contraseña personalizada, TOTP activo y 8 recovery codes.',
          ipAddress: ip
        }
      })

      return owner
    })

    // 4. Crear sesión persistente en PostgreSQL para el nuevo propietario
    const userAgent = request.headers.get('user-agent') || undefined
    const persistentSession = await createPersistentSession({
      userId: result.id,
      ipAddress: ip,
      userAgent
    })

    // 5. Emitir sesión de autenticación oficial
    await createSession(
      result.id,
      'ROOT_PLATFORM_OWNER',
      null,
      null,
      null,
      null,
      false,
      null,
      persistentSession.sessionId,
      false
    )

    return NextResponse.json({
      success: true,
      message: 'Cuenta de Propietario Raíz inicializada exitosamente.',
      redirect: '/superadmin/dashboard'
    })
  } catch (error: unknown) {
    console.error('Error completing root setup:', error)
    const msg = error instanceof Error ? error.message : 'Error al completar la inicialización'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
