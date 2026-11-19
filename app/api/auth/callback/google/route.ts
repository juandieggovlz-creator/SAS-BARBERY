import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { createPersistentSession } from '@/lib/session'
import { getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  const loginUrl = new URL('/login', requestUrl.origin)

  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')

  // 1. Verificación anti-CSRF del parámetro state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  cookieStore.delete('oauth_state')

  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value
  cookieStore.delete('oauth_code_verifier')

  if (!state || !savedState || state !== savedState) {
    loginUrl.searchParams.set('error', 'invalid_oauth_state')
    return NextResponse.redirect(loginUrl)
  }

  if (error) {
    loginUrl.searchParams.set('error', 'google_access_denied')
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    loginUrl.searchParams.set('error', 'google_no_code')
    return NextResponse.redirect(loginUrl)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set('error', 'google_config_missing')
    return NextResponse.redirect(loginUrl)
  }

  const redirectUri = `${appUrl}/api/auth/callback/google`

  try {
    // 2. Intercambiar code por Access Token con PKCE code_verifier
    const tokenRequestBody: Record<string, string> = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }

    if (codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('[Google OAuth] Token exchange error:', errText)
      loginUrl.searchParams.set('error', 'google_token_failed')
      return NextResponse.redirect(loginUrl)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      loginUrl.searchParams.set('error', 'google_no_token')
      return NextResponse.redirect(loginUrl)
    }

    // 3. Obtener la información del perfil del usuario en Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      loginUrl.searchParams.set('error', 'google_userinfo_failed')
      return NextResponse.redirect(loginUrl)
    }

    const googleProfile = await userinfoResponse.json()
    const email = googleProfile.email?.trim().toLowerCase()
    const googleSub = googleProfile.id || googleProfile.sub
    const fullName = googleProfile.name || googleProfile.given_name || 'Propietario'
    const picture = googleProfile.picture || null

    if (!email) {
      loginUrl.searchParams.set('error', 'google_no_email')
      return NextResponse.redirect(loginUrl)
    }

    if (googleProfile.verified_email === false || googleProfile.email_verified === false) {
      loginUrl.searchParams.set('error', 'google_unverified_email')
      return NextResponse.redirect(loginUrl)
    }

    // 4. Buscar si el usuario ya existe en la base de datos
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      include: {
        barber: true,
        business: true,
      },
    })

    // ──────────────────────────────────────────────────────────────────────────
    // CASO 1: EL USUARIO YA EXISTE
    // ──────────────────────────────────────────────────────────────────────────
    if (user) {
      if (!user.isActive) {
        loginUrl.searchParams.set('error', 'account_inactive')
        return NextResponse.redirect(loginUrl)
      }

      if (user.role === 'BARBER' && user.barber?.status === 'INACTIVE') {
        loginUrl.searchParams.set('error', 'barber_inactive')
        return NextResponse.redirect(loginUrl)
      }

      // BLINDAJE DE PROPIETARIO RAÍZ (ROOT_PLATFORM_OWNER):
      // No permitir vinculación automática por correo. Debe estar explícitamente vinculado por googleSub.
      if (user.role === 'ROOT_PLATFORM_OWNER') {
        if (!user.googleSub || user.googleSub !== googleSub) {
          loginUrl.searchParams.set('error', 'root_google_not_linked')
          return NextResponse.redirect(loginUrl)
        }
      }

      // Si el usuario tiene MFA habilitado o es ROOT_PLATFORM_OWNER:
      // Exigir segundo factor OBLIGATORIO. Emitir únicamente sesión temporal mfa_pending.
      if (user.role === 'ROOT_PLATFORM_OWNER' || user.mfaEnabled) {
        await createSession(
          user.id,
          user.role,
          user.barberId,
          user.businessId,
          null,
          null,
          false,
          user.companyId,
          null,
          true // mfaPending = true
        )
        return NextResponse.redirect(new URL('/login/mfa', requestUrl.origin))
      }

      // Si es un usuario regular sin googleSub registrado, vincular el ID inmutable de Google
      if (!user.googleSub && googleSub) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleSub }
        })
      }

      // Actualizar datos del usuario si vinieron de Google
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          name: user.name || fullName,
          avatar: user.avatar || picture,
        },
      })

      // Crear sesión persistente en base de datos
      const ip = getClientIp(request)
      const userAgent = request.headers.get('user-agent')
      const persistentSession = await createPersistentSession({
        userId: user.id,
        ipAddress: ip,
        userAgent
      })

      // Verificar si el dueño ya completó el onboarding del negocio
      const needsOnboarding = Boolean(
        user.role === 'OWNER' && (!user.business || !user.business.onboardingCompleted)
      )

      await createSession(
        user.id,
        user.role,
        user.barberId,
        user.businessId,
        null,
        null,
        needsOnboarding,
        user.companyId,
        persistentSession.sessionId,
        false
      )

      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      let targetPath = '/dashboard'
      if (user.role === 'SUPER_ADMIN' || (user.role as string) === 'ROOT_PLATFORM_OWNER') targetPath = '/superadmin/dashboard'
      else if (user.role === 'BARBER') targetPath = '/barber/dashboard'

      return NextResponse.redirect(new URL(targetPath, requestUrl.origin))
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASO 2: EL USUARIO NO EXISTE (PRIMERA VEZ CON GOOGLE)
    // ──────────────────────────────────────────────────────────────────────────
    // Se crea nuevo negocio de prueba para dueños de barbería (NUNCA cuentas de Root/SuperAdmin)
    const tempSlug = `draft-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`

    const { newUser, newBusiness } = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name: fullName ? `Barbería de ${fullName}` : 'Mi Barbería',
          slug: tempSlug,
          email: email,
          logo: picture,
          status: 'TRIAL',
          onboardingCompleted: false,
        },
      })

      const newUser = await tx.user.create({
        data: {
          email,
          name: fullName,
          avatar: picture,
          role: 'OWNER',
          googleSub,
          businessId: newBusiness.id,
          isActive: true,
          lastLoginAt: new Date(),
        },
      })

      return { newUser, newBusiness }
    })

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent')
    const persistentSession = await createPersistentSession({
      userId: newUser.id,
      ipAddress: ip,
      userAgent
    })

    await createSession(
      newUser.id,
      'OWNER',
      null,
      newBusiness.id,
      null,
      null,
      true, // needsOnboarding
      null,
      persistentSession.sessionId,
      false
    )

    return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
  } catch (err: unknown) {
    console.error('[Google OAuth Callback] Error procesando autenticación:', err)
    loginUrl.searchParams.set('error', 'google_auth_exception')
    return NextResponse.redirect(loginUrl)
  }
}
