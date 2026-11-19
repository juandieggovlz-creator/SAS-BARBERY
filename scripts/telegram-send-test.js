/**
 * BarberOS Sentinel — Envío de Notificación de Prueba a Telegram
 * Uso: npm run telegram:test
 */

require('dotenv').config()

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '')
const chatId = (process.env.TELEGRAM_CHAT_ID || '5734885656').trim().replace(/^["']|["']$/g, '')

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está definido en el archivo .env')
  process.exit(1)
}

if (!chatId) {
  console.error('❌ Error: TELEGRAM_CHAT_ID no está definido en el archivo .env')
  process.exit(1)
}

async function sendTest() {
  console.log(`📤 Enviando notificación de prueba a Chat ID: ${chatId}...`)

  const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
  const text = `<b>🛡️ BarberOS Sentinel — Prueba de Conexión</b>\n\n` +
    `✅ <b>¡Conexión establecida exitosamente!</b>\n` +
    `El canal oficial de monitoreo de BarberOS está en línea y sincronizado.\n\n` +
    `<b>Bot:</b> @BarberOSSentinelBot\n` +
    `<b>Chat ID Autorizado:</b> <code>${chatId}</code>\n` +
    `<b>Fecha y Hora:</b> <code>${now}</code>\n` +
    `<b>Servidor:</b> BarberOS SaaS (Next.js 16 + Neon PostgreSQL)\n\n` +
    `<i>Usa /panel o /status para consultar el estado global.</i>`

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Abrir Panel Sentinel', callback_data: 'p:panel' },
              { text: '🌐 Super Admin Web', url: 'https://sas-barbery.vercel.app/superadmin' }
            ]
          ]
        }
      })
    })

    const data = await response.json()

    if (data.ok) {
      console.log('✅ Mensaje de prueba entregado con éxito a Telegram!')
      console.log(`• Message ID: ${data.result.message_id}`)
      console.log(`• Destinatario: ${data.result.chat.first_name || data.result.chat.title || chatId}`)
    } else {
      console.error('❌ Telegram rechazó el envío:')
      console.error(`• Código de error: ${data.error_code}`)
      console.error(`• Descripción: ${data.description}`)
    }
  } catch (error) {
    console.error('❌ Excepción al conectar con Telegram API:', error.message)
  }
}

sendTest()

