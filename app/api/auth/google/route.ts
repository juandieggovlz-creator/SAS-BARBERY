import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID no está configurado en las variables de entorno.' },
      { status: 500 }
    )
  }

  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  const redirectUri = `${appUrl}/api/auth/callback/google`

  // 1. Anti-CSRF State
  const state = crypto.randomUUID()

  // 2. PKCE (Proof Key for Code Exchange - RFC 7636)
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  const response = NextResponse.redirect(googleAuthUrl)
  
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 15, // 15 minutos
  }

  response.cookies.set('oauth_state', state, cookieOpts)
  response.cookies.set('oauth_code_verifier', codeVerifier, cookieOpts)

  return response
}
