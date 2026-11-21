/**
 * BarberOS — Motor de Fechas de Facturación, Períodos de Calendario y Prorrateo
 * 
 * Reglas de negocio críticas:
 * 1. No asumir que todos los meses tienen 30 días.
 * 2. Manejo estricto de fin de mes (días 28, 29, 30 y 31) con ajuste (clamp) al último día del mes destino.
 * 3. Zona horaria de Colombia (America/Bogota, UTC-5) para evitar desfases de un día por conversión UTC.
 * 4. Extensión continua de suscripciones vigentes: si un cliente renueva antes de vencer, el nuevo período
 *    comienza al expirar el actual, sin perder ni un solo día pagado.
 * 5. Si ya venció, el nuevo período inicia en la fecha efectiva de pago/activación.
 * 6. Período de gracia de hasta 3 días calendario para suscripciones vencidas antes de pausar a Sandbox.
 */

export const COLOMBIA_TIMEZONE = 'America/Bogota'
export const GRACE_PERIOD_DAYS = 3

/**
 * Obtiene la fecha y hora actual garantizando consistencia
 */
export function getNow(): Date {
  return new Date()
}

/**
 * Formatea una fecha en hora estándar de Colombia (es-CO)
 */
export function formatColombiaDate(
  date: Date | string | number | null | undefined,
  includeTime = false
): string {
  if (!date) return '—'
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('es-CO', {
    timeZone: COLOMBIA_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', hour12: true }
      : {})
  })
}

/**
 * Retorna los componentes de fecha (año, mes 0-indexado, día) en la zona horaria de Colombia
 */
export function getColombiaDateParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  // Usar Intl.DateTimeFormat para descomponer en America/Bogota
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  })

  const parts = formatter.formatToParts(date)
  let year = date.getFullYear()
  let month = date.getMonth()
  let day = date.getDate()
  let hour = date.getHours()
  let minute = date.getMinutes()

  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10)
    if (p.type === 'month') month = parseInt(p.value, 10) - 1 // 0-based
    if (p.type === 'day') day = parseInt(p.value, 10)
    if (p.type === 'hour') hour = parseInt(p.value, 10)
    if (p.type === 'minute') minute = parseInt(p.value, 10)
  }

  return { year, month, day, hour, minute }
}

/**
 * Retorna el número de días que tiene un mes en un año determinado
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  // El día 0 del mes siguiente es el último día del mes actual
  return new Date(year, monthIndex + 1, 0).getDate()
}

/**
 * Suma meses calendario reales a una fecha dada, respetando la regla de fin de mes.
 * Ejemplo:
 * - 15 de marzo + 1 mes = 15 de abril.
 * - 31 de enero + 1 mes = 28 de febrero (o 29 en bisiesto).
 * - 31 de agosto + 1 mes = 30 de septiembre.
 * La fecha resultante se fija al final del día (23:59:59.999 Colombia, UTC-5 = 04:59:59.999 UTC día siguiente).
 */
export function addCalendarMonths(startDate: Date, monthsToAdd: number): Date {
  const parts = getColombiaDateParts(startDate)

  let targetYear = parts.year
  let targetMonth = parts.month + monthsToAdd

  if (targetMonth > 11) {
    targetYear += Math.floor(targetMonth / 12)
    targetMonth = targetMonth % 12
  } else if (targetMonth < 0) {
    targetYear += Math.floor(targetMonth / 12)
    targetMonth = ((targetMonth % 12) + 12) % 12
  }

  // Ajustar día al máximo disponible en el mes destino (ej: 31 de enero -> 28 o 29 de febrero)
  const maxDays = getDaysInMonth(targetYear, targetMonth)
  const targetDay = Math.min(parts.day, maxDays)

  // En Colombia (UTC-5), el final del día 23:59:59.999 corresponde a las 04:59:59.999 UTC del día siguiente
  // Creamos la fecha usando UTC explícito para evitar desfases locales del servidor
  const utcDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999))
  // Compensar 5 horas de UTC-5
  utcDate.setUTCHours(utcDate.getUTCHours() + 5)

  return utcDate
}

