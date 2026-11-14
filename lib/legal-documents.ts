/**
 * BarberOS — Catálogo y Estructura Centralizada de Documentos Legales y Políticas
 * 
 * Define la lista oficial, slugs, categorías, versiones y estado de cada documento legal.
 * Cumple con la Ley 1581 de 2012 (Habeas Data), Ley 1480 de 2011 (Estatuto del Consumidor)
 * y estándares de transparencia de BarberOS.
 */

export interface LegalDocMeta {
  id: string
  slug: string
  route: string
  aliases?: string[]
  title: string
  shortTitle: string
  category: 'CONTRATOS' | 'PRIVACIDAD' | 'OPERACIONES'
  categoryLabel: string
  description: string
  version: string
  effectiveDate: string
  status: 'VIGENTE' | 'ACTUALIZADO' | 'EN_REVISION'
  iconName: string
}

export const LEGAL_DOCUMENTS: LegalDocMeta[] = [
  {
    id: 'terminos-y-condiciones',
    slug: 'terminos-y-condiciones',
    route: '/terminos-y-condiciones',
    aliases: ['/terminos', '/terms'],
    title: 'Términos y Condiciones Generales del Servicio',
    shortTitle: 'Términos y Condiciones',
    category: 'CONTRATOS',
    categoryLabel: 'Marco Contractual',
    description: 'Reglas y acuerdos de uso del software SaaS BarberOS para propietarios de barberías, barberos y clientes.',
    version: '2.0-CO',
    effectiveDate: '12 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'ShieldCheck'
  },
  {
    id: 'politica-de-privacidad',
    slug: 'politica-de-privacidad',
    route: '/politica-de-privacidad',
    aliases: ['/privacidad', '/privacy'],
    title: 'Política de Privacidad y Protección de Datos',
    shortTitle: 'Política de Privacidad',
    category: 'PRIVACIDAD',
    categoryLabel: 'Privacidad & Datos',
    description: 'Políticas de recolección, uso, seguridad y confidencialidad de la información personal en BarberOS.',
    version: '2.0-CO',
    effectiveDate: '12 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'Shield'
  },
  {
    id: 'politica-de-cookies',
    slug: 'politica-de-cookies',
    route: '/politica-de-cookies',
    aliases: ['/cookies'],
    title: 'Política de Cookies y Almacenamiento Local',
    shortTitle: 'Política de Cookies',
    category: 'PRIVACIDAD',
    categoryLabel: 'Privacidad & Datos',
    description: 'Información sobre cookies técnicas de sesión, temas visuales y almacenamiento local no rastreador.',
    version: '2.0-CO',
    effectiveDate: '12 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'Cookie'
  },
  {
    id: 'tratamiento-de-datos',
    slug: 'tratamiento-de-datos',
    route: '/tratamiento-de-datos',
    aliases: ['/habeas-data'],
    title: 'Política de Tratamiento de Datos Personales (Habeas Data)',
    shortTitle: 'Tratamiento de Datos',
    category: 'PRIVACIDAD',
    categoryLabel: 'Privacidad & Datos',
    description: 'Lineamientos específicos bajo la Ley 1581 de 2012 de Colombia, derechos ARCO y procedimientos de consulta y reclamo.',
    version: '2.0-CO',
    effectiveDate: '14 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'FileCheck'
  },
  {
    id: 'cancelacion-y-reembolsos',
    slug: 'cancelacion-y-reembolsos',
    route: '/cancelacion-y-reembolsos',
    aliases: ['/reembolsos', '/cancelaciones'],
    title: 'Política de Cancelación, Inasistencias y Reembolsos',
    shortTitle: 'Cancelaciones y Reembolsos',
    category: 'OPERACIONES',
    categoryLabel: 'Operaciones & Pagos',
    description: 'Reglas de cancelación de citas en barberías, manejo de anticipos/señas y política de suscripciones SaaS.',
    version: '2.0-CO',
    effectiveDate: '14 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'RotateCcw'
  },
  {
    id: 'suscripciones-y-pagos',
    slug: 'suscripciones-y-pagos',
    route: '/suscripciones-y-pagos',
    aliases: ['/pagos', '/planes-condiciones'],
    title: 'Política de Suscripciones, Planes y Pagos SaaS',
    shortTitle: 'Suscripciones y Pagos',
    category: 'OPERACIONES',
    categoryLabel: 'Operaciones & Pagos',
    description: 'Condiciones de cobro de membresías mensuales BarberOS, periodo de prueba gratuito de 14 días y reglas de suspensión.',
    version: '2.0-CO',
    effectiveDate: '14 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'CreditCard'
  },
  {
    id: 'sla',
    slug: 'sla',
    route: '/sla',
    aliases: ['/acuerdo-sla', '/nivel-de-servicio'],
    title: 'Acuerdo de Nivel de Servicio (SLA)',
    shortTitle: 'Acuerdo SLA',
    category: 'OPERACIONES',
    categoryLabel: 'Nivel de Servicio',
    description: 'Metas operativas de disponibilidad (99.5% uptime anual), ventanas de mantenimiento y tiempos de respuesta de soporte técnico.',
    version: '2.0-CO',
    effectiveDate: '12 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'Server'
  },
  {
    id: 'seguridad',
    slug: 'seguridad',
    route: '/seguridad',
    aliases: ['/seguridad-y-datos'],
    title: 'Seguridad, Aislamiento Multi-Tenant y Protección de Datos',
    shortTitle: 'Seguridad y Datos',
    category: 'CONTRATOS',
    categoryLabel: 'Infraestructura',
    description: 'Medidas de seguridad, cifrado SSL/TLS, aislamiento lógico entre barberías y copias de respaldo.',
    version: '2.0-CO',
    effectiveDate: '12 de Noviembre de 2026',
    status: 'VIGENTE',
    iconName: 'Lock'
  }
]

export function getLegalDocBySlug(slug: string): LegalDocMeta | undefined {
  const cleanSlug = slug.toLowerCase().replace(/^\//, '').trim()
  return LEGAL_DOCUMENTS.find(
    (doc) =>
      doc.slug === cleanSlug ||
      doc.id === cleanSlug ||
      (doc.aliases && doc.aliases.some((a) => a.replace(/^\//, '') === cleanSlug))
  )
}

