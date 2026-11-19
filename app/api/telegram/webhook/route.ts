import { NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/lib/telegram-sentinel'

export const dynamic = 'force-dynamic'

/**
 * Endpoint del Webhook oficial de BarberOS Sentinel
 * Compatible con Vercel Serverless.
 */
export async function POST(request: Request) {
  try {
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
    const update = await request.json().catch(() => null)

    if (!update) {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
    }

    // Ejecuta el dispatcher de forma segura
    const processed = await handleTelegramUpdate(update, secretHeader)

    if (!processed) {
      // Si el secret token falló, rechazar con 401
      return NextResponse.json({ error: 'No autorizado: Secret token inválido' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Sentinel Webhook Handler Exception]:', error?.message || error)
    // Responder ok: true a Telegram si ya fue recibido para evitar bucles de reintentos infinitos
    return NextResponse.json({ ok: true, handledWithWarning: true })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'BarberOS Sentinel Webhook API',
    bot: '@BarberOSSentinelBot',
    timestamp: new Date().toISOString()
  })
}

