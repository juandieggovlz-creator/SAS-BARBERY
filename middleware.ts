import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. PUBLIC ROUTES (accessible without credentials) ────────────────────
  const isPublicPage = 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/barber/access') ||
    pathname.startsWith('/b/') ||
    pathname.startsWith('/reserve') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/privacidad')

  if (isPublicPage) {
    return NextResponse.next()
  }

  // Public API endpoints
  const publicApiPaths = [
    '/api/auth/login', 
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/callback/google',
    '/api/auth/register-business',
    '/api/auth/register-barber', 
    '/api/auth/validate-invite',
    '/api/auth/barber-access',
    '/api/barbers/invite',
    '/api/public',
    '/api/user/accent',
    '/api/webhooks'
  ]
  const isPublicApi = pathname.startsWith('/api') && publicApiPaths.some(p => pathname.startsWith(p))

  if (isPublicApi) {
    return NextResponse.next()
  }

  // ── 2. EXTRACT AND DECRYPT SESSIONS ─────────────────────────────────────
  const ownerCookie = request.cookies.get('owner_session')?.value
  const barberCookie = request.cookies.get('barber_session')?.value
  const genericCookie = request.cookies.get('session')?.value

  const ownerPayload = ownerCookie ? await decrypt(ownerCookie) : null
  const barberPayload = barberCookie ? await decrypt(barberCookie) : null
  const genericPayload = genericCookie ? await decrypt(genericCookie) : null

  // Super Admin credentials
  const isSuperAdmin = Boolean(
    (ownerPayload && ownerPayload.role === 'SUPER_ADMIN') ||
    (genericPayload && genericPayload.role === 'SUPER_ADMIN')
  )

  // Owner credentials
  const hasOwnerAuth = Boolean(
    (ownerPayload && (ownerPayload.role === 'OWNER' || ownerPayload.role === 'SUPER_ADMIN')) ||
    (genericPayload && (genericPayload.role === 'OWNER' || genericPayload.role === 'SUPER_ADMIN'))
  )

  // Barber credentials
  const hasBarberAuth = Boolean(
    (barberPayload && barberPayload.role === 'BARBER') ||
    (genericPayload && genericPayload.role === 'BARBER')
  )

  const isSuperAdminRoute = pathname.startsWith('/superadmin')
  const isSuperAdminApi = pathname.startsWith('/api/superadmin')
  const isBarberRoute = pathname.startsWith('/barber')
  const isBarberApi = pathname.startsWith('/api/barber')

  // ── 3. SUPER ADMIN PLATFORM (SaaS Dashboard & Management) ───────────────
  if (isSuperAdminRoute || isSuperAdminApi) {
    if (isSuperAdmin) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de Super Administrador de BarberOS.' },
        { status: 403 }
      )
    }

    const loginUrl = new URL('/login?error=superadmin_required', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // ── 4. BARBER DASHBOARD & BARBER APIS ───────────────────────────────────
  if (isBarberRoute || isBarberApi) {
    if (hasBarberAuth || hasOwnerAuth) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado. Inicie sesión como barbero.' },
        { status: 401 }
      )
    }

    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // ── 5. ONBOARDING ENFORCEMENT ───────────────────────────────────────────
  const userNeedsOnboarding = Boolean(
    (ownerPayload && ownerPayload.needsOnboarding) ||
    (genericPayload && genericPayload.needsOnboarding)
  )

  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isOnboardingApi = pathname.startsWith('/api/onboarding')

  if (isOnboardingRoute || isOnboardingApi) {
    if (!hasOwnerAuth) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Si ya completó el onboarding y va a /onboarding, redirigir a su dashboard
    if (!userNeedsOnboarding && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  }

  // Si necesita onboarding pero intenta entrar a cualquier otra ruta del dashboard/api
  if (userNeedsOnboarding && hasOwnerAuth) {
    if (pathname === '/api/auth/logout') {
      return NextResponse.next()
    }
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Debe completar la configuración inicial de su barbería.', redirect: '/onboarding' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // ── 6. OWNER / BUSINESS DASHBOARDS & APIS ────────────────────────────────
  // (/dashboard, /chat, /appointments, /calendar, /clients, /barbers, /services, /finances, /reports, /settings, /notes, etc.)
  if (!isSuperAdminRoute && !isSuperAdminApi && !isBarberRoute && !isBarberApi) {
    // Allow barbers to access shared endpoints used in their dashboard
    const isSharedApi = 
      pathname.startsWith('/api/chat') || 
      pathname.startsWith('/api/notifications') || 
      pathname.startsWith('/api/notes')

    if (isSharedApi && (hasBarberAuth || hasOwnerAuth)) {
      return NextResponse.next()
    }

    if (hasOwnerAuth) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado. Acceso restringido a administradores de barbería.' },
        { status: 401 }
      )
    }

    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
