export type WhatsAppProviderType = 'META' | 'BAILEYS' | 'NONE'
export type WhatsAppConnectionStatusType = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_READY' | 'FAILED'

export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
  rawResponse?: unknown
}

export interface SendMessageOptions {
  to: string
  body: string
  businessId: string
  appointmentId?: string
}

export interface InboundMessagePayload {
  from: string
  to?: string
  text?: string
  messageId?: string
  timestamp?: number
  provider: WhatsAppProviderType
  businessId?: string
}

export interface WhatsAppConfigPayload {
  isEnabled: boolean
  provider: WhatsAppProviderType
  phoneNumber?: string | null
  // Meta
  metaPhoneNumberId?: string | null
  metaWabaId?: string | null
  metaAccessToken?: string | null
  metaWebhookSecret?: string | null
  // Baileys
  baileysEndpoint?: string | null
  // Bot & Templates
  botEnabled: boolean
  welcomeMessage?: string | null
  confirmTemplate?: string | null
  reminderTemplate?: string | null
  reminderHoursBefore?: number
}
