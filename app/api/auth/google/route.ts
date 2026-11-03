import { getGoogleOAuthRedirectUri } from '@/lib/url'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID no está configurado en las variables de entorno.' },
      { status: 500 }
    )
  }

  // Obtenemos el origen actual de la petición o del env
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  const redirectUri = `${appUrl}/api/auth/callback/google`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(googleAuthUrl)
}
