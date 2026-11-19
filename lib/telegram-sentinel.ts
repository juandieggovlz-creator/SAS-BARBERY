/**
 * BarberOS Sentinel — Telegram Bot Command & Event Dispatcher
 * 
 * Gestiona comandos administrativos, botones interactivos,
 * notificaciones de monitoreo prioritarias y reintentos automáticos.
 */

import { prisma } from '@/lib/prisma'
import { recordAuditLog } from '@/lib/audit'
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerTelegramCallback,
  TelegramInlineKeyboardMarkup
} from '@/lib/telegram'

export type SentinelPriority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFORMATIVA'

export interface SentinelNotificationPayload {
  type: string
  priority: SentinelPriority
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, any>
  buttons?: Array<{ text: string; url?: string; callback_data?: string }>
}

function getAuthorizedChatId(): string {
  const envId = process.env.TELEGRAM_CHAT_ID
  return envId ? envId.trim().replace(/^["']|["']$/g, '') : '5734885656'
}

function isAuthorizedChat(chatId: string | number): boolean {
  const authorized = getAuthorizedChatId()
  return String(chatId) === authorized
}

/**
 * Teclado principal interactivo de BarberOS Sentinel
 */
function getMainKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '📊 Estado Global', callback_data: 'p:status' },
        { text: '🏢 Negocios', callback_data: 'p:biz' },
      ],
      [
        { text: '💳 Suscripciones', callback_data: 'p:sub' },
        { text: '🎫 Soporte', callback_data: 'p:sup' },
      ],
      [
        { text: '🚨 Incidentes & Alertas', callback_data: 'p:inc' },
        { text: '🔄 Actualizar', callback_data: 'p:refresh' },
      ],
      [
        { text: '🌐 Abrir Super Admin', url: 'https://sas-barbery.vercel.app/superadmin' },
      ],
    ],
  }
}

/**
 * Teclado para volver al panel principal
 */
function getBackKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '⬅️ Volver al Panel', callback_data: 'p:panel' },
        { text: '🔄 Refrescar', callback_data: 'p:refresh' },
      ],
    ],
  }
}

/**
 * Genera el texto del estado global de la plataforma
 */
async function generateStatusText(): Promise<string> {
  const startTime = Date.now()
  let dbStatus = '🟢 Conectado'
  let dbLatency = 0

  try {
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - startTime
  } catch (error: any) {
    dbStatus = '🔴 Error: ' + (error?.message || 'Fallo de conexión')
  }

  const [
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    activeSubscriptions,
    openTickets,
    urgentTickets
  ] = await Promise.all([
    prisma.business.count().catch(() => 0),
    prisma.business.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.saaSSubscription.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'URGENT' } }).catch(() => 0)
  ])

  const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

  return `<b>🛡️ BarberOS Sentinel — Estado del Sistema</b>\n\n` +
    `<b>Base de Datos Neon:</b> ${dbStatus} (${dbLatency}ms)\n` +
    `<b>Servidor:</b> 🟢 Vercel Serverless (Next.js 16)\n` +
    `<b>Hora local:</b> <code>${now}</code>\n\n` +
    `<b>📊 Métricas Clave:</b>\n` +
    `• <b>Negocios registrados:</b> ${totalBusinesses} (${activeBusinesses} activos)\n` +
    `• <b>Usuarios totales:</b> ${totalUsers}\n` +
    `• <b>Suscripciones SaaS activas:</b> ${activeSubscriptions}\n` +
    `• <b>Tickets de soporte abiertos:</b> ${openTickets} ${urgentTickets > 0 ? `(🔴 ${urgentTickets} URGENTES)` : ''}\n\n` +
    `<i>Usa los botones inferiores para navegar o ejecutar acciones.</i>`
}

/**
 * Genera el resumen de negocios
 */
