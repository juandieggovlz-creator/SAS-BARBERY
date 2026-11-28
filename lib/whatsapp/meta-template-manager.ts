import { prisma } from '../prisma'
import { safeDecryptToken } from '@/lib/crypto'

export interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  text?: string
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO'
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
    example?: string[]
  }>
  example?: {
    body_text?: string[][]
    header_text?: string[]
  }
}

export interface StandardTemplateDefinition {
  name: string
  category: 'UTILITY'
  language: string
  label: string
  description: string
  components: MetaTemplateComponent[]
}

/**
 * 4 Plantillas estándar oficiales de BarberOS para Meta WhatsApp Business API.
 * Categoría estrictamente UTILITY para optimizar la compatibilidad con las políticas de Meta y reducir costos de mensajería.
 */
export const STANDARD_TEMPLATES: Record<string, StandardTemplateDefinition> = {
  barberos_confirmacion_reserva: {
    name: 'barberos_confirmacion_reserva',
    category: 'UTILITY',
    language: 'es',
    label: 'Confirmación de Reserva',
    description: 'Notificación transaccional inmediata cuando el cliente agenda una cita en línea.',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, tu reserva en {{2}} (Sede {{3}}) para el {{4}} a las {{5}} con el barbero {{6}} ({{7}} por {{8}}) ha sido confirmada con éxito. Código de reserva: {{9}}.',
        example: {
          body_text: [
            ['Carlos Mendoza', 'Barbería Elite', 'Sede Principal', 'Viernes 15 de Octubre', '10:00 AM', 'Andrés Pérez', 'Corte y Perfilado', '$35.000 COP', 'BARB-9876']
          ]
        }
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Ver mi reserva',
            url: 'https://sas-barbery.vercel.app/b/{{1}}',
            example: ['barberia-elite']
          }
        ]
      }
    ]
  },

  barberos_recordatorio_cita: {
    name: 'barberos_recordatorio_cita',
    category: 'UTILITY',
    language: 'es',
    label: 'Recordatorio con Botones Nativos',
    description: 'Recordatorio previo a la cita con 3 botones interactivos de acción rápida.',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, te recordamos tu cita en {{2}} (Sede {{3}}) para el {{4}} a las {{5}} con {{6}} ({{7}}). Código: {{8}}. Por favor confirma tu asistencia o gestiona tu horario con los botones inferiores:',
        example: {
          body_text: [
            ['Carlos Mendoza', 'Barbería Elite', 'Sede Principal', 'Hoy', '3:00 PM', 'Andrés Pérez', 'Corte Clásico', 'BARB-9876']
          ]
        }
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Sí, asistiré'
          },
          {
            type: 'QUICK_REPLY',
            text: 'Reprogramar cita'
          },
          {
            type: 'QUICK_REPLY',
            text: 'Cancelar cita'
          }
        ]
      }
    ]
  },

  barberos_reprogramacion_cita: {
    name: 'barberos_reprogramacion_cita',
    category: 'UTILITY',
    language: 'es',
    label: 'Reprogramación de Cita',
    description: 'Notificación cuando se actualiza la fecha u hora de una cita.',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, tu cita en {{2}} ha sido reprogramada con éxito para el {{3}} a las {{4}} con {{5}} ({{6}}). Código: {{7}}.',
        example: {
          body_text: [
            ['Carlos Mendoza', 'Barbería Elite', 'Sábado 16 de Octubre', '11:00 AM', 'Andrés Pérez', 'Corte Clásico', 'BARB-9876']
          ]
        }
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Ver mi cita',
            url: 'https://sas-barbery.vercel.app/b/{{1}}',
            example: ['barberia-elite']
          }
        ]
      }
    ]
  },

  barberos_cancelacion_cita: {
    name: 'barberos_cancelacion_cita',
    category: 'UTILITY',
    language: 'es',
    label: 'Cancelación de Cita',
    description: 'Notificación formal cuando una cita es cancelada por el cliente o la barbería.',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, te informamos que tu cita en {{2}} programada para el {{3}} a las {{4}} ha sido cancelada. Código: {{5}}. Si deseas agendar en otra oportunidad, puedes hacerlo desde nuestro enlace web.',
        example: {
          body_text: [
            ['Carlos Mendoza', 'Barbería Elite', 'Viernes 15 de Octubre', '10:00 AM', 'BARB-9876']
          ]
        }
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Agendar nueva cita',
            url: 'https://sas-barbery.vercel.app/b/{{1}}',
            example: ['barberia-elite']
          }
        ]
      }
    ]
  }
}

