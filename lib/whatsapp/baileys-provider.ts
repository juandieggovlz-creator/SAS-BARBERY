import { WhatsAppSendResult } from './types'

export class BaileysProvider {
  /**
   * Obtiene la URL del microservicio de Baileys
   */
  static getServiceEndpoint(customEndpoint?: string | null): string {
    return (customEndpoint || process.env.BAILEYS_ENDPOINT || 'http://127.0.0.1:3001').replace(/\/+$/, '')
  }

  /**
   * Limpia el número al formato internacional E.164
   */
  static cleanPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return `57${cleaned}`
    }
    return cleaned
  }

  /**
   * Obtiene el código QR en vivo desde el microservicio Baileys
   */
  static async getQrCode(businessId: string, endpoint?: string | null): Promise<{
    success: boolean
    status: 'CONNECTED' | 'QR_READY' | 'CONNECTING' | 'DISCONNECTED'
    qrString?: string | null
    qrCodeDataUrl?: string | null
    phoneNumber?: string | null
    error?: string
  }> {
    try {
      const baseUrl = this.getServiceEndpoint(endpoint)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(`${baseUrl}/api/qr?businessId=${encodeURIComponent(businessId)}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return {
          success: false,
          status: 'DISCONNECTED',
          error: data?.error || `Error HTTP ${res.status} del microservicio Baileys`
        }
      }

      const data = await res.json()
      return {
        success: true,
        status: data.status || 'QR_READY',
        qrString: data.qrString || null,
        qrCodeDataUrl: data.qrCodeDataUrl || null,
        phoneNumber: data.phoneNumber || null
      }
    } catch (err: unknown) {
      console.warn('Microservicio Baileys no disponible en el puerto esperado:', (err as Error)?.message)
      return {
        success: false,
        status: 'DISCONNECTED',
        error: 'El microservicio de Baileys no está corriendo en http://localhost:3001'
      }
    }
  }

  /**
   * Consulta el estado de conexión actual
   */
  static async getStatus(businessId: string, endpoint?: string | null) {
    try {
      const baseUrl = this.getServiceEndpoint(endpoint)
      const res = await fetch(`${baseUrl}/api/status?businessId=${encodeURIComponent(businessId)}`, {
        cache: 'no-store'
      })
      if (res.ok) {
        return await res.json()
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Envía un mensaje a través del microservicio de Baileys
   */
  static async sendTextMessage({
    endpoint,
    sessionId,
    businessId,
    to,
    text
  }: {
    endpoint?: string | null
    sessionId: string
    businessId?: string
    to: string
    text: string
  }): Promise<WhatsAppSendResult> {
    try {
      const recipient = this.cleanPhoneNumber(to)
      if (!recipient) {
        return { success: false, error: 'Número de destinatario inválido' }
      }

      const baseUrl = this.getServiceEndpoint(endpoint)
      const targetBiz = businessId || (sessionId.startsWith('barberos_') ? sessionId.split('_')[1] : sessionId)

      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: targetBiz,
          sessionId,
          to: recipient,
          text
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data?.error || 'Error al enviar por Baileys',
          rawResponse: data
        }
      }

      return {
        success: true,
        messageId: data?.messageId || `baileys_${Date.now()}`,
        rawResponse: data
      }
    } catch (err: unknown) {
      console.error('Error enviando mensaje por Baileys:', err)
      const error = err instanceof Error ? err.message : 'Error al conectar con el servicio Baileys'
      return { success: false, error }
    }
  }

  /**
   * Desconecta la sesión en Baileys
   */
  static async disconnect(businessId: string, endpoint?: string | null): Promise<boolean> {
    try {
      const baseUrl = this.getServiceEndpoint(endpoint)
      const res = await fetch(`${baseUrl}/api/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })
      return res.ok
    } catch {
      return false
    }
  }

  /**
   * Genera un identificador de sesión y string de QR fallback si Baileys no está activo
   */
  static generateSessionData(businessId: string) {
    const sessionId = `barberos_${businessId.substring(0, 8)}`
    const qrString = `2@${Buffer.from(sessionId).toString('base64')},${Math.floor(Date.now() / 60000)},barberos-qr-pairing`
    return {
      sessionId,
      qrString
    }
  }
}

