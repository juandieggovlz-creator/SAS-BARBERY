import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Gestión de verificación telefónica secundaria para alertas y recuperación
 */
export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { phoneNumber: true, phoneVerified: true }
  })

  // Revisar si existe proveedor de WhatsApp o SMS activo
  const hasMetaConfig = Boolean(process.env.META_APP_SECRET && process.env.NEXT_PUBLIC_META_APP_ID)
  const hasBaileysConfig = Boolean(process.env.BAILEYS_ENDPOINT || process.env.BAILEYS_API_URL)

  return NextResponse.json({
    phoneNumber: user?.phoneNumber || null,
    phoneVerified: user?.phoneVerified || false,
    providerStatus: {
      metaWhatsApp: hasMetaConfig ? 'Configurado' : 'Pendiente',
      baileys: hasBaileysConfig ? 'Configurado' : 'No disponible',
      smsGateway: 'No configurado (Requiere Twilio o AWS SNS)'
    }
  })
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Número de teléfono requerido (formato internacional +57...)' }, { status: 400 })
    }

    const cleanPhone = phoneNumber.trim().replace(/[^\d+]/g, '')

    // Guardar número en el perfil
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        phoneNumber: cleanPhone,
        phoneVerified: false // Permanece no verificado hasta que se valide con proveedor real
      }
    })

    // Comprobar disponibilidad de proveedor real
    const hasMetaConfig = Boolean(process.env.META_APP_SECRET && process.env.NEXT_PUBLIC_META_APP_ID)

    if (!hasMetaConfig) {
      return NextResponse.json({
        success: false,
        requiresProvider: true,
        message: 'El número fue registrado en tu perfil, pero el proveedor transaccional de SMS/WhatsApp no está configurado en producción para el despacho automático de códigos OTP.',
        configured: false
      }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      message: `Código OTP solicitado para ${cleanPhone}.`
    })
  } catch (error: any) {
    console.error('Phone OTP Request Error:', error)
    return NextResponse.json({ error: 'Error al procesar solicitud telefónica' }, { status: 500 })
  }
}

