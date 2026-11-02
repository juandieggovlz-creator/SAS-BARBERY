import { deleteSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const roleParam = searchParams.get('role') as 'OWNER' | 'BARBER' | null

  await deleteSession(roleParam || undefined)

  const response = NextResponse.json({ success: true })
  const clearOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  }

  if (roleParam === 'BARBER') {
    response.cookies.set('barber_session', '', clearOpts)
  } else if (roleParam === 'OWNER') {
    response.cookies.set('owner_session', '', clearOpts)
    response.cookies.set('session', '', clearOpts)
  } else {
    response.cookies.set('session', '', clearOpts)
    response.cookies.set('owner_session', '', clearOpts)
    response.cookies.set('barber_session', '', clearOpts)
  }

  return response
}