export interface MetaTemplateSyncResult {
  success: boolean
  wabaId: string
  templates: Record<string, {
    id?: string
    name: string
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_CREATED'
    category?: string
    language?: string
    rejectedReason?: string | null
    lastUpdated?: string
  }>
  createdCount: number
  error?: string
}

export class MetaTemplateManager {
  private static GRAPH_VERSION = 'v22.0'
  private static BASE_URL = `https://graph.facebook.com/${MetaTemplateManager.GRAPH_VERSION}`

  /**
   * Consulta las plantillas registradas en la WABA en Meta
   */
  static async fetchRemoteTemplates({
    wabaId,
    accessToken
  }: {
    wabaId: string
    accessToken: string
  }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const url = `${this.BASE_URL}/${wabaId}/message_templates?fields=id,name,status,category,language,components,rejected_reason&limit=100`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data?.error?.message || `Error HTTP ${res.status} al consultar plantillas de Meta`
        }
      }

      return {
        success: true,
        data: Array.isArray(data.data) ? data.data : []
      }
    } catch (err: any) {
      console.error('[MetaTemplateManager] Error en fetchRemoteTemplates:', err)
      return { success: false, error: err?.message || 'Error de conexión con Meta Graph API' }
    }
  }

  /**
   * Envía la solicitud de creación de una plantilla oficial a Meta
   */
  static async createRemoteTemplate({
    wabaId,
    accessToken,
    template
  }: {
    wabaId: string
    accessToken: string
    template: StandardTemplateDefinition
  }): Promise<{ success: boolean; templateId?: string; status?: string; error?: string }> {
    try {
      const url = `${this.BASE_URL}/${wabaId}/message_templates`
      const payload = {
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.components
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data?.error?.message || `Error al crear plantilla ${template.name}`
        }
      }

      return {
        success: true,
        templateId: data.id,
        status: data.status || 'PENDING'
      }
    } catch (err: any) {
      console.error(`[MetaTemplateManager] Error creando plantilla ${template.name}:`, err)
      return { success: false, error: err?.message || 'Error de red creando plantilla' }
    }
  }

  /**
   * Sincroniza y asegura las plantillas requeridas en la WABA de una barbería.
   * Si faltan plantillas estándar, las crea automáticamente.
   */
  static async ensureAndSyncTemplates({
    businessId,
    wabaId,
    accessToken
  }: {
    businessId: string
    wabaId: string
    accessToken: string
  }): Promise<MetaTemplateSyncResult> {
    const cleanWabaId = wabaId.trim()
    const cleanToken = accessToken.trim()

    if (!cleanWabaId || !cleanToken) {
      return {
        success: false,
        wabaId: cleanWabaId,
        templates: {},
        createdCount: 0,
        error: 'WABA ID y Access Token son requeridos para gestionar plantillas.'
      }
    }

    // 1. Obtener plantillas remotas existentes
    const remoteRes = await this.fetchRemoteTemplates({
      wabaId: cleanWabaId,
      accessToken: cleanToken
    })

    if (!remoteRes.success) {
      return {
        success: false,
        wabaId: cleanWabaId,
        templates: {},
        createdCount: 0,
        error: remoteRes.error
      }
    }

    const existingTemplatesMap = new Map<string, any>()
    for (const t of remoteRes.data || []) {
      if (t.name) {
        existingTemplatesMap.set(t.name.toLowerCase(), t)
      }
    }

    const templatesStatus: MetaTemplateSyncResult['templates'] = {}
    let createdCount = 0

    // 2. Revisar cada plantilla estándar obligatoria
    for (const [key, standardDef] of Object.entries(STANDARD_TEMPLATES)) {
      const existing = existingTemplatesMap.get(key.toLowerCase())

      if (existing) {
        // La plantilla ya existe en Meta
        templatesStatus[key] = {
          id: existing.id,
          name: existing.name,
          status: (existing.status as any) || 'PENDING',
          category: existing.category,
          language: existing.language,
          rejectedReason: existing.rejected_reason || null,
          lastUpdated: new Date().toISOString()
        }
      } else {
        // La plantilla no existe: crearla automáticamente vía API
        const createRes = await this.createRemoteTemplate({
          wabaId: cleanWabaId,
          accessToken: cleanToken,
          template: standardDef
        })

        if (createRes.success) {
          createdCount++
          templatesStatus[key] = {
            id: createRes.templateId,
            name: standardDef.name,
            status: (createRes.status as any) || 'PENDING',
            category: standardDef.category,
            language: standardDef.language,
            rejectedReason: null,
            lastUpdated: new Date().toISOString()
          }
        } else {
          templatesStatus[key] = {
            name: standardDef.name,
            status: 'NOT_CREATED',
            category: standardDef.category,
            language: standardDef.language,
            rejectedReason: createRes.error || 'Error al enviar a aprobación',
            lastUpdated: new Date().toISOString()
          }
        }
      }
    }

    // 3. Persistir en la base de datos para todas las sedes que compartan este WABA
    const now = new Date()
    const syncStatus = Object.values(templatesStatus).every(t => t.status === 'APPROVED')
      ? 'SYNCED'
      : Object.values(templatesStatus).some(t => t.status === 'REJECTED' || t.status === 'NOT_CREATED')
      ? 'ERROR'
      : 'PENDING'

    // Actualizar sede actual y sedes hermanas de la misma empresa con el mismo WABA
    await prisma.whatsAppIntegration.updateMany({
      where: {
        OR: [
          { businessId },
          { metaWabaId: cleanWabaId }
        ]
      },
      data: {
        metaTemplatesData: templatesStatus as any,
        metaTemplatesSyncStatus: syncStatus,
        templatesLastSyncedAt: now,
        lastSyncedAt: now
      }
    })

    return {
      success: true,
      wabaId: cleanWabaId,
      templates: templatesStatus,
      createdCount
    }
  }

  /**
   * Verifica si una plantilla específica está aprobada y lista para usarse
   */
  static isTemplateApproved(
    templatesData: any,
    templateName: string
  ): boolean {
    if (!templatesData || typeof templatesData !== 'object') return false
    const t = templatesData[templateName]
    return t?.status === 'APPROVED'
  }

  /**
   * Helper que resuelve credenciales de la base de datos para una sede y ejecuta la sincronización
   */
  static async syncTemplatesForBusiness(businessId: string): Promise<MetaTemplateSyncResult> {
    let integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId }
    })

    if (!integration || !integration.metaWabaId || !integration.metaAccessToken) {
      const branch = await prisma.business.findUnique({
        where: { id: businessId },
        select: { companyId: true }
      })
      if (branch?.companyId) {
        integration = await prisma.whatsAppIntegration.findFirst({
          where: {
            business: { companyId: branch.companyId, isMainBranch: true },
            isEnabled: true
          }
        })
      }
    }

    if (!integration || !integration.metaWabaId || !integration.metaAccessToken) {
      return {
        success: false,
        wabaId: integration?.metaWabaId || '',
        templates: {},
        createdCount: 0,
        error: 'Integración no configurada con WABA ID o Access Token'
      }
    }

    const decryptedToken = safeDecryptToken(integration.metaAccessToken)
    if (!decryptedToken) {
      return {
        success: false,
        wabaId: integration.metaWabaId,
        templates: {},
        createdCount: 0,
        error: 'No se pudo descifrar el token de acceso de Meta'
      }
    }

    return this.ensureAndSyncTemplates({
      businessId,
      wabaId: integration.metaWabaId,
      accessToken: decryptedToken
    })
  }
}
