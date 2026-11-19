import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'
import { validateSession } from '@/lib/session'

const DEFAULT_JWT_SECRET = '49208ea2f8404a8a7a96bddeaa113677f085d14f82963fac9b4e3d2ec7a109f6'

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET
  return new TextEncoder().encode(secret)
}

const key = getJwtSecretKey()

export type AppRole = 'ROOT_PLATFORM_OWNER' | 'SUPER_ADMIN' | 'OWNER' | 'BRANCH_ADMIN' | 'BARBER'

export function isSuperAdminRole(role?: string | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ROOT_PLATFORM_OWNER'
}

export interface SessionPayload {
  userId: string
  role: AppRole
  businessId: string | null
  companyId?: string | null
  barberId: string | null
  needsOnboarding?: boolean
  originalOwnerId?: string | null
  superAdminId?: string | null
  impersonationReason?: string | null
  impersonationExpiresAt?: string | null
  sessionId?: string | null
  mfaPending?: boolean
  expires?: Date
}

export async function encrypt(payload: Record<string, unknown>, expirationTime = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return {
      userId: payload.userId as string,
      role: payload.role as AppRole,
      businessId: (payload.businessId || payload.barbershopId || null) as string | null,
      companyId: (payload.companyId || null) as string | null,
      barberId: (payload.barberId || null) as string | null,
      needsOnboarding: Boolean(payload.needsOnboarding),
      originalOwnerId: (payload.originalOwnerId || null) as string | null,
      superAdminId: (payload.superAdminId || null) as string | null,
      impersonationReason: (payload.impersonationReason || null) as string | null,
      impersonationExpiresAt: (payload.impersonationExpiresAt || null) as string | null,
      sessionId: (payload.sessionId || null) as string | null,
      mfaPending: Boolean(payload.mfaPending),
      expires: payload.expires ? new Date(payload.expires as string) : undefined
    }
  } catch {
    return null
  }
}

/**
 * Validador interno con verificación de sesión persistente en base de datos
 */
async function verifyActiveSession(payload: SessionPayload | null): Promise<SessionPayload | null> {
  if (!payload) return null
  if (payload.mfaPending) return null // No otorgar sesión final si está pendiente de 2FA

  // Si es una sesión temporal de soporte administrativo, verificar expiración estricta
  if (payload.superAdminId && payload.impersonationExpiresAt) {
    if (new Date(payload.impersonationExpiresAt).getTime() <= Date.now()) {
      return null
    }
  }

  // Si tiene sessionId, validar existencia y no revocación en base de datos
  if (payload.sessionId) {
    const check = await validateSession(payload.sessionId)
    if (!check.valid || !check.user) {
      return null
    }
    // Asegurar que el rol coincida con el estado actual en la base de datos (excepto durante soporte temporal)
    if (!payload.superAdminId && !payload.originalOwnerId) {
      payload.role = check.user.role as AppRole
    }
  }

  return payload
}

/**
 * Get active session.
 * Supports isolated owner_session, barber_session and superadmin checks.
 */
export async function getSession(preferRole?: AppRole): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()

    const barberCookie = cookieStore.get('barber_session')?.value
    const ownerCookie = cookieStore.get('owner_session')?.value
    const genericCookie = cookieStore.get('session')?.value

    // 1. Explicit preference for SUPER_ADMIN o ROOT_PLATFORM_OWNER
    if (preferRole === 'SUPER_ADMIN' || preferRole === 'ROOT_PLATFORM_OWNER') {
      if (ownerCookie) {
        const dec = await verifyActiveSession(await decrypt(ownerCookie))
        if (dec && (dec.role === 'SUPER_ADMIN' || dec.role === 'ROOT_PLATFORM_OWNER')) return dec
      }
      if (genericCookie) {
        const dec = await verifyActiveSession(await decrypt(genericCookie))
        if (dec && (dec.role === 'SUPER_ADMIN' || dec.role === 'ROOT_PLATFORM_OWNER')) return dec
      }
      return null
    }

    // 2. Explicit preference for BARBER
    if (preferRole === 'BARBER') {
      if (barberCookie) {
        const dec = await verifyActiveSession(await decrypt(barberCookie))
        if (dec && dec.role === 'BARBER') return dec
      }
      if (genericCookie) {
        const dec = await verifyActiveSession(await decrypt(genericCookie))
        if (dec && dec.role === 'BARBER') return dec
      }
      return null
    }

    // 3. Explicit preference for OWNER or BRANCH_ADMIN
    if (preferRole === 'OWNER' || preferRole === 'BRANCH_ADMIN') {
      if (ownerCookie) {
        const dec = await verifyActiveSession(await decrypt(ownerCookie))
        if (dec && (dec.role === 'OWNER' || dec.role === 'BRANCH_ADMIN' || dec.role === 'SUPER_ADMIN' || dec.role === 'ROOT_PLATFORM_OWNER')) return dec
      }
      if (genericCookie) {
        const dec = await verifyActiveSession(await decrypt(genericCookie))
        if (dec && (dec.role === 'OWNER' || dec.role === 'BRANCH_ADMIN' || dec.role === 'SUPER_ADMIN' || dec.role === 'ROOT_PLATFORM_OWNER')) return dec
      }
      return null
    }

    // 4. Auto-detect context from HTTP referer header
    let isBarberContext = false
    try {
      const headerList = await headers()
      const referer = headerList.get('referer') || ''
      if (referer.includes('/barber')) {
        isBarberContext = true
      }
    } catch {
      // ignore
    }

    // In a barber page context, return barber_session
    if (isBarberContext && barberCookie) {
      const dec = await verifyActiveSession(await decrypt(barberCookie))
      if (dec && dec.role === 'BARBER') return dec
    }

    // Default: Check owner_session first
    if (ownerCookie) {
      const dec = await verifyActiveSession(await decrypt(ownerCookie))
      if (dec && (dec.role === 'OWNER' || dec.role === 'BRANCH_ADMIN' || dec.role === 'SUPER_ADMIN' || dec.role === 'ROOT_PLATFORM_OWNER')) return dec
    }

    // Then check barber_session
    if (barberCookie) {
      const dec = await verifyActiveSession(await decrypt(barberCookie))
      if (dec && dec.role === 'BARBER') return dec
    }

    // Fallback to legacy 'session' cookie
    if (genericCookie) {
      const dec = await verifyActiveSession(await decrypt(genericCookie))
      if (dec) return dec
    }

    return null
  } catch {
    return null
  }
}

