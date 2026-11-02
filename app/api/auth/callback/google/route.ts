import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  const loginUrl = new URL('/login', requestUrl.origin)

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

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
    // 1. Intercambiar code por Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
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

    // 2. Obtener la información del perfil del usuario en Google
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
    const fullName = googleProfile.name || googleProfile.given_name || 'Propietario'
    const picture = googleProfile.picture || null

    if (!email) {
      loginUrl.searchParams.set('error', 'google_no_email')
      return NextResponse.redirect(loginUrl)
    }

    // 3. Buscar si el usuario ya existe en la base de datos
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

      // Actualizar datos del usuario si vinieron de Google
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          name: user.name || fullName,
          avatar: user.avatar || picture,
        },
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
        needsOnboarding
      )

      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      let targetPath = '/dashboard'
      if (user.role === 'SUPER_ADMIN') targetPath = '/superadmin/dashboard'
      else if (user.role === 'BARBER') targetPath = '/barber/dashboard'

      return NextResponse.redirect(new URL(targetPath, requestUrl.origin))
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CASO 2: EL USUARIO NO EXISTE (PRIMERA VEZ CON GOOGLE)
    // ──────────────────────────────────────────────────────────────────────────
    // Se crea su usuario con su nombre, correo y foto de Google, pero el negocio
    // queda marcado como incompleto (onboardingCompleted: false).
    const tempSlug = `draft-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`

    const { newUser, newBusiness } = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name: fullName ? `Barbería de ${fullName}` : 'Mi Barbería',
          slug: tempSlug,
          email: email,
          logo: picture,
          status: 'TRIAL',
          onboardingCompleted: false, // Incompleto: debe completar Onboarding
        },
      })

      const newUser = await tx.user.create({
        data: {
          email,
          name: fullName,
          avatar: picture,
          role: 'OWNER',
          businessId: newBusiness.id,
          isActive: true,
          lastLoginAt: new Date(),
        },
      })

      return { newUser, newBusiness }
    })

    // Iniciar sesión con needsOnboarding = true
    await createSession(
      newUser.id,
      'OWNER',
      null,
      newBusiness.id,
      null,
      null,
      true // needsOnboarding
    )

    // Redirigir automáticamente a la pantalla de Onboarding
    return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
  } catch (err: unknown) {
    console.error('[Google OAuth Callback] Error procesando autenticación:', err)
    loginUrl.searchParams.set('error', 'google_auth_exception')
    return NextResponse.redirect(loginUrl)
  }
}
