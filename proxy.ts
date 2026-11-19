import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 0. MODO DE MANTENIMIENTO CONTROLADO (503) ───────────────────────────
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  if (isMaintenance) {
    const isBypass = 
      pathname.startsWith('/superadmin') || 
      pathname.startsWith('/api/superadmin') || 
      pathname.startsWith('/_next') || 
      pathname === '/logo.png' ||
      pathname === '/503'
    if (!isBypass) {
      const response = NextResponse.rewrite(new URL('/503', request.url))
      response.headers.set('Retry-After', '300')
      return response
    }
  }

  // ── 1. PUBLIC ROUTES (accessible without credentials) ────────────────────
  const isPublicPage = 
    pathname === '/' ||
    pathname === '/403' ||
    pathname === '/503' ||
    pathname === '/offline' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/setup/owner') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/barber/access') ||
    pathname.startsWith('/b/') ||
    pathname.startsWith('/reserve') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/privacidad') ||
    pathname.startsWith('/terminos-y-condiciones') ||
    pathname.startsWith('/politica-de-privacidad') ||
    pathname.startsWith('/politica-de-cookies') ||
    pathname.startsWith('/seguridad') ||
    pathname.startsWith('/sla') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/tratamiento-de-datos') ||
    pathname.startsWith('/habeas-data') ||
    pathname.startsWith('/cancelacion-y-reembolsos') ||
    pathname.startsWith('/reembolsos') ||
    pathname.startsWith('/suscripciones-y-pagos') ||
    pathname.startsWith('/pagos-y-suscripciones')

  if (isPublicPage) {
    return NextResponse.next()
  }

  // Public API endpoints
  const publicApiPaths = [
    '/api/auth/login', 
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/google',
    '/api/auth/callback/google',
    '/api/auth/register-business',
    '/api/auth/register-barber', 
    '/api/auth/register-branch-admin',
    '/api/auth/validate-invite',
    '/api/auth/barber-access',
    '/api/public',
    '/api/platform/settings',
    '/api/user/accent',
    '/api/webhooks',
    '/api/whatsapp/webhook',
    '/api/telegram/webhook',
    '/api/auth/mfa',
    '/api/auth/webauthn',
    '/api/cron',
    '/api/setup/owner',
    '/api/plans'
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

  // Super Admin & Root Platform Owner credentials
  const isSuperAdmin = Boolean(
    (ownerPayload && (ownerPayload.role === 'SUPER_ADMIN' || ownerPayload.role === 'ROOT_PLATFORM_OWNER')) ||
    (genericPayload && (genericPayload.role === 'SUPER_ADMIN' || genericPayload.role === 'ROOT_PLATFORM_OWNER'))
  )

  // Owner, Branch Admin & Super Admin credentials
  const hasOwnerAuth = Boolean(
    (ownerPayload && (ownerPayload.role === 'OWNER' || ownerPayload.role === 'BRANCH_ADMIN' || ownerPayload.role === 'SUPER_ADMIN' || ownerPayload.role === 'ROOT_PLATFORM_OWNER')) ||
    (genericPayload && (genericPayload.role === 'OWNER' || genericPayload.role === 'BRANCH_ADMIN' || genericPayload.role === 'SUPER_ADMIN' || genericPayload.role === 'ROOT_PLATFORM_OWNER'))
  )

  // Barber credentials
  const hasBarberAuth = Boolean(
    (barberPayload && barberPayload.role === 'BARBER') ||
    (genericPayload && genericPayload.role === 'BARBER')
  )

  const isSuperAdminRoute = pathname.startsWith('/superadmin')
  const isSuperAdminApi = pathname.startsWith('/api/superadmin')
  const isSupportControlApi =
    pathname === '/api/superadmin/check-impersonation' ||
    pathname === '/api/superadmin/switch-back'
  const isBarberRoute = pathname.startsWith('/barber')
  const isBarberApi = pathname.startsWith('/api/barber')

  // ── 2.5. ENDPOINTS DE CONTROL DE MODO SOPORTE (IMPERSONATION) ───────────
  if (isSupportControlApi && (isSuperAdmin || hasOwnerAuth || hasBarberAuth)) {
    return NextResponse.next()
  }

  // ── 3. SUPER ADMIN PLATFORM (SaaS Dashboard & Management) ───────────────
  if (isSuperAdminRoute || isSuperAdminApi) {
    if (isSuperAdmin) {
      if (pathname === '/superadmin') {
        return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
      }
      return NextResponse.next()
    }

    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de Super Administrador de BarberOS.' },
        { status: 403 }
      )
    }

    // Si ya está autenticado como propietario o barbero, mostrar página 403
    if (hasOwnerAuth || hasBarberAuth) {
      return NextResponse.redirect(new URL('/403', request.url))
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
  if (userNeedsOnboarding && hasOwnerAuth && !isSuperAdmin) {
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
  // (/dashboard, /chat, /appointments, /calendar, /clients, /barbers, /services, /finances, /reports, /settings, /notes, /support, etc.)
  const ownerDashboardPrefixes = [
    '/dashboard',
    '/appointments',
    '/calendar',
    '/finances',
    '/clients',
    '/barbers',
    '/services',
    '/branches',
    '/webpage',
    '/settings',
    '/chat',
    '/reports',
    '/support',
    '/integrations',
    '/notes',
    '/subscription',
  ]
  const isOwnerDashboardRoute = ownerDashboardPrefixes.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
  const isOwnerApi = pathname.startsWith('/api') && !isPublicApi && !isSuperAdminApi && !isBarberApi

  if (isOwnerDashboardRoute || isOwnerApi) {
    // Allow barbers to access shared endpoints used in their dashboard
    const isSharedApi = 
      pathname.startsWith('/api/chat') || 
      pathname.startsWith('/api/notifications') || 
      pathname.startsWith('/api/notes') ||
      pathname.startsWith('/api/auth/me') ||
      pathname.startsWith('/api/auth/switch-back-admin') ||
      pathname.startsWith('/api/support')

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

    // Si ya está autenticado como barbero pero intenta ingresar al panel de finanzas/propietario
    if (hasBarberAuth && !hasOwnerAuth) {
      return NextResponse.redirect(new URL('/403', request.url))
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

export default proxy