async function generateBusinessesText(): Promise<string> {
  try {
    const businesses = await prisma.business.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { name: true } },
        _count: { select: { barbers: true, appointments: true } }
      }
    })

    if (businesses.length === 0) {
      return `<b>🏢 BarberOS Sentinel — Negocios</b>\n\n<i>No hay negocios registrados en la base de datos.</i>`
    }

    let text = `<b>🏢 BarberOS Sentinel — Negocios Recientes</b>\n\n`
    for (const b of businesses) {
      const statusIcon = b.status === 'ACTIVE' ? '🟢' : '⏸️'
      const planName = b.plan?.name || 'Sin Plan'
      const createdStr = new Date(b.createdAt).toLocaleDateString('es-CO')
      text += `${statusIcon} <b>${b.name}</b> (<code>${b.slug}</code>)\n`
      text += `   Plan: <b>${planName}</b> | Barberos: ${b._count.barbers} | Citas: ${b._count.appointments}\n`
      text += `   Registrado: ${createdStr}\n\n`
    }

    return text
  } catch (err: any) {
    return `<b>🏢 BarberOS Sentinel — Negocios</b>\n\n⚠️ Error al consultar negocios: ${err?.message || 'Error de base de datos'}`
  }
}

/**
 * Genera el resumen de suscripciones
 */
async function generateSubscriptionsText(): Promise<string> {
  const [active, trialing, pastDue, cancelled] = await Promise.all([
    prisma.saaSSubscription.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.saaSSubscription.count({ where: { status: 'TRIALING' } }).catch(() => 0),
    prisma.saaSSubscription.count({ where: { status: 'PAST_DUE' } }).catch(() => 0),
    prisma.saaSSubscription.count({ where: { status: 'CANCELLED' } }).catch(() => 0),
  ])

  const plans = await prisma.plan.findMany({
    select: {
      name: true,
      price: true,
      _count: { select: { subscriptions: true } }
    }
  }).catch(() => [])

  let text = `<b>💳 BarberOS Sentinel — Suscripciones SaaS</b>\n\n`
  text += `• <b>Activas:</b> 🟢 ${active}\n`
  text += `• <b>En período de prueba:</b> ⏳ ${trialing}\n`
  text += `• <b>Con pago vencido:</b> ⚠️ ${pastDue}\n`
  text += `• <b>Canceladas:</b> ❌ ${cancelled}\n\n`
  text += `<b>Distribución por Plan:</b>\n`

  for (const p of plans) {
    text += `• <b>${p.name}:</b> ${p._count.subscriptions} suscripciones ($${Number(p.price).toLocaleString('es-CO')})\n`
  }

  return text
}

/**
 * Genera el resumen de soporte y tickets con botones de acción rápida
 */
async function generateSupportData(): Promise<{ text: string; keyboard: TelegramInlineKeyboardMarkup }> {
  const tickets = await prisma.supportTicket.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    take: 5,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    include: {
      business: { select: { name: true } },
      user: { select: { name: true, email: true } }
    }
  }).catch(() => [])

  if (tickets.length === 0) {
    return {
      text: `<b>🎫 BarberOS Sentinel — Soporte Técnico</b>\n\n✅ <b>¡Bandeja despejada!</b> No hay tickets abiertos ni pendientes.`,
      keyboard: getBackKeyboard()
    }
  }

  let text = `<b>🎫 BarberOS Sentinel — Tickets Abiertos (${tickets.length})</b>\n\n`
  const actionButtons: Array<Array<{ text: string; callback_data: string }>> = []

  for (const t of tickets) {
    const priorityIcon = t.priority === 'URGENT' ? '🔴' : t.priority === 'HIGH' ? '🟠' : '🟡'
    const statusLabel = t.status === 'OPEN' ? 'ABIERTO' : 'EN PROCESO'
    text += `${priorityIcon} <b>#${t.ticketCode || t.id.slice(0, 8)}</b> [${statusLabel}]\n`
    text += `   <b>Asunto:</b> ${t.subject}\n`
    text += `   <b>Negocio:</b> ${t.business.name} (${t.user.name || t.user.email})\n\n`

    if (t.status === 'OPEN') {
      actionButtons.push([
        { text: `▶️ Atender #${(t.ticketCode || t.id).slice(0, 8)}`, callback_data: `act:t_prog:${t.id}` },
        { text: `✅ Resolver #${(t.ticketCode || t.id).slice(0, 8)}`, callback_data: `act:t_res:${t.id}` },
      ])
    } else {
      actionButtons.push([
        { text: `✅ Marcar Resuelto #${(t.ticketCode || t.id).slice(0, 8)}`, callback_data: `act:t_res:${t.id}` },
      ])
    }
  }

  actionButtons.push([
    { text: '⬅️ Volver al Panel', callback_data: 'p:panel' },
    { text: '🔄 Refrescar', callback_data: 'p:sup' },
  ])

  return {
    text,
    keyboard: { inline_keyboard: actionButtons }
  }
}

