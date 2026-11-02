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
   * Valida las credenciales en vivo contra Meta Graph API
   */
  static async validateCredentials({
    phoneNumberId,
    accessToken
  }: {
    phoneNumberId: string
    accessToken: string
  }): Promise<{
    valid: boolean
    displayPhoneNumber?: string
    verifiedName?: string
    qualityRating?: string
    error?: string
  }> {
    try {
      const cleanPhoneId = phoneNumberId.trim()
      const cleanToken = accessToken.trim()

      if (!cleanPhoneId || !cleanToken) {
        return {
          valid: false,
          error: 'Phone Number ID y Access Token son requeridos'
        }
      }

      // Consulta a la Graph API de Meta
      const url = `https://graph.facebook.com/v21.0/${cleanPhoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data?.error?.message || data?.error?.error_user_msg || 'Credenciales inválidas en Meta Cloud API'
        return {
          valid: false,
          error: errorMsg
        }
      }

      return {
        valid: true,
        displayPhoneNumber: data.display_phone_number,
        verifiedName: data.verified_name,
        qualityRating: data.quality_rating
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

      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

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
   * Verifica la firma y tokens de webhook de Meta
   */
  static verifyWebhook(mode: string | null, token: string | null, expectedToken: string): boolean {
    return mode === 'subscribe' && token === expectedToken
  }
}

