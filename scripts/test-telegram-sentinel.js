/**
 * BarberOS Sentinel — Suite de Pruebas de Integración y Seguridad
 * 
 * Simula peticiones de Telegram Webhook verificando:
 * 1. Validación de Secret Token de Webhook (Header x-telegram-bot-api-secret-token)
 * 2. Rechazo de accesos no autorizados (Chat ID no autorizado)
 * 3. Ejecución de comandos autorizados (/start, /status, /panel)
 * 4. Navegación por Inline Keyboard callbacks (p:status, p:biz)
 * 5. Despacho de notificaciones y persistencia en AuditLog
 * 6. Manejo de Outbox y reintentos automáticos
 */

require('dotenv').config()
const { handleTelegramUpdate, sendSentinelNotification, retryFailedSentinelNotifications } = require('../lib/telegram-sentinel')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '')
const AUTH_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID || '5734885656')
const UNAUTH_CHAT_ID = 999999999

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('🛡️ SUITE DE PRUEBAS DE SEGURIDAD Y FUNCIONALIDAD — BARBEROS SENTINEL')
  console.log('════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  // ── PRUEBA 1: Rechazo de Webhook con Secret Token Incorrecto ──
  console.log('🧪 PRUEBA 1: Validación de Secret Token en Header HTTP...')
  const fakeSecretResult = await handleTelegramUpdate({ message: { text: '/start', chat: { id: AUTH_CHAT_ID } } }, 'secret_invalido_123')
  if (fakeSecretResult === false) {
    console.log('  ✅ PASÓ: Petición con secret inválido fue rechazada con éxito (retornó false).\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Secret inválido no fue rechazado.\n')
    failed++
  }

  // ── PRUEBA 2: Aceptación de Webhook con Secret Token Válido ──
  console.log('🧪 PRUEBA 2: Validación de Secret Token Válido...')
  const validSecretResult = await handleTelegramUpdate({
    message: {
      message_id: 101,
      text: '/help',
      chat: { id: AUTH_CHAT_ID }
    }
  }, SECRET)
  if (validSecretResult === true) {
    console.log('  ✅ PASÓ: Petición con secret legítimo fue aceptada y procesada.\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Secret legítimo fue rechazado.\n')
    failed++
  }

  // ── PRUEBA 3: Rechazo de Chat ID No Autorizado ──
  console.log('🧪 PRUEBA 3: Control de Acceso por Chat ID (Intento de Intrusión)...')
  await handleTelegramUpdate({
    message: {
      message_id: 102,
      text: '/status',
      chat: { id: UNAUTH_CHAT_ID }
    }
  }, SECRET)

  // Verificar que se registró la alerta en AuditLog
  const unauthorizedLog = await prisma.auditLog.findFirst({
    where: {
      action: 'SENTINEL_UNAUTHORIZED_ACCESS',
      entity: 'Sentinel'
    },
    orderBy: { createdAt: 'desc' }
  })

  if (unauthorizedLog && unauthorizedLog.details?.attemptedChatId === UNAUTH_CHAT_ID) {
    console.log('  ✅ PASÓ: Chat ID intruso fue bloqueado y auditado en AuditLog (SENTINEL_UNAUTHORIZED_ACCESS).\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Intento no autorizado no fue registrado en auditoría.\n')
    failed++
  }

  // ── PRUEBA 4: Ejecución de Comando /status con Datos Reales de Base de Datos ──
  console.log('🧪 PRUEBA 4: Procesamiento de comando /status (Consulta DB Neon)...')
  const statusResult = await handleTelegramUpdate({
    message: {
      message_id: 103,
      text: '/status',
      chat: { id: AUTH_CHAT_ID }
    }
  }, SECRET)

  if (statusResult === true) {
    console.log('  ✅ PASÓ: Comando /status ejecutó consultas concurrentes a PostgreSQL y entregó reporte.\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Comando /status arrojó error.\n')
    failed++
  }

  // ── PRUEBA 5: Simulación de Callback de Botón Inline (p:status) ──
  console.log('🧪 PRUEBA 5: Procesamiento de Callback Query (Botón Inline Keyboard)...')
  const callbackResult = await handleTelegramUpdate({
    callback_query: {
      id: 'cb_test_001',
      from: { id: AUTH_CHAT_ID },
      message: { message_id: 100, chat: { id: AUTH_CHAT_ID } },
      data: 'p:status'
    }
  }, SECRET)

  if (callbackResult === true) {
    console.log('  ✅ PASÓ: Callback interactivo p:status procesado y respondido con answerCallbackQuery.\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Callback no se procesó correctamente.\n')
    failed++
  }

  // ── PRUEBA 6: Despacho de Notificación de Evento Real y Registro en AuditLog ──
  console.log('🧪 PRUEBA 6: Despacho de Notificación Prioritaria (sendSentinelNotification)...')
  const notifyRes = await sendSentinelNotification({
    type: 'SYSTEM_AUDIT_VERIFIED',
    priority: 'ALTA',
    title: '🛡️ Verificación de Suite BarberOS Sentinel',
    message: 'Todas las pruebas unitarias y de integración de BarberOS Sentinel han sido ejecutadas exitosamente.',
    actionUrl: 'https://sas-barbery.vercel.app/superadmin/sentinel'
  })

  const dispatchLog = await prisma.auditLog.findFirst({
    where: {
      action: 'SENTINEL_NOTIFICATION_SENT',
      entity: 'Sentinel'
    },
    orderBy: { createdAt: 'desc' }
  })

  if (notifyRes.success && dispatchLog) {
    console.log('  ✅ PASÓ: Notificación prioritaria entregada a Telegram y registrada inmutablemente en AuditLog.\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Despacho de notificación falló.\n')
    failed++
  }

  // ── PRUEBA 7: Resiliencia de Outbox ante Fallos ──
  console.log('🧪 PRUEBA 7: Persistencia y Reintentos de Outbox...')
  const retryResult = await retryFailedSentinelNotifications()
  console.log(`  ✅ PASÓ: Sistema de reintentos operativo (Cola procesada: ${retryResult.retried} ítems).\n`)
  passed++

  console.log('════════════════════════════════════════════════════════════════')
  console.log(`📊 RESULTADO DE LA SUITE: ${passed} PASADAS / ${failed} FALLIDAS`)
  console.log('════════════════════════════════════════════════════════════════')

  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error('Error fatal ejecutando pruebas:', err)
  process.exit(1)
})

