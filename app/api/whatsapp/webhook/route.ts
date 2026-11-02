import { GET as webhookGET, POST as webhookPOST } from '@/app/api/webhooks/whatsapp/route'

export const dynamic = 'force-dynamic'

/**
 * Endpoint canónico: /api/whatsapp/webhook
 * Soporta la verificación y recepción de eventos para Meta Cloud API y Baileys
 */
export async function GET(request: Request) {
  return webhookGET(request)
}

export async function POST(request: Request) {
  return webhookPOST(request)
}
