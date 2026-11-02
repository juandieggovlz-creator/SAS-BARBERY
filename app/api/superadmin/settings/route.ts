import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  platform_name: { value: 'BarberOS', description: 'Nombre oficial de la plataforma' },
  support_email: { value: 'soporte@barberos.co', description: 'Correo de soporte y contacto' },
  support_whatsapp: { value: '+57 300 123 4567', description: 'Línea directa de WhatsApp' },
  trial_days: { value: '14', description: 'Días de prueba gratuita para nuevas barberías' },
  currency: { value: 'COP', description: 'Moneda predeterminada del sistema' },
  maintenance_mode: { value: 'false', description: 'Activar modo mantenimiento en el SaaS' },
  allow_new_registrations: { value: 'true', description: 'Permitir registro de nuevas barberías' },
  terms_url: { value: 'https://barberos.co/terms', description: 'Enlace a términos y condiciones' }
}

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const existing = await prisma.platformSetting.findMany()
    const map: Record<string, string> = {}

    // Populate defaults
    Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => {
      map[k] = v.value
    })

    // Override with DB values
    existing.forEach(s => {
      map[s.key] = s.value
    })

    return NextResponse.json({ settings: map })
  } catch (error) {
    console.error('Super Admin Settings GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar ajustes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Objeto de ajustes inválido' }, { status: 400 })
    }

    const updates = Object.entries(settings).map(async ([key, val]) => {
      const stringVal = String(val)
      return prisma.platformSetting.upsert({
        where: { key },
        update: { value: stringVal },
        create: {
          key,
          value: stringVal,
          description: DEFAULT_SETTINGS[key]?.description || 'Ajuste de plataforma'
        }
      })
    })

    await Promise.all(updates)

    await recordAuditLog({
      userId: session.userId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entity: 'PlatformSetting',
      details: settings
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save Settings Error:', error)
    return NextResponse.json({ error: 'Error al guardar ajustes' }, { status: 500 })
  }
}
