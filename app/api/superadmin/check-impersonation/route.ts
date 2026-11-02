import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession('OWNER')
    return NextResponse.json({
      isImpersonated: Boolean(session?.superAdminId),
      superAdminId: session?.superAdminId || null,
      businessId: session?.businessId || null
    })
  } catch {
    return NextResponse.json({ isImpersonated: false })
  }
}
