/**
 * BarberOS Sentinel — Consulta del estado actual del Webhook en Telegram
 * Uso: npm run telegram:get-webhook
 */

require('dotenv').config()

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '')

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está definido en el archivo .env')
  process.exit(1)
}

async function getWebhookInfo() {
  console.log('🔍 Consultando estado del Webhook en Telegram API...')

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    const data = await response.json()

    if (data.ok) {
      console.log('✅ Estado del Webhook:')
      console.log(`• URL configurada: ${data.result.url || '(Ninguna / Modo Polling)'}`)
      console.log(`• Tiene Secret Token: ${data.result.has_custom_certificate ? 'Certificado personalizado' : 'SSL Estándar'}`)
      console.log(`• Actualizaciones pendientes: ${data.result.pending_update_count}`)
      console.log(`• Último error reportado: ${data.result.last_error_message || 'Ninguno'}`)
      if (data.result.last_error_date) {
        console.log(`• Fecha último error: ${new Date(data.result.last_error_date * 1000).toLocaleString('es-CO')}`)
      }
    } else {
      console.error('❌ Error al consultar Telegram API:')
      console.error(`• Código: ${data.error_code} | Descripción: ${data.description}`)
    }
  } catch (error) {
    console.error('❌ Excepción al conectar con Telegram API:', error.message)
  }
}

getWebhookInfo()

