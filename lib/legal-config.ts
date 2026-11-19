/**
 * BarberOS — Configuración Centralizada de Identidad Legal, Operador y Transparencia
 * 
 * Regla de Oro: NO inventar personerías jurídicas (S.A.S.), NIT ficticios, matrículas
 * mercantiles inexistentes ni certificaciones no auditadas.
 * 
 * Este archivo centraliza la información legal del operador para ser consumida
 * de forma unificada por los Términos y Condiciones, Política de Privacidad,
 * Avisos de Privacidad, SLA y pie de página.
 */

export interface LegalConfig {
  brandName: string
  serviceDescription: string
  jurisdiction: string
  applicableLaw: string
  formalization: {
    isFormalizedSAS: boolean
    personType: 'NATURAL' | 'JURIDICA' | 'EN_CONSTITUCION'
    statusDescription: string
    notice: string
  }
  operator: {
    name: string
    identificationType: string
    identificationNumber: string
    city: string
    department: string
    country: string
    officialEmail: string
    supportEmail: string
    habeasDataEmail: string
    supportWhatsApp: string
    physicalAddressNotice: string
  }
  versions: {
    termsVersion: string
    termsDate: string
    privacyVersion: string
    privacyDate: string
    cookiesVersion: string
    cookiesDate: string
  }
  compliance: {
    habeasDataLaw: string
    consumerProtectionLaw: string
    ecommerceLaw: string
    rnbdRegistered: boolean
    rnbdNotice: string
  }
}

export const LEGAL_CONFIG: LegalConfig = {
  brandName: 'BarberOS',
  serviceDescription:
    'Plataforma tecnológica multiempresa bajo modelo Software as a Service (SaaS) destinada a la automatización de agendas, reservas en línea, liquidación de comisiones y control de operaciones para barberías y salones independientes.',
  jurisdiction: 'República de Colombia',
  applicableLaw: 'Legislación colombiana vigente (Ley 1581 de 2012, Ley 1480 de 2011, Ley 527 de 1999 y normas concordantes)',
  formalization: {
    isFormalizedSAS: false,
    personType: 'EN_CONSTITUCION',
    statusDescription:
      'Proyecto tecnológico propio en etapa de prelanzamiento y apertura comercial en Colombia, operado por su desarrollador y titular responsable en calidad de persona natural con miras a formalización societaria.',
    notice:
      'BarberOS no ostenta actualmente la calidad de sociedad comercial formalizada (S.A.S.) ni publica identificaciones tributarias (NIT) ficticias. Las obligaciones contractuales y de protección de datos se asumen directamente por su titular y responsable del proyecto.',
  },
  operator: {
    name: process.env.OPERATOR_LEGAL_NAME || 'Titular y Desarrollador Responsable de BarberOS',
    identificationType: process.env.OPERATOR_DOC_TYPE || 'C.C.',
    identificationNumber: process.env.OPERATOR_DOC_NUMBER || 'Información disponible bajo solicitud fundamentada',
    city: process.env.OPERATOR_CITY || 'Sincelejo',
    department: process.env.OPERATOR_DEPARTMENT || 'Sucre',
    country: 'Colombia',
    officialEmail: process.env.LEGAL_EMAIL || 'barberos.contacto@gmail.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'barberos.contacto@gmail.com',
    habeasDataEmail: process.env.HABEAS_DATA_EMAIL || 'barberos.contacto@gmail.com',
    supportWhatsApp: '+57 324 206 3393',
    physicalAddressNotice:
      'Canal de notificaciones judiciales y administrativas prioritario vía correo electrónico oficial: barberos.contacto@gmail.com',
  },
  versions: {
    termsVersion: '2.0-CO',
    termsDate: '12 de noviembre de 2026',
    privacyVersion: '2.0-CO',
    privacyDate: '12 de noviembre de 2026',
    cookiesVersion: '2.0-CO',
    cookiesDate: '12 de noviembre de 2026',
  },
  compliance: {
    habeasDataLaw: 'Ley Estatutaria 1581 de 2012 y Decreto Reglamentario 1074 de 2015',
    consumerProtectionLaw: 'Ley 1480 de 2011 (Estatuto del Consumidor)',
    ecommerceLaw: 'Ley 527 de 1999 (Comercio Electrónico y Mensajes de Datos)',
    rnbdRegistered: false,
    rnbdNotice:
      'Conforme a la Circular 002 de 2015 de la SIC y el Decreto 090 de 2018, las personas naturales y microempresas cuyos activos totales no superen 100.000 UVT no están obligadas a registrar sus bases de datos en el RNBD, sin perjuicio del deber irrestricto de cumplir todos los principios y mandatos de la Ley 1581 de 2012.',
  },
}

/**
 * Requisitos pendientes que el titular del proyecto debe suministrar
 * para la formalización definitiva antes o durante la fase comercial.
 */
export function getPendingLegalChecklist(): {
  id: string
  category: 'LEGAL' | 'TRIBUTARIO' | 'COMERCIAL' | 'TÉCNICO'
  priority: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'
  title: string
  description: string
  status: 'PENDIENTE_PROPIETARIO' | 'CONFIGURADO_CODIGO' | 'EN_REVISION_ABOGADO'
}[] {
  return [
    {
      id: 'REQ-01',
      category: 'LEGAL',
      priority: 'ALTO',
      title: 'Constitución societaria (opcional pero recomendada)',
      description:
        'Definir si BarberOS operará formalmente a través de una S.A.S. constituida ante Cámara de Comercio o continuará operando como persona natural comerciante.',
      status: 'PENDIENTE_PROPIETARIO',
    },
    {
      id: 'REQ-02',
      category: 'TRIBUTARIO',
      priority: 'ALTO',
      title: 'RUT actualizado con actividad económica de software',
      description:
        'Inscribir o actualizar el RUT en la DIAN con el código CIIU 6201 (Desarrollo de sistemas) o 6202 y definir el régimen de facturación (electrónica o documento equivalente).',
      status: 'PENDIENTE_PROPIETARIO',
    },
    {
      id: 'REQ-03',
      category: 'TRIBUTARIO',
      priority: 'ALTO',
      title: 'Configuración de pasarela de cobro en Colombia',
      description:
        'Integrar Wompi, ePayco, PayU o Mercado Pago con credenciales de producción para cobros recurrentes de suscripciones con IVA o exclusiones que apliquen.',
      status: 'PENDIENTE_PROPIETARIO',
    },
    {
      id: 'REQ-04',
      category: 'LEGAL',
      priority: 'MEDIO',
      title: 'Revisión final de contratos por abogado colombiano',
      description:
        'Validar las cláusulas de limitación de responsabilidad, acuerdo de transmisión de datos (DPA) y políticas de soporte técnico frente a la SIC.',
      status: 'EN_REVISION_ABOGADO',
    },
    {
      id: 'REQ-05',
      category: 'TÉCNICO',
      priority: 'CRÍTICO',
      title: 'Aislamiento de datos y consentimiento verificable',
      description:
        'Implementado en código: bitácora de auditoría de aceptaciones, trazabilidad de IP, versiones de términos y consentimiento explícito en registro.',
      status: 'CONFIGURADO_CODIGO',
    },
  ]
}

