/**
 * BarberOS Sentinel — Registro oficial del Webhook en Telegram Bot API
 * Uso: npm run telegram:set-webhook
 */

require('dotenv').config()

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '')
const webhookUrl = (process.env.TELEGRAM_WEBHOOK_URL || '').trim().replace(/^["']|["']$/g, '')
const secretToken = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '')

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está definido en el archivo .env')
  process.exit(1)
}

if (!webhookUrl) {
  console.error('❌ Error: TELEGRAM_WEBHOOK_URL no está definido en el archivo .env')
  process.exit(1)
}

async function setWebhook() {
  console.log('📡 Registrando Webhook en Telegram API...')
  console.log(`• URL del Webhook: ${webhookUrl}`)
  console.log(`• Secret Token configurado: ${secretToken ? 'Sí (protegido)' : 'No'}`)

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken || undefined,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false
      })
    })

    const data = await response.json()

    if (data.ok) {
      console.log('✅ Webhook registrado con éxito en Telegram!')
      console.log(`• Respuesta de Telegram: ${data.description || 'OK'}`)
    } else {
      console.error('❌ Telegram rechazó el registro del Webhook:')
      console.error(`• Código de error: ${data.error_code}`)
      console.error(`• Descripción: ${data.description}`)
    }
  } catch (error) {
    console.error('❌ Excepción al conectar con Telegram API:', error.message)
  }
}

setWebhook()

