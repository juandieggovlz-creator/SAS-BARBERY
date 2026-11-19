/**
 * BarberOS Sentinel — Eliminación controlada del Webhook en Telegram
 * Uso: npm run telegram:delete-webhook
 */

require('dotenv').config()

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '')

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está definido en el archivo .env')
  process.exit(1)
}

async function deleteWebhook() {
  console.log('🗑️ Eliminando Webhook en Telegram API...')

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: false })
    })

    const data = await response.json()

    if (data.ok) {
      console.log('✅ Webhook eliminado exitosamente de Telegram.')
      console.log(`• Descripción: ${data.description}`)
    } else {
      console.error('❌ Error al eliminar el Webhook:')
      console.error(`• Código: ${data.error_code} | Descripción: ${data.description}`)
    }
  } catch (error) {
    console.error('❌ Excepción al conectar con Telegram API:', error.message)
  }
}

deleteWebhook()

