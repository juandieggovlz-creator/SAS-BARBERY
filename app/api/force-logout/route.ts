import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect('http://localhost:3000/login')
  
  // Nuke the session cookie by setting it expired
  response.cookies.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
    maxAge: 0,
  })

  return response
}
