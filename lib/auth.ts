import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || '49208ea2f8404a8a7a96bddeaa113677f085d14f82963fac9b4e3d2ec7a109f6'
  return new TextEncoder().encode(secret)
}

const key = getJwtSecretKey()

export interface SessionPayload {
  userId: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'BARBER'
  businessId: string | null
  barberId: string | null
  needsOnboarding?: boolean
  originalOwnerId?: string | null
  superAdminId?: string | null
  expires?: Date
}

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return {
      userId: payload.userId as string,
      role: payload.role as 'SUPER_ADMIN' | 'OWNER' | 'BARBER',
      businessId: (payload.businessId || payload.barbershopId || null) as string | null,
      barberId: (payload.barberId || null) as string | null,
      needsOnboarding: Boolean(payload.needsOnboarding),
      originalOwnerId: (payload.originalOwnerId || null) as string | null,
      superAdminId: (payload.superAdminId || null) as string | null,
      expires: payload.expires ? new Date(payload.expires as string) : undefined
    }
  } catch {
    return null
  }
}

/**
 * Get active session.
 * Supports isolated owner_session, barber_session and superadmin checks.
 */
export async function getSession(preferRole?: 'SUPER_ADMIN' | 'OWNER' | 'BARBER'): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()

    const barberCookie = cookieStore.get('barber_session')?.value
    const ownerCookie = cookieStore.get('owner_session')?.value
    const genericCookie = cookieStore.get('session')?.value

    // 1. Explicit preference for SUPER_ADMIN
    if (preferRole === 'SUPER_ADMIN') {
      if (ownerCookie) {
        const dec = await decrypt(ownerCookie)
        if (dec && dec.role === 'SUPER_ADMIN') return dec
      }
      if (genericCookie) {
        const dec = await decrypt(genericCookie)
        if (dec && dec.role === 'SUPER_ADMIN') return dec
      }
      return null
    }

    // 2. Explicit preference for BARBER
    if (preferRole === 'BARBER') {
      if (barberCookie) {
        const dec = await decrypt(barberCookie)
        if (dec && dec.role === 'BARBER') return dec
      }
      if (genericCookie) {
        const dec = await decrypt(genericCookie)
        if (dec && dec.role === 'BARBER') return dec
      }
      return null
    }

    // 3. Explicit preference for OWNER
    if (preferRole === 'OWNER') {
      if (ownerCookie) {
        const dec = await decrypt(ownerCookie)
        if (dec && (dec.role === 'OWNER' || dec.role === 'SUPER_ADMIN')) return dec
      }
      if (genericCookie) {
        const dec = await decrypt(genericCookie)
        if (dec && (dec.role === 'OWNER' || dec.role === 'SUPER_ADMIN')) return dec
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
      const dec = await decrypt(barberCookie)
      if (dec && dec.role === 'BARBER') return dec
    }

    // Default: Check owner_session first
    if (ownerCookie) {
      const dec = await decrypt(ownerCookie)
      if (dec && (dec.role === 'OWNER' || dec.role === 'SUPER_ADMIN')) return dec
    }

    // Then check barber_session
    if (barberCookie) {
      const dec = await decrypt(barberCookie)
      if (dec && dec.role === 'BARBER') return dec
    }

    // Fallback to legacy 'session' cookie
    if (genericCookie) {
      const dec = await decrypt(genericCookie)
      if (dec) return dec
    }

    return null
  } catch {
    return null
  }
}

/**
 * Create session with role isolation.
 * Owners & Super Admins get saved to owner_session (and session).
 * Barbers get saved to barber_session (NEVER overwriting owner_session).
 */
export async function createSession(
  userId: string, 
  role: 'SUPER_ADMIN' | 'OWNER' | 'BARBER', 
  barberId?: string | null, 
  businessId?: string | null,
  originalOwnerId?: string | null,
  superAdminId?: string | null,
  needsOnboarding?: boolean
) {
  const session = await encrypt({ 
    userId, 
    role, 
    barberId: barberId || null, 
    businessId: businessId || null,
    needsOnboarding: Boolean(needsOnboarding),
    originalOwnerId: originalOwnerId || null,
    superAdminId: superAdminId || null
  })

  const cookieStore = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

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
export async function deleteSession(onlyRole?: 'OWNER' | 'BARBER' | 'SUPER_ADMIN') {
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

    if (onlyRole === 'BARBER') {
      cookieStore.set('barber_session', '', clearOpts)
      cookieStore.delete('barber_session')
      return
    }

    if (onlyRole === 'OWNER' || onlyRole === 'SUPER_ADMIN') {
      cookieStore.set('owner_session', '', clearOpts)
      cookieStore.delete('owner_session')
      cookieStore.set('session', '', clearOpts)
      cookieStore.delete('session')
      return
    }

    // Clear all
    cookieStore.set('owner_session', '', clearOpts)
    cookieStore.set('barber_session', '', clearOpts)
    cookieStore.set('session', '', clearOpts)
    cookieStore.delete('owner_session')
    cookieStore.delete('barber_session')
    cookieStore.delete('session')
  } catch {
    // ignore
  }
}
