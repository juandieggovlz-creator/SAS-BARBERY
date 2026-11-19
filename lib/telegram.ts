/**
 * BarberOS Sentinel — Telegram Bot Client API
 * 
 * Provee clientes HTTP para comunicación directa con la API oficial de Telegram Bot.
 * Compatible con entornos Vercel Serverless (fetch nativo, sin dependencias pesadas).
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export interface TelegramInlineButton {
  text: string
  callback_data?: string
  url?: string
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineButton[][]
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2'
  reply_markup?: TelegramInlineKeyboardMarkup
  disable_web_page_preview?: boolean
}

/**
 * Obtiene el token del bot desde el entorno
 */
export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno.')
  }
  return token.trim().replace(/^["']|["']$/g, '')
}

/**
 * Ejecuta una petición HTTP a la API de Telegram
 */
async function callTelegramApi<T = any>(method: string, payload?: Record<string, any>): Promise<{ ok: boolean; result?: T; description?: string; error_code?: number }> {
  try {
    const token = getTelegramBotToken()
    const url = `${TELEGRAM_API_BASE}${token}/${method}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok || !data.ok) {
      console.error(`[Telegram API Error] ${method}:`, data)
    }
    return data
  } catch (error: any) {
    console.error(`[Telegram Fetch Exception] ${method}:`, error?.message || error)
    return {
      ok: false,
      description: error?.message || 'Error de red al conectar con Telegram API',
    }
  }
}

/**
 * Obtiene información del bot autenticado
 */
export async function getTelegramMe() {
  return callTelegramApi('getMe')
}

/**
 * Envía un mensaje de texto formateado por chat ID
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: SendMessageOptions = {}
) {
  return callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode || 'HTML',
    reply_markup: options.reply_markup,
    disable_web_page_preview: options.disable_web_page_preview ?? true,
  })
}

/**
 * Edita un mensaje de texto existente (útil para navegación interactiva sin saturar el chat)
 */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options: SendMessageOptions = {}
) {
  return callTelegramApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parse_mode || 'HTML',
    reply_markup: options.reply_markup,
    disable_web_page_preview: options.disable_web_page_preview ?? true,
  })
}

/**
 * Responde a una pulsación de botón inline (callback query)
 */
export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
) {
  return callTelegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  })
}

/**
 * Registra o actualiza la URL del Webhook en Telegram
 */
export async function setTelegramWebhook(url: string, secretToken?: string) {
  return callTelegramApi('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  })
}

/**
 * Obtiene el estado actual del webhook
 */
export async function getTelegramWebhookInfo() {
  return callTelegramApi('getWebhookInfo')
}

/**
 * Elimina el webhook registrado
 */
export async function deleteTelegramWebhook(dropPendingUpdates: boolean = false) {
  return callTelegramApi('deleteWebhook', {
    drop_pending_updates: dropPendingUpdates,
  })
}