/**
 * Suma días calendario a una fecha
 */
export function addDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
  return result
}

/**
 * Convierte una cadena YYYY-MM-DD (o ISO) al final del día (23:59:59.999) en hora de Colombia (America/Bogota, UTC-5)
 */
export function parseColombiaExpirationDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput
  }
  const clean = String(dateInput).trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean)
  if (match) {
    const year = parseInt(match[1], 10)
    const monthIndex = parseInt(match[2], 10) - 1
    const day = parseInt(match[3], 10)
    // 23:59:59.999 en Colombia (UTC-5) = 04:59:59.999 UTC del día siguiente
    const utcDate = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999))
    utcDate.setUTCHours(utcDate.getUTCHours() + 5)
    return utcDate
  }
  const parsed = new Date(clean)
  if (isNaN(parsed.getTime())) {
    throw new Error('Fecha de vencimiento no válida')
  }
  return parsed
}

export type SubscriptionLifecycleStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'GRACE_PERIOD'
  | 'EXPIRED_SANDBOX'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'CANCELLED'

export interface LifecycleEvaluation {
  status: SubscriptionLifecycleStatus
  label: string
  isPaidActive: boolean
  isInGracePeriod: boolean
  isTrial: boolean
  isSandbox: boolean
  isSuspended: boolean
  daysRemaining: number | null
  graceDaysRemaining: number | null
  expiresAt: Date | null
}

/**
 * Evalúa el ciclo de vida completo de la suscripción de un negocio
 */
