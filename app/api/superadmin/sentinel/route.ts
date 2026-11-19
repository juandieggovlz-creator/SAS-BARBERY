import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getTelegramWebhookInfo } from '@/lib/telegram'
import { sendSentinelNotification, retryFailedSentinelNotifications } from '@/lib/telegram-sentinel'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de gestión y monitoreo de BarberOS Sentinel para Super Admin
 */
export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // 1. Consultar estado en vivo del Webhook en Telegram Bot API
    const webhookInfo = await getTelegramWebhookInfo().catch(() => ({ ok: false, result: null }))

    // 2. Consultar cola de reintentos en PlatformSetting
    const queueSetting = await prisma.platformSetting.findUnique({
      where: { key: 'sentinel_failed_queue' }
    })
    const outboxQueue = queueSetting?.value ? JSON.parse(queueSetting.value) : []

    // 3. Consultar logs recientes de Sentinel en AuditLog
    const logs = await prisma.auditLog.findMany({
      where: { entity: 'Sentinel' },
      take: 25,
      orderBy: { createdAt: 'desc' }
    })

    const tokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN)
    const secretConfigured = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET)
    const chatId = process.env.TELEGRAM_CHAT_ID || '5734885656'
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'https://sas-barbery.vercel.app/api/telegram/webhook'

    return NextResponse.json({
      status: 'success',
      bot: {
        name: 'BarberOS Sentinel',
        username: '@BarberOSSentinelBot',
        chatIdAuthorized: chatId,
        webhookUrl: webhookUrl,
        tokenConfigured,
        secretConfigured,
      },
      webhook: webhookInfo.ok ? webhookInfo.result : { error: 'No conectado' },
      outbox: {
        pendingCount: outboxQueue.length,
        items: outboxQueue
      },
      recentLogs: logs.map(l => ({
        id: l.id,
        action: l.action,
        details: l.details,
        createdAt: l.createdAt,
        ipAddress: l.ipAddress
      }))
    })
  } catch (error: any) {
    console.error('Super Admin Sentinel GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar estado de BarberOS Sentinel' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { action } = await request.json()

    if (action === 'test_notification') {
      const result = await sendSentinelNotification({
        type: 'TEST_ALERT',
        priority: 'INFORMATIVA',
        title: '🧪 Prueba Manual desde Super Admin',
        message: 'Esta es una prueba manual de conectividad y despacho disparada desde el panel Super Admin de BarberOS.',
        actionUrl: 'https://sas-barbery.vercel.app/superadmin/sentinel'
      })

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Notificación de prueba entregada con éxito a Telegram.' })
      } else {
        return NextResponse.json({ success: false, error: result.error || 'Fallo de entrega a Telegram' }, { status: 500 })
      }
    }

    if (action === 'retry_outbox') {
      const retryResult = await retryFailedSentinelNotifications()
      return NextResponse.json({
        success: true,
        message: `Reintento finalizado: ${retryResult.successful} de ${retryResult.retried} notificaciones entregadas con éxito.`
      })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (error: any) {
    console.error('Super Admin Sentinel POST Error:', error)
    return NextResponse.json({ error: error?.message || 'Error al ejecutar acción' }, { status: 500 })
  }
}

