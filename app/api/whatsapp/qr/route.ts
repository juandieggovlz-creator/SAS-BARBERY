import { GET as qrGET, POST as qrPOST, DELETE as qrDELETE } from '@/app/api/owner/integrations/whatsapp/qr/route'

export const dynamic = 'force-dynamic'

/**
 * Endpoint canónico: /api/whatsapp/qr
 * Obtiene, regenera o confirma el código QR para conexión directa con WhatsApp
 */
export async function GET(request: Request) {
  return qrGET(request)
}

export async function POST(request: Request) {
  return qrPOST(request)
}

export async function DELETE(request: Request) {
  return qrDELETE()
}