/**
 * Genera el reporte de incidentes y alertas críticas
 */
async function generateIncidentsText(): Promise<string> {
  const recentCriticalLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ['SECURITY_ALERT', 'DATABASE_ERROR', 'PAYMENT_FAILED', 'SENTINEL_UNAUTHORIZED_ACCESS', 'BUSINESS_SUSPENDED'] }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  }).catch(() => [])

  let text = `<b>🚨 BarberOS Sentinel — Incidentes & Seguridad</b>\n\n`

  if (recentCriticalLogs.length === 0) {
    text += `✅ <b>Sin incidentes críticos reportados.</b> La plataforma opera dentro de parámetros normales.\n`
  } else {
    for (const log of recentCriticalLogs) {
      const dateStr = new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      text += `⚠️ <b>${log.action}</b>\n`
      text += `   Entidad: ${log.entity} | IP: ${log.ipAddress || 'N/A'}\n`
      text += `   Fecha: <code>${dateStr}</code>\n\n`
    }
  }

  return text
}

/**
 * Controlador principal de updates de Telegram Webhook
 */
export async function handleTelegramUpdate(update: any, secretHeader?: string | null): Promise<boolean> {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim().replace(/^["']|["']$/g, '')

  // 1. Verificación de seguridad del Secret Token en los headers
  if (expectedSecret && secretHeader !== expectedSecret) {
    console.warn('[Sentinel Webhook] Secret token inválido recibido:', secretHeader ? '(provisto pero no coincide)' : '(ausente)')
    return false
  }

  // 2. Manejo de Callback Queries (Pulsaciones de botones inline)
  if (update.callback_query) {
    const cb = update.callback_query
    const fromId = cb.from?.id
    const messageId = cb.message?.message_id
    const chatId = cb.message?.chat?.id
    const data = cb.data || ''

    if (!isAuthorizedChat(fromId) && !isAuthorizedChat(chatId)) {
      await answerTelegramCallback(cb.id, '⛔ Acceso denegado. No eres el Super Admin autorizado.', true)
      await recordAuditLog({
        action: 'SENTINEL_UNAUTHORIZED_CALLBACK',
        entity: 'Sentinel',
        details: { fromId, chatId, data }
      })
      return true
    }

    try {
      if (data === 'p:panel') {
        await answerTelegramCallback(cb.id, 'Cargando panel...')
        await editTelegramMessage(chatId, messageId, await generateStatusText(), {
          reply_markup: getMainKeyboard()
        })
      } else if (data === 'p:status' || data === 'p:refresh') {
        await answerTelegramCallback(cb.id, 'Actualizando métricas...')
        await editTelegramMessage(chatId, messageId, await generateStatusText(), {
          reply_markup: getMainKeyboard()
        })
      } else if (data === 'p:biz') {
        await answerTelegramCallback(cb.id, 'Consultando negocios...')
        await editTelegramMessage(chatId, messageId, await generateBusinessesText(), {
          reply_markup: getBackKeyboard()
        })
      } else if (data === 'p:sub') {
        await answerTelegramCallback(cb.id, 'Consultando suscripciones...')
        await editTelegramMessage(chatId, messageId, await generateSubscriptionsText(), {
          reply_markup: getBackKeyboard()
        })
      } else if (data === 'p:sup') {
        await answerTelegramCallback(cb.id, 'Consultando tickets...')
        const sup = await generateSupportData()
        await editTelegramMessage(chatId, messageId, sup.text, {
          reply_markup: sup.keyboard
        })
      } else if (data === 'p:inc') {
        await answerTelegramCallback(cb.id, 'Revisando auditoría...')
        await editTelegramMessage(chatId, messageId, await generateIncidentsText(), {
          reply_markup: getBackKeyboard()
        })
      } else if (data.startsWith('act:t_prog:')) {
        const ticketId = data.replace('act:t_prog:', '')
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' }
        })
        await recordAuditLog({
          action: 'SENTINEL_TICKET_IN_PROGRESS',
          entity: 'SupportTicket',
          entityId: ticketId,
          details: { updatedVia: 'Telegram Sentinel' }
        })
        await answerTelegramCallback(cb.id, '✅ Ticket puesto EN PROCESO', true)
        const sup = await generateSupportData()
        await editTelegramMessage(chatId, messageId, sup.text, { reply_markup: sup.keyboard })
      } else if (data.startsWith('act:t_res:')) {
        const ticketId = data.replace('act:t_res:', '')
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'RESOLVED' }
        })
        await recordAuditLog({
          action: 'SENTINEL_TICKET_RESOLVED',
          entity: 'SupportTicket',
          entityId: ticketId,
          details: { updatedVia: 'Telegram Sentinel' }
        })
        await answerTelegramCallback(cb.id, '✅ Ticket marcado como RESUELTO', true)
        const sup = await generateSupportData()
        await editTelegramMessage(chatId, messageId, sup.text, { reply_markup: sup.keyboard })
      } else {
        await answerTelegramCallback(cb.id, 'Opción procesada')
      }
    } catch (err: any) {
      console.error('[Sentinel Callback Error]:', err)
      await answerTelegramCallback(cb.id, 'Error al ejecutar acción: ' + (err?.message || 'Desconocido'), true)
    }

    return true
  }

  // 3. Manejo de Mensajes de Texto y Comandos
  if (update.message && update.message.text) {
    const msg = update.message
    const chatId = msg.chat?.id
    const text = msg.text.trim()

    // Verificación de chat autorizado
    if (!isAuthorizedChat(chatId)) {
      console.warn(`[Sentinel Webhook] Acceso no autorizado denegado para Chat ID: ${chatId}`)
      await sendTelegramMessage(chatId, '⛔ <b>Acceso denegado.</b> Este bot es exclusivo para la administración central de BarberOS.')
      await recordAuditLog({
        action: 'SENTINEL_UNAUTHORIZED_ACCESS',
        entity: 'Sentinel',
        details: { attemptedChatId: chatId, text }
      })
      return true
    }

    const command = text.split(' ')[0].toLowerCase()

    try {
      if (command === '/start' || command === '/help') {
        const welcomeText = `<b>🛡️ Bienvenido a BarberOS Sentinel</b>\n\n` +
          `Sistema oficial de monitoreo, alertas y administración ejecutiva para el Super Admin de BarberOS.\n\n` +
          `<b>Comandos Rápidos:</b>\n` +
          `• <code>/panel</code> — Abrir el panel de control interactivo\n` +
          `• <code>/status</code> — Salud del sistema, latencia DB y métricas clave\n` +
          `• <code>/businesses</code> — Últimos negocios registrados y estados\n` +
          `• <code>/subscriptions</code> — Estado de planes y facturación SaaS\n` +
          `• <code>/support</code> — Ver y resolver tickets de soporte abiertos\n` +
          `• <code>/incidents</code> — Registro de alertas e incidencias recientes\n` +
          `• <code>/help</code> — Muestra este manual de uso\n\n` +
          `<i>Presiona el botón a continuación para abrir el panel de control.</i>`

        await sendTelegramMessage(chatId, welcomeText, {
          reply_markup: getMainKeyboard()
        })
      } else if (command === '/panel') {
        const statusText = await generateStatusText()
        await sendTelegramMessage(chatId, statusText, {
          reply_markup: getMainKeyboard()
        })
      } else if (command === '/status') {
        const statusText = await generateStatusText()
        await sendTelegramMessage(chatId, statusText, {
          reply_markup: getBackKeyboard()
        })
      } else if (command === '/businesses') {
        const bizText = await generateBusinessesText()
        await sendTelegramMessage(chatId, bizText, {
          reply_markup: getBackKeyboard()
        })
      } else if (command === '/subscriptions' || command === '/payments') {
        const subText = await generateSubscriptionsText()
        await sendTelegramMessage(chatId, subText, {
          reply_markup: getBackKeyboard()
        })
      } else if (command === '/support') {
        const sup = await generateSupportData()
        await sendTelegramMessage(chatId, sup.text, {
          reply_markup: sup.keyboard
        })
      } else if (command === '/incidents' || command === '/alerts') {
        const incText = await generateIncidentsText()
        await sendTelegramMessage(chatId, incText, {
          reply_markup: getBackKeyboard()
        })
      } else {
        await sendTelegramMessage(
          chatId,
          `❓ <b>Comando no reconocido:</b> <code>${command}</code>\nUsa <code>/panel</code> o <code>/help</code> para consultar las opciones disponibles.`,
          { reply_markup: getMainKeyboard() }
        )
      }
    } catch (cmdErr: any) {
      console.error('[Sentinel Command Error]:', cmdErr)
      await sendTelegramMessage(chatId, `⚠️ <b>Error al procesar comando:</b> ${cmdErr?.message || 'Error interno'}`)
    }

    return true
  }

  return true
}