export function evaluateSubscriptionLifecycle(params: {
  businessStatus: string
  subscriptionEndsAt?: Date | string | null
  trialEndsAt?: Date | string | null
  planSlug?: string | null
  now?: Date
}): LifecycleEvaluation {
  const now = params.now || getNow()
  const businessStatus = params.businessStatus

  if (businessStatus === 'SUSPENDED' || businessStatus === 'CANCELLED') {
    return {
      status: businessStatus as any,
      label: businessStatus === 'SUSPENDED' ? 'Membresía Suspendida' : 'Membresía Cancelada',
      isPaidActive: false,
      isInGracePeriod: false,
      isTrial: false,
      isSandbox: false,
      isSuspended: true,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      expiresAt: null
    }
  }

  const subEnd = params.subscriptionEndsAt ? new Date(params.subscriptionEndsAt) : null
  const trialEnd = params.trialEndsAt ? new Date(params.trialEndsAt) : null
  const planSlug = params.planSlug?.toLowerCase() || 'sandbox'
  const isPaidPlan = planSlug !== 'sandbox' && planSlug !== 'trial'

  // 0. Suscripción comercial activa con VIGENCIA INDEFINIDA (sin fecha de expiración ficticia)
  if (isPaidPlan && !subEnd && businessStatus === 'ACTIVE') {
    return {
      status: 'ACTIVE',
      label: 'Vigencia Indefinida',
      isPaidActive: true,
      isInGracePeriod: false,
      isTrial: false,
      isSandbox: false,
      isSuspended: false,
      daysRemaining: null,
      graceDaysRemaining: null,
      expiresAt: null
    }
  }

  // 1. Suscripción de pago con fecha en el futuro
  if (isPaidPlan && subEnd && subEnd.getTime() > now.getTime()) {
    const diffMs = subEnd.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    if (daysRemaining <= 7) {
      return {
        status: 'EXPIRING_SOON',
        label: daysRemaining === 1 ? 'Vence en menos de 24 horas' : `Próxima a vencer (${daysRemaining} días)`,
        isPaidActive: true,
        isInGracePeriod: false,
        isTrial: false,
        isSandbox: false,
        isSuspended: false,
        daysRemaining,
        graceDaysRemaining: null,
        expiresAt: subEnd
      }
    }

    return {
      status: 'ACTIVE',
      label: `Activa (${daysRemaining} días)`,
      isPaidActive: true,
      isInGracePeriod: false,
      isTrial: false,
      isSandbox: false,
      isSuspended: false,
      daysRemaining,
      graceDaysRemaining: null,
      expiresAt: subEnd
    }
  }

  // 2. Período de Gracia para planes de pago vencidos (hasta 3 días calendario)
  if (isPaidPlan && subEnd && subEnd.getTime() <= now.getTime()) {
    const graceEnd = addDays(subEnd, GRACE_PERIOD_DAYS)
    if (now.getTime() <= graceEnd.getTime()) {
      const graceDiffMs = graceEnd.getTime() - now.getTime()
      const graceDaysRemaining = Math.max(1, Math.ceil(graceDiffMs / (1000 * 60 * 60 * 24)))

      return {
        status: 'GRACE_PERIOD',
        label: `En período de gracia (${graceDaysRemaining} día(s) restante(s))`,
        isPaidActive: true, // Se mantiene acceso durante gracia para evitar fricción operativa
        isInGracePeriod: true,
        isTrial: false,
        isSandbox: false,
        isSuspended: false,
        daysRemaining: 0,
        graceDaysRemaining,
        expiresAt: subEnd
      }
    }
  }

  // 3. Período de prueba gratuito activo (30 días)
  if (trialEnd && trialEnd.getTime() > now.getTime() && (businessStatus === 'TRIAL' || !isPaidPlan)) {
    const diffMs = trialEnd.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    return {
      status: 'TRIAL',
      label: `Prueba Gratuita (${daysRemaining} días)`,
      isPaidActive: false,
      isInGracePeriod: false,
      isTrial: true,
      isSandbox: false,
      isSuspended: false,
      daysRemaining,
      graceDaysRemaining: null,
      expiresAt: trialEnd
    }
  }

  // 4. Expirado sin pago o período de gracia agotado -> Modo Sandbox
  return {
    status: 'EXPIRED_SANDBOX',
    label: 'Modo Sandbox (Operación Manual)',
    isPaidActive: false,
    isInGracePeriod: false,
    isTrial: false,
    isSandbox: true,
    isSuspended: false,
    daysRemaining: 0,
    graceDaysRemaining: 0,
    expiresAt: null
  }
}

/**
 * Calcula el prorrateo orientativo para un upgrade entre planes.
 * No genera cobro automático: sirve como sugerencia matemática transparente para el Super Admin.
 */
export function calculateUpgradeProration(params: {
  currentPlanPrice: number
  newPlanPrice: number
  currentPeriodStart: Date
  currentPeriodEnd: Date
  now?: Date
}): {
  totalPeriodDays: number
  daysRemaining: number
  dailyCurrentPrice: number
  dailyNewPrice: number
  unusedCredit: number
  newPlanCostForRemainingDays: number
  suggestedDifference: number
} {
  const now = params.now || getNow()
  const startMs = params.currentPeriodStart.getTime()
  const endMs = params.currentPeriodEnd.getTime()
  const nowMs = now.getTime()

  const totalPeriodDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, Math.round((endMs - nowMs) / (1000 * 60 * 60 * 24)))

  const dailyCurrentPrice = params.currentPlanPrice / totalPeriodDays
  const dailyNewPrice = params.newPlanPrice / totalPeriodDays

  const unusedCredit = Math.round(dailyCurrentPrice * daysRemaining)
  const newPlanCostForRemainingDays = Math.round(dailyNewPrice * daysRemaining)
  const suggestedDifference = Math.max(0, newPlanCostForRemainingDays - unusedCredit)

  return {
    totalPeriodDays,
    daysRemaining,
    dailyCurrentPrice,
    dailyNewPrice,
    unusedCredit,
    newPlanCostForRemainingDays,
    suggestedDifference
  }
}
