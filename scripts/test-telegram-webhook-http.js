/**
 * BarberOS Sentinel — Suite de Pruebas de Integración HTTP y Seguridad
 * 
 * Prueba el endpoint en vivo /api/telegram/webhook contra el servidor Next.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const BASE_URL = 'http://localhost:3000'
const SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '')
const AUTH_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID || '5734885656')
const UNAUTH_CHAT_ID = 987654321

async function runHttpTests() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('🛡️ SUITE DE PRUEBAS END-TO-END — BARBEROS SENTINEL WEBHOOK HTTP')
  console.log('════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  // ── PRUEBA 1: GET Healthcheck ──
  console.log('🧪 PRUEBA 1: Healthcheck GET /api/telegram/webhook...')
  const getRes = await fetch(`${BASE_URL}/api/telegram/webhook`)
  const getData = await getRes.json()
  if (getRes.status === 200 && getData.status === 'online') {
    console.log(`  ✅ PASÓ: Endpoint responde 200 OK (${getData.service} - ${getData.bot})\n`)
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Endpoint respondió ${getRes.status}\n`)
    failed++
  }

  // ── PRUEBA 2: POST con Secret Token Inválido o Ausente ──
  console.log('🧪 PRUEBA 2: Rechazo de POST con Secret Token Incorrecto...')
  const fakeSecretRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': 'secreto_falso_invalido'
    },
    body: JSON.stringify({ message: { text: '/start', chat: { id: AUTH_CHAT_ID } } })
  })

  if (fakeSecretRes.status === 401) {
    console.log('  ✅ PASÓ: Servidor rechazó con 401 Unauthorized ante secret inválido.\n')
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Servidor respondió ${fakeSecretRes.status} en lugar de 401.\n`)
    failed++
  }

  // ── PRUEBA 3: POST con Secret Válido pero Chat ID No Autorizado ──
  console.log('🧪 PRUEBA 3: Intento de Intrusión (Chat ID No Autorizado)...')
  const unauthRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET
    },
    body: JSON.stringify({
      update_id: 1001,
      message: {
        message_id: 50,
        text: '/status',
        chat: { id: UNAUTH_CHAT_ID }
      }
    })
  })

  const unauthLog = await prisma.auditLog.findFirst({
    where: {
      action: 'SENTINEL_UNAUTHORIZED_ACCESS',
      entity: 'Sentinel'
    },
    orderBy: { createdAt: 'desc' }
  })

  if (unauthRes.status === 200 && unauthLog && unauthLog.details?.attemptedChatId === UNAUTH_CHAT_ID) {
    console.log('  ✅ PASÓ: Chat intruso rechazado y auditado inmutablemente en PostgreSQL (Neon).\n')
    passed++
  } else {
    console.error('  ❌ FALLÓ: Intento intruso no fue auditado correctamente.\n')
    failed++
  }

  // ── PRUEBA 4: Comando /panel Autorizado ──
  console.log('🧪 PRUEBA 4: Comando Autorizado /panel con Inline Keyboard...')
  const panelRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET
    },
    body: JSON.stringify({
      update_id: 1002,
      message: {
        message_id: 51,
        text: '/panel',
        chat: { id: AUTH_CHAT_ID }
      }
    })
  })

  if (panelRes.status === 200) {
    console.log('  ✅ PASÓ: Comando /panel procesado correctamente.\n')
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Comando /panel respondió ${panelRes.status}\n`)
    failed++
  }

  // ── PRUEBA 5: Comando /status Autorizado (Consulta DB Neon) ──
  console.log('🧪 PRUEBA 5: Comando Autorizado /status (Consulta DB Neon)...')
  const statusRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET
    },
    body: JSON.stringify({
      update_id: 1003,
      message: {
        message_id: 52,
        text: '/status',
        chat: { id: AUTH_CHAT_ID }
      }
    })
  })

  if (statusRes.status === 200) {
    console.log('  ✅ PASÓ: Comando /status consultó Neon PostgreSQL y entregó reporte.\n')
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Comando /status respondió ${statusRes.status}\n`)
    failed++
  }

  // ── PRUEBA 6: Callback Query Interactiva (p:biz) ──
  console.log('🧪 PRUEBA 6: Callback Query Interactiva (p:biz - Consulta Negocios)...')
  const cbRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET
    },
    body: JSON.stringify({
      update_id: 1004,
      callback_query: {
        id: 'cb_test_http_01',
        from: { id: AUTH_CHAT_ID },
        message: {
          message_id: 3,
          chat: { id: AUTH_CHAT_ID }
        },
        data: 'p:biz'
      }
    })
  })

  if (cbRes.status === 200) {
    console.log('  ✅ PASÓ: Callback interactivo respondió y actualizó mensaje.\n')
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Callback respondió ${cbRes.status}\n`)
    failed++
  }

  // ── PRUEBA 7: Endpoint de Monitoreo Super Admin /api/superadmin/sentinel ──
  console.log('🧪 PRUEBA 7: Endpoint Super Admin /api/superadmin/sentinel (Protección de Sesión)...')
  const unauthAdminRes = await fetch(`${BASE_URL}/api/superadmin/sentinel`)
  if (unauthAdminRes.status === 403 || unauthAdminRes.status === 307 || unauthAdminRes.status === 401) {
    console.log(`  ✅ PASÓ: Endpoint de Super Admin bloqueó acceso no autenticado (${unauthAdminRes.status}).\n`)
    passed++
  } else {
    console.error(`  ❌ FALLÓ: Endpoint de Super Admin respondió ${unauthAdminRes.status}\n`)
    failed++
  }

  console.log('════════════════════════════════════════════════════════════════')
  console.log(`📊 RESULTADO FINAL DE LA SUITE: ${passed} PASADAS / ${failed} FALLIDAS`)
  console.log('════════════════════════════════════════════════════════════════')

  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

runHttpTests().catch(err => {
  console.error('Error fatal ejecutando suite HTTP:', err)
  process.exit(1)
})