/**
 * Despachador central de notificaciones desde el backend hacia Telegram
 */
export async function sendSentinelNotification(payload: SentinelNotificationPayload): Promise<{ success: boolean; error?: string }> {
  const chatId = getAuthorizedChatId()
  const priorityIcons: Record<SentinelPriority, string> = {
    CRITICA: '🔴 [CRÍTICA]',
    ALTA: '🟠 [ALTA]',
    MEDIA: '🟡 [MEDIA]',
    INFORMATIVA: 'ℹ️ [INFO]'
  }

  const badge = priorityIcons[payload.priority] || 'ℹ️ [INFO]'
  const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

  let text = `<b>🛡️ BarberOS Sentinel — Notificación</b>\n` +
    `<b>Prioridad:</b> ${badge}\n` +
    `<b>Evento:</b> ${payload.title}\n` +
    `<b>Hora:</b> <code>${now}</code>\n\n` +
    `${payload.message}\n`

  const keyboard: TelegramInlineKeyboardMarkup = { inline_keyboard: [] }

  if (payload.buttons && payload.buttons.length > 0) {
    const row = payload.buttons.map(b => ({
      text: b.text,
      url: b.url,
      callback_data: b.callback_data
    }))
    keyboard.inline_keyboard.push(row)
  }

  if (payload.actionUrl) {
    keyboard.inline_keyboard.push([{ text: '🔗 Ver en Plataforma', url: payload.actionUrl }])
  }

  keyboard.inline_keyboard.push([{ text: '📊 Abrir Panel Sentinel', callback_data: 'p:panel' }])

  const res = await sendTelegramMessage(chatId, text, {
    reply_markup: keyboard
  })

  const success = Boolean(res && res.ok)

  // Registro en AuditLog
  await recordAuditLog({
    action: 'SENTINEL_NOTIFICATION_SENT',
    entity: 'Sentinel',
    details: {
      title: payload.title,
      priority: payload.priority,
      success,
      description: res?.description || null
    }
  })

  // Si falló el envío, encolar en PlatformSetting para reintento automático
  if (!success) {
    try {
      const existingQueueSetting = await prisma.platformSetting.findUnique({
        where: { key: 'sentinel_failed_queue' }
      })

      const queue: SentinelNotificationPayload[] = existingQueueSetting
        ? JSON.parse(existingQueueSetting.value)
        : []

      queue.push(payload)
      // Limitar a 50 notificaciones encoladas máximo
      const trimmedQueue = queue.slice(-50)

      await prisma.platformSetting.upsert({
        where: { key: 'sentinel_failed_queue' },
        create: {
          key: 'sentinel_failed_queue',
          value: JSON.stringify(trimmedQueue),
          description: 'Cola de notificaciones pendientes de BarberOS Sentinel'
        },
        update: {
          value: JSON.stringify(trimmedQueue)
        }
      })
    } catch (queueErr) {
      console.error('[Sentinel Queue Error]:', queueErr)
    }

    return {
      success: false,
      error: res?.description || 'Error de entrega a Telegram Bot API'
    }
  }

  return { success: true }
}

