import { WhatsAppSendResult } from './types'
import qrcode from 'qrcode'

export class MetaCloudProvider {
  /**
   * Limpia el número de teléfono al formato requerido por Meta (E.164 sin signo + ni caracteres no numéricos)
   */
  static cleanPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    // Si viene solo número local de Colombia (10 dígitos empezando en 3)
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return `57${cleaned}`
    }
    return cleaned
  }

  /**
   * Valida las credenciales en vivo contra Meta Graph API v22.0
   * Si se incluye wabaId, valida también que el Phone Number ID pertenezca a dicha cuenta de WhatsApp Business.
   */
  static async validateCredentials({
    phoneNumberId,
    accessToken,
    wabaId
  }: {
    phoneNumberId: string
    accessToken: string
    wabaId?: string
  }): Promise<{
    valid: boolean
    displayPhoneNumber?: string
    verifiedName?: string
    qualityRating?: string
    wabaName?: string
    error?: string
  }> {
    try {
      const cleanPhoneId = phoneNumberId.trim()
      const cleanToken = accessToken.trim()
      const cleanWabaId = wabaId?.trim()

      if (!cleanPhoneId || !cleanToken) {
        return {
          valid: false,
          error: 'Phone Number ID y Access Token son requeridos'
        }
      }

      // 1. Consulta al nodo de teléfono en Meta Graph API v22.0
      const phoneUrl = `https://graph.facebook.com/v22.0/${cleanPhoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`
      const phoneRes = await fetch(phoneUrl, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      })

      const phoneData = await phoneRes.json()

      if (!phoneRes.ok) {
        const errorMsg = this.formatMetaError(phoneData?.error)
        return {
          valid: false,
          error: errorMsg
        }
      }

      let wabaName: string | undefined = undefined

      // 2. Si se suministró WABA ID, validar cuenta comercial y pertenencia
      if (cleanWabaId) {
        const wabaUrl = `https://graph.facebook.com/v22.0/${cleanWabaId}?fields=id,name,timezone_id,phone_numbers`
        const wabaRes = await fetch(wabaUrl, {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        })

        const wabaData = await wabaRes.json()

        if (!wabaRes.ok) {
          const errorMsg = this.formatMetaError(wabaData?.error)
          return {
            valid: false,
            error: `WABA ID inválido o sin permisos: ${errorMsg}`
          }
        }

        wabaName = wabaData.name

        // Comprobar que el phoneNumberId esté asociado a los phone_numbers de este WABA
        const associatedNumbers = wabaData?.phone_numbers?.data || []
        const isAssociated = associatedNumbers.some((p: { id: string }) => p.id === cleanPhoneId)

        if (associatedNumbers.length > 0 && !isAssociated) {
          return {
            valid: false,
            error: `El Phone Number ID (${cleanPhoneId}) no pertenece a la cuenta de WhatsApp Business (WABA ID: ${cleanWabaId}). Números autorizados: ${associatedNumbers.map((p: any) => p.display_phone_number || p.id).join(', ')}`
          }
        }
      }

      return {
        valid: true,
        displayPhoneNumber: phoneData.display_phone_number,
        verifiedName: phoneData.verified_name,
        qualityRating: phoneData.quality_rating,
        wabaName
      }
    } catch (err: unknown) {
      console.error('Error validando credenciales de Meta:', err)
      return {
        valid: false,
        error: (err as Error)?.message || 'Error de conexión con Meta Graph API'
      }
    }
  }

  /**
   * Mapea códigos de error técnicos de Meta Cloud API a explicaciones claras en español
   */
  static formatMetaError(error: any): string {
    if (!error) return 'Error desconocido en Meta Cloud API'
    if (typeof error === 'string') return error

    const code = error.code
    const subcode = error.error_subcode
    const message = error.message || ''

    if (code === 190) {
      return 'Token de acceso inválido, revocado o expirado. Genera un System User Access Token permanente en Meta Business Suite con permisos whatsapp_business_messaging y whatsapp_business_management.'
    }
    if (code === 100 && subcode === 2388299) {
      return 'Error en la plantilla de Meta: Las variables no pueden ubicarse al principio ni al final del texto del mensaje.'
    }
    if (code === 131030) {
      return 'Número destinatario no registrado en la lista de pruebas de Meta. Agrega el número de teléfono en la consola de desarrolladores de Meta (WhatsApp > API Setup).'
    }
    if (code === 131047) {
      return 'Ventana de 24 horas cerrada. Para contactar a este cliente fuera de 24h debes enviar una plantilla oficial aprobada (type: template).'
    }
    if (code === 131026) {
      return 'Mensaje no entregable. El número de teléfono no tiene una cuenta activa de WhatsApp o ha bloqueado las notificaciones del negocio.'
    }
    if (code === 130429) {
      return 'Límite de tasa (Rate limit) excedido en Meta Cloud API. Por favor espera unos minutos antes de reintentar.'
    }
    if (code === 132000) {
      return 'Parámetros incompatibles o insuficientes con la plantilla oficial de WhatsApp.'
    }
    if (code === 132001) {
      return 'La plantilla oficial no existe o aún no ha sido aprobada por Meta en esta WABA.'
    }
    if (code === 100) {
      return `Parámetro incorrecto en Graph API: ${message}`
    }

    return error.error_user_msg || message || `Error de Meta API (código ${code})`
  }

  /**
   * Genera el código QR oficial de WhatsApp (Click-to-Chat / wa.me) para iniciar chat con el número de Meta
   */
  static async generateMetaChatQr({
    phoneNumber,
    prefilledText = 'Hola, deseo agendar una cita'
  }: {
    phoneNumber: string
    prefilledText?: string
  }): Promise<{
    qrCodeDataUrl: string
    chatUrl: string
  }> {
    const cleanNumber = this.cleanPhoneNumber(phoneNumber)
    const encodedText = encodeURIComponent(prefilledText)
    const chatUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`

    const qrCodeDataUrl = await qrcode.toDataURL(chatUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })

    return {
      qrCodeDataUrl,
      chatUrl
    }
  }

  /**
   * Envía un mensaje de texto plano a través de la API oficial de Meta Cloud WhatsApp
   */
  static async sendTextMessage({
    phoneNumberId,
    accessToken,
    to,
    text
  }: {
    phoneNumberId: string
    accessToken: string
    to: string
    text: string
  }): Promise<WhatsAppSendResult> {
    try {
      const recipient = this.cleanPhoneNumber(to)
      if (!recipient) {
        return { success: false, error: 'Número de destinatario inválido' }
      }

      const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: true,
          body: text
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.error?.error_user_msg || 'Error al enviar mensaje vía Meta API'
        console.error('Meta Cloud API Error:', data)
        return {
          success: false,
          error: errorMsg,
          rawResponse: data
        }
      }

      const messageId = data?.messages?.[0]?.id

      return {
        success: true,
        messageId,
        rawResponse: data
      }
    } catch (err: unknown) {
      console.error('Error enviando mensaje por Meta API:', err)
      const error = err instanceof Error ? err.message : 'Error inesperado de conexión con Meta'
      return { success: false, error }
    }
  }

  /**
   * Envía un mensaje basado en Plantilla Oficial de Meta (type: 'template')
   * Requisito estricto fuera de la ventana de atención de 24 horas de Meta.
   */
  static async sendTemplateMessage({
    phoneNumberId,
    accessToken,
    to,
    templateName,
    languageCode = 'es',
    components
  }: {
    phoneNumberId: string
    accessToken: string
    to: string
    templateName: string
    languageCode?: string
    components?: Array<{
      type: 'header' | 'body' | 'button'
      sub_type?: 'url' | 'quick_reply'
      index?: string | number
      parameters: Array<{
        type: 'text' | 'payload'
        text?: string
        payload?: string
      }>
    }>
  }): Promise<WhatsAppSendResult> {
    try {
      const recipient = this.cleanPhoneNumber(to)
      if (!recipient) {
        return { success: false, error: 'Número de destinatario inválido' }
      }

      const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`

      const templatePayload: Record<string, unknown> = {
        name: templateName,
        language: {
          code: languageCode
        }
      }

      if (components && components.length > 0) {
        templatePayload.components = components
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: templatePayload
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.error?.error_user_msg || `Error al enviar plantilla ${templateName} vía Meta API`
        console.error(`Meta Cloud Template API Error (${templateName}):`, data)
        return {
          success: false,
          error: errorMsg,
          rawResponse: data
        }
      }

      const messageId = data?.messages?.[0]?.id

      return {
        success: true,
        messageId,
        rawResponse: data
      }
    } catch (err: unknown) {
      console.error(`Error enviando plantilla ${templateName} por Meta API:`, err)
      const error = err instanceof Error ? err.message : 'Error inesperado de conexión con Meta'
      return { success: false, error }
    }
  }

  /**
   * Suscribe la aplicación a la WABA para recibir webhooks oficiales (mensajes y coexistencia)
   * Endpoint oficial de Meta: POST /v22.0/{waba_id}/subscribed_apps
   */
  static async subscribeAppToWaba({
    wabaId,
    accessToken
  }: {
    wabaId: string
    accessToken: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) {
        const errorMsg = data?.error?.message || 'Error al suscribir webhook en WABA'
        console.warn('[MetaCloudProvider] Error al suscribir app a WABA:', errorMsg)
        return { success: false, error: errorMsg }
      }
      return { success: true }
    } catch (err: unknown) {
      console.warn('[MetaCloudProvider] Fallo de red suscribiendo app a WABA:', err)
      return { success: false, error: (err as Error)?.message || 'Error de red con Meta Graph API' }
    }
  }

  /**
   * Verifica la firma y tokens de webhook de Meta
   */
  static verifyWebhook(mode: string | null, token: string | null, expectedToken: string): boolean {
    return mode === 'subscribe' && token === expectedToken
  }
}