/**
 * Create session with role isolation and persistent DB binding.
 * Owners, Super Admins & Root Platform Owner get saved to owner_session (and session).
 * Barbers get saved to barber_session (NEVER overwriting owner_session).
 */
export async function createSession(
  userId: string, 
  role: AppRole, 
  barberId?: string | null, 
  businessId?: string | null,
  originalOwnerId?: string | null,
  superAdminId?: string | null,
  needsOnboarding?: boolean,
  companyId?: string | null,
  sessionId?: string | null,
  mfaPending?: boolean,
  impersonationReason?: string | null
) {
  const isSupportSession = Boolean(superAdminId)
  const supportExpiresAt = isSupportSession
    ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    : null

  const session = await encrypt(
    { 
      userId, 
      role, 
      barberId: barberId || null, 
      businessId: businessId || null,
      companyId: companyId || null,
      needsOnboarding: Boolean(needsOnboarding),
      originalOwnerId: originalOwnerId || null,
      superAdminId: superAdminId || null,
      impersonationReason: impersonationReason || null,
      impersonationExpiresAt: supportExpiresAt,
      sessionId: sessionId || null,
      mfaPending: Boolean(mfaPending)
    },
    isSupportSession ? '2h' : '7d'
  )

  const cookieStore = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(isSupportSession ? { maxAge: 2 * 60 * 60 } : {})
  }

  if (mfaPending) {
    // Cookie de corta duración (5 min) exclusivamente para completar el desafío de segundo factor
    cookieStore.set('mfa_pending_session', session, {
      ...cookieOpts,
      maxAge: 5 * 60
    })
    return session
  }

  // Si se completa el login exitoso, limpiar cualquier cookie temporal de 2FA
  cookieStore.delete('mfa_pending_session')

  if (role === 'BARBER') {
    cookieStore.set('barber_session', session, cookieOpts)
  } else {
    cookieStore.set('owner_session', session, cookieOpts)
    cookieStore.set('session', session, cookieOpts)
  }

  return session
}

/**
 * Delete session.
 * If onlyRole is specified, only that role's cookie is cleared.
 */
export async function deleteSession(onlyRole?: AppRole) {
  try {
    const cookieStore = await cookies()
    const clearOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: new Date(0),
      maxAge: 0,
      path: '/',
    }

    // Revocar sesión en DB si la cookie contiene un sessionId válido
    const currentSessionCookie = cookieStore.get('owner_session')?.value || cookieStore.get('session')?.value
    if (currentSessionCookie) {
      const dec = await decrypt(currentSessionCookie)
      if (dec && dec.sessionId) {
        const { revokeSession } = await import('@/lib/session')
        await revokeSession(dec.sessionId, dec.userId).catch(() => {})
      }
    }

    if (onlyRole === 'BARBER') {
      cookieStore.set('barber_session', '', clearOpts)
      cookieStore.delete('barber_session')
      return
    }

    if (onlyRole === 'OWNER' || onlyRole === 'BRANCH_ADMIN' || onlyRole === 'SUPER_ADMIN' || onlyRole === 'ROOT_PLATFORM_OWNER') {
      cookieStore.set('owner_session', '', clearOpts)
      cookieStore.delete('owner_session')
      cookieStore.set('session', '', clearOpts)
      cookieStore.delete('session')
      cookieStore.delete('mfa_pending_session')
      return
    }

    // Clear all
    cookieStore.set('owner_session', '', clearOpts)
    cookieStore.set('barber_session', '', clearOpts)
    cookieStore.set('session', '', clearOpts)
    cookieStore.delete('owner_session')
    cookieStore.delete('barber_session')
    cookieStore.delete('session')
    cookieStore.delete('mfa_pending_session')
  } catch {
    // ignore
  }
}

/**
 * Genera un token de restablecimiento de contraseña firmado criptográficamente
 * con caducidad estricta de 15 minutos e invalidación automática tras el primer cambio.
 */
export async function createPasswordResetToken(userId: string, currentPasswordHash: string | null): Promise<string> {
  const pwhash = (currentPasswordHash || '').slice(-10)
  return await new SignJWT({
    userId,
    pwhash,
    purpose: 'password_reset',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(key)
}

/**
 * Valida un token de restablecimiento de contraseña.
 */
export async function verifyPasswordResetToken(token: string): Promise<{ userId: string; pwhash: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })

    if (payload.purpose !== 'password_reset' || !payload.userId) {
      return null
    }

    return {
      userId: payload.userId as string,
      pwhash: (payload.pwhash as string) || '',
    }
  } catch {
    return null
  }
}