/**
 * Reintenta notificaciones que no pudieron entregarse anteriormente
 */
export async function retryFailedSentinelNotifications(): Promise<{ retried: number; successful: number }> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'sentinel_failed_queue' }
    })

    if (!setting || !setting.value) {
      return { retried: 0, successful: 0 }
    }

    const queue: SentinelNotificationPayload[] = JSON.parse(setting.value)
    if (queue.length === 0) {
      return { retried: 0, successful: 0 }
    }

    const remaining: SentinelNotificationPayload[] = []
    let successful = 0

    for (const item of queue) {
      const res = await sendSentinelNotification(item)
      if (res.success) {
        successful++
      } else {
        remaining.push(item)
      }
    }

    await prisma.platformSetting.update({
      where: { key: 'sentinel_failed_queue' },
      data: { value: JSON.stringify(remaining) }
    })

    return { retried: queue.length, successful }
  } catch (error) {
    console.error('[Sentinel Retry Error]:', error)
    return { retried: 0, successful: 0 }
  }
}

/**
 * Notifica a Telegram Sentinel sobre un nuevo ticket de soporte creado
 */
export async function notifySentinelTicketCreated(params: {
  ticketCode: string
  subject: string
  priority: string
  businessName: string
  userEmail: string
  description: string
  ticketId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sas-barbery.vercel.app'
    const priorityMap: Record<string, SentinelPriority> = {
      URGENT: 'CRITICA',
      HIGH: 'ALTA',
      MEDIUM: 'MEDIA',
      LOW: 'INFORMATIVA'
    }

    const priorityLabel = params.priority === 'URGENT' ? '🔴 Urgente'
      : params.priority === 'HIGH' ? '🟠 Alta'
      : params.priority === 'MEDIUM' ? '🟡 Media'
      : '⚪ Baja'

    const snippet = params.description.length > 200
      ? params.description.slice(0, 200) + '...'
      : params.description

    const message = `<b>🏢 Negocio:</b> ${params.businessName}\n` +
      `<b>🎫 Ticket:</b> <code>#${params.ticketCode}</code>\n` +
      `<b>📌 Asunto:</b> ${params.subject}\n` +
      `<b>⚡ Prioridad:</b> ${priorityLabel}\n` +
      `<b>🟢 Estado:</b> Abierto\n` +
      `<b>👤 Creado por:</b> <code>${params.userEmail}</code>\n\n` +
      `<i>"${snippet}"</i>`

    return await sendSentinelNotification({
      type: 'SUPPORT_TICKET_CREATED',
      priority: priorityMap[params.priority] || 'MEDIA',
      title: 'NUEVO TICKET — BARBEROS',
      message,
      actionUrl: `${appUrl}/superadmin/support`,
      metadata: {
        ticketId: params.ticketId,
        ticketCode: params.ticketCode,
        businessName: params.businessName
      },
      buttons: [
        { text: '🎫 Ver en Super Admin', url: `${appUrl}/superadmin/support` },
        { text: '▶️ Marcar En Proceso', callback_data: `act:t_prog:${params.ticketId}` }
      ]
    })
  } catch (err: any) {
    console.error('[Sentinel Ticket Alert Error]:', err?.message || err)
    return { success: false, error: err?.message || 'Error notificando Sentinel' }
  }
}

