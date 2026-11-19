import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { decrypt, createSession } from '@/lib/auth'
import { createPersistentSession } from '@/lib/session'
import { decryptData } from '@/lib/crypto'
import { verifyTotpCode } from '@/lib/totp'
import { getClientIp, rateLimitDB } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const mfaPendingCookie = cookieStore.get('mfa_pending_session')?.value

    if (!mfaPendingCookie) {
      return NextResponse.json(
        { error: 'No hay ninguna solicitud de autenticación de segundo factor activa o ha expirado.' },
        { status: 401 }
      )
    }

    const payload = await decrypt(mfaPendingCookie)
    if (!payload || !payload.userId || !payload.mfaPending) {
      return NextResponse.json(
        { error: 'Sesión de desafío MFA inválida o expirada.' },
        { status: 401 }
      )
    }

    const ip = getClientIp(request)
    // Rate limit: máx 5 intentos de verificación MFA cada 10 minutos
    const limitCheck = await rateLimitDB(`mfa:verify:${ip}:${payload.userId}`, { limit: 5, windowSeconds: 10 * 60 })
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: `Demasiados intentos de verificación. Reintenta en ${limitCheck.resetSeconds} segundos.` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { type, code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código de verificación requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 })
    }

    let verified = false
    let verificationMethod = ''

    // ── 1. VERIFICACIÓN MEDIANTE TOTP (Google/Microsoft Authenticator) ──
    if (type === 'totp' || (!type && code.trim().length === 6 && /^\d{6}$/.test(code.trim()))) {
      if (!user.mfaSecret) {
        return NextResponse.json(
          { error: 'Esta cuenta aún no tiene configurado un secreto TOTP. Utiliza tus códigos de recuperación.' },
          { status: 400 }
        )
      }

      let secretBase32: string
      try {
        secretBase32 = decryptData(user.mfaSecret)
      } catch {
        return NextResponse.json({ error: 'Error al descifrar el secreto de seguridad.' }, { status: 500 })
      }

      const totpResult = verifyTotpCode(secretBase32, code, 1)

      if (!totpResult.valid || totpResult.matchedStep === null) {
        return NextResponse.json(
          { error: 'Código de 6 dígitos incorrecto o expirado. Verifica la hora de tu dispositivo.' },
          { status: 401 }
        )
      }

      // Protección contra repetición de códigos (Replay Protection)
      const currentStep = Math.floor(Date.now() / 1000 / 30)
      if (user.lastMfaUsedAt) {
        const lastStep = Math.floor(user.lastMfaUsedAt.getTime() / 1000 / 30)
        if (totpResult.matchedStep <= lastStep) {
          return NextResponse.json(
            { error: 'Este código de seguridad ya fue utilizado. Espera al siguiente código en tu aplicación.' },
            { status: 401 }
          )
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastMfaUsedAt: new Date() }
      })

      verified = true
      verificationMethod = 'TOTP'
    }

    // ── 2. VERIFICACIÓN MEDIANTE CÓDIGO DE RECUPERACIÓN DE UN SOLO USO ──
    if (type === 'recovery_code' || (!verified && code.includes('-'))) {
      const cleanCode = code.trim().toUpperCase()
      const recoveryCodes = await prisma.recoveryCode.findMany({
        where: { userId: user.id, usedAt: null }
      })

      let matchedCodeId: string | null = null

      for (const item of recoveryCodes) {
        const isMatch = await bcrypt.compare(cleanCode, item.codeHash)
        if (isMatch) {
          matchedCodeId = item.id
          break
        }
      }

      if (!matchedCodeId) {
        return NextResponse.json(
          { error: 'Código de recuperación inválido o ya utilizado previamente.' },
          { status: 401 }
        )
      }

      // Marcar código como consumido (Single-Use Enforcement)
      await prisma.recoveryCode.update({
        where: { id: matchedCodeId },
        data: { usedAt: new Date() }
      })

      verified = true
      verificationMethod = 'RECOVERY_CODE'

      await recordAuditLog({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'MFA_RECOVERY_CODE_CONSUMED',
        entity: 'User',
        entityId: user.id,
        details: { codeId: matchedCodeId, ip }
      })
    }

    if (!verified) {
      return NextResponse.json({ error: 'No se pudo verificar el código suministrado.' }, { status: 401 })
    }

    // ── DESAFÍO EXITOSO: EMITIR SESIÓN PERSISTENTE DEFINITIVA ──
    const userAgent = request.headers.get('user-agent')
    const persistent = await createPersistentSession({
      userId: user.id,
      ipAddress: ip,
      userAgent
    })

    // Establecer sesión real (mfaPending = false)
    const sessionJwt = await createSession(
      user.id,
      user.role,
      user.barberId || null,
      user.businessId || null,
      null,
      null,
      false,
      user.companyId || null,
      persistent.sessionId,
      false
    )

    // Eliminar la cookie temporal del desafío
    cookieStore.delete('mfa_pending_session')

    await recordAuditLog({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'MFA_LOGIN_SUCCESS',
      entity: 'Session',
      entityId: persistent.sessionId,
      details: { method: verificationMethod, ip }
    })

    let targetPath = '/dashboard'
    if (user.role === 'ROOT_PLATFORM_OWNER' || user.role === 'SUPER_ADMIN') {
      targetPath = '/superadmin/dashboard'
    } else if (user.role === 'BARBER') {
      targetPath = '/barber/dashboard'
    }

    const response = NextResponse.json({
      success: true,
      redirect: targetPath,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días de persistencia
    }

    response.cookies.delete('mfa_pending_session')
    response.cookies.set('owner_session', sessionJwt, cookieOpts)
    response.cookies.set('session', sessionJwt, cookieOpts)

    return response
  } catch (error: any) {
    console.error('[MFA Verify Error]:', error)
    return NextResponse.json({ error: error?.message || 'Error del servidor al verificar MFA' }, { status: 500 })
  }
}

