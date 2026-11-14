import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Keys that are safe to expose publicly (no secrets, no internal configs)
const PUBLIC_KEYS = [
  'platform_name',
  'support_email',
  'support_whatsapp',
  'platform_logo'
]

const DEFAULT_PUBLIC_SETTINGS: Record<string, string> = {
  platform_name: 'BarberOS',
  support_email: 'soporte@barberos.co',
  support_whatsapp: '+57 324 2063393',
  platform_logo: '/logo.png'
}

/**
 * GET /api/platform/settings
 * Public endpoint that returns non-sensitive platform configuration.
 * Used by landing page, footer, legal pages to show correct contact info.
 */
export async function GET() {
  try {
    const dbSettings = await prisma.platformSetting.findMany({
      where: { key: { in: PUBLIC_KEYS } }
    })

    const settings: Record<string, string> = { ...DEFAULT_PUBLIC_SETTINGS }
    dbSettings.forEach(s => {
      settings[s.key] = s.value
    })

    return NextResponse.json(
      { settings },
      {
        headers: {
          // Cache for 5 minutes in CDN, 1 minute stale-while-revalidate
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        }
      }
    )
  } catch {
    // On error, return defaults so the page doesn't break
    return NextResponse.json({ settings: DEFAULT_PUBLIC_SETTINGS })
  }
}