/**
 * Notifica a Telegram Sentinel sobre una nueva respuesta de un cliente en un ticket
 */
export async function notifySentinelTicketReply(params: {
  ticketCode: string
  businessName: string
  senderName: string
  senderRole: string
  message: string
  ticketId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sas-barbery.vercel.app'
    const snippet = params.message.length > 200
      ? params.message.slice(0, 200) + '...'
      : params.message

    const text = `<b>🏢 Negocio:</b> ${params.businessName}\n` +
      `<b>🎫 Ticket:</b> <code>#${params.ticketCode}</code>\n` +
      `<b>💬 De:</b> ${params.senderName} (${params.senderRole})\n\n` +
      `<i>"${snippet}"</i>`

    return await sendSentinelNotification({
      type: 'SUPPORT_TICKET_REPLY',
      priority: 'MEDIA',
      title: 'NUEVA RESPUESTA EN TICKET — BARBEROS',
      message: text,
      actionUrl: `${appUrl}/superadmin/support`,
      metadata: {
        ticketId: params.ticketId,
        ticketCode: params.ticketCode,
        businessName: params.businessName
      },
      buttons: [
        { text: '💬 Responder en Super Admin', url: `${appUrl}/superadmin/support` }
      ]
    })
  } catch (err: any) {
    console.error('[Sentinel Reply Alert Error]:', err?.message || err)
    return { success: false, error: err?.message || 'Error notificando Sentinel' }
  }
}

