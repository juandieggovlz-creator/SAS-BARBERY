/**
 * BarberOS — Deposit (Anticipos) Configuration Parser & Serializer
 * ================================================================
 * Reutiliza las columnas existentes en `Business`:
 *   - depositEnabled (Boolean)
 *   - depositType ("PERCENTAGE" | "FIXED")
 *   - depositPercentage (Int)
 *   - depositFixedAmount (Decimal)
 *   - depositInstructions (String?)
 *
 * Para soportar medios de pago estructurados (Nequi, Daviplata, Bre-B,
 * Transferencia Bancaria, titular, QR y tiempo de reserva temporal) sin
 * migraciones destructivas, serializa la configuración extendida en un bloque
 * delimitado al final de `depositInstructions` y expone helpers limpios.
 */

export interface CustomDepositMethod {
  id: string
  name: string
  accountNumber?: string
  accountHolder?: string
  extraDetails?: string
  qrUrl?: string
  enabled: boolean
}

export interface DepositPaymentMethodsConfig {
  nequiEnabled: boolean
  nequiNumber: string
  nequiHolder: string
  nequiQrUrl?: string
  daviplataEnabled: boolean
  daviplataNumber: string
  daviplataHolder: string
  daviplataQrUrl?: string
  brebEnabled: boolean
  brebKey: string
  brebEntity?: string
  brebHolder: string
  brebQrUrl?: string
  bankEnabled: boolean
  bankName: string
  bankAccountType: string
  bankAccountNumber: string
  bankHolder: string
  bankQrUrl?: string
  customMethods?: CustomDepositMethod[]
  holdMinutes: number
  requireProof: boolean
  cancellationPolicy: string
}

export interface ParsedBusinessDepositConfig {
  depositEnabled: boolean
  depositType: 'PERCENTAGE' | 'FIXED'
  depositPercentage: number
  depositFixedAmount: number
  cleanInstructions: string
  paymentMethods: DepositPaymentMethodsConfig
}

const CFG_MARKER_START = '<!--BARBEROS_DEPOSIT_CFG:'
const CFG_MARKER_END = '-->'

export const DEFAULT_PROFESSIONAL_INSTRUCTIONS = `¡Gracias por reservar con nosotros!
Para garantizar tu cupo exclusivo y preparar la atención de tu barbero, solicitamos un anticipo de reserva.

Pasos para completar tu cita:
1. Elige tu medio de pago autorizado (Nequi, Daviplata, Bre-B, Transferencia Bancaria o personalizado).
2. Transfiere el importe exacto del anticipo indicado en el resumen.
3. Copia el número/llave o escanea el código QR oficial.
4. Verifica que el titular del destinatario coincida en tu aplicación bancaria antes de confirmar el pago.
5. Sube la captura legible de tu comprobante en el botón correspondiente.
6. Tu cita permanecerá protegida en estado "Pago en verificación" hasta que el equipo de la barbería verifique el ingreso.
7. Si el comprobante no es legible o vence el tiempo límite de reserva temporal, el horario se liberará automáticamente para otros clientes.`;

export const DEFAULT_PAYMENT_METHODS_CONFIG: DepositPaymentMethodsConfig = {
  nequiEnabled: false,
  nequiNumber: '',
  nequiHolder: '',
  nequiQrUrl: '',
  daviplataEnabled: false,
  daviplataNumber: '',
  daviplataHolder: '',
  daviplataQrUrl: '',
  brebEnabled: false,
  brebKey: '',
  brebEntity: 'Bancolombia',
  brebHolder: '',
  brebQrUrl: '',
  bankEnabled: false,
  bankName: 'Bancolombia',
  bankAccountType: 'Ahorros',
  bankAccountNumber: '',
  bankHolder: '',
  bankQrUrl: '',
  customMethods: [],
  holdMinutes: 30,
  requireProof: true,
  cancellationPolicy:
    'El anticipo asegura tu cupo exclusivo. Puedes reprogramar sin costo avisando con al menos 3 horas de anticipación.',
}

export function extractDepositInstructionsAndConfig(rawInstructions?: string | null): {
  cleanInstructions: string
  paymentMethods: DepositPaymentMethodsConfig
} {
  if (!rawInstructions || typeof rawInstructions !== 'string') {
    return {
      cleanInstructions: '',
      paymentMethods: { ...DEFAULT_PAYMENT_METHODS_CONFIG },
    }
  }

  const startIdx = rawInstructions.indexOf(CFG_MARKER_START)
  if (startIdx === -1) {
    return {
      cleanInstructions: rawInstructions.trim(),
      paymentMethods: { ...DEFAULT_PAYMENT_METHODS_CONFIG },
    }
  }

  const cleanInstructions = rawInstructions.slice(0, startIdx).trim()
  const jsonStart = startIdx + CFG_MARKER_START.length
  const endIdx = rawInstructions.indexOf(CFG_MARKER_END, jsonStart)
  if (endIdx === -1) {
    return {
      cleanInstructions,
      paymentMethods: { ...DEFAULT_PAYMENT_METHODS_CONFIG },
    }
  }

  try {
    const parsed = JSON.parse(rawInstructions.slice(jsonStart, endIdx))
    return {
      cleanInstructions,
      paymentMethods: {
        ...DEFAULT_PAYMENT_METHODS_CONFIG,
        ...parsed,
        holdMinutes: Math.min(240, Math.max(5, Number(parsed?.holdMinutes) || 30)),
      },
    }
  } catch {
    return {
      cleanInstructions,
      paymentMethods: { ...DEFAULT_PAYMENT_METHODS_CONFIG },
    }
  }
}

export function serializeDepositInstructionsWithConfig(
  cleanInstructions: string,
  paymentMethods?: Partial<DepositPaymentMethodsConfig> | null
): string {
  const merged: DepositPaymentMethodsConfig = {
    ...DEFAULT_PAYMENT_METHODS_CONFIG,
    ...(paymentMethods || {}),
    holdMinutes: Math.min(240, Math.max(5, Number(paymentMethods?.holdMinutes) || 30)),
  }
  const clean = (cleanInstructions || '').replace(/<!--BARBEROS_DEPOSIT_CFG:[\s\S]*?-->/g, '').trim()
  return `${clean}\n${CFG_MARKER_START}${JSON.stringify(merged)}${CFG_MARKER_END}`.trim()
}

export function parseBusinessDepositConfig(business: {
  depositEnabled?: boolean | null
  depositType?: string | null
  depositPercentage?: number | null
  depositFixedAmount?: unknown
  depositInstructions?: string | null
}): ParsedBusinessDepositConfig {
  const { cleanInstructions, paymentMethods } = extractDepositInstructionsAndConfig(
    business.depositInstructions
  )

  return {
    depositEnabled: Boolean(business.depositEnabled),
    depositType: business.depositType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    depositPercentage: Math.min(90, Math.max(5, Number(business.depositPercentage) || 30)),
    depositFixedAmount: Math.max(0, Number(business.depositFixedAmount) || 0),
    cleanInstructions,
    paymentMethods,
  }
}

export function calculateDepositAmount(
  totalPrice: number,
  config: {
    depositEnabled?: boolean | null
    depositType?: string | null
    depositPercentage?: number | null
    depositFixedAmount?: unknown
  }
): {
  depositRequired: number
  remainingBalance: number
} {
  const cleanTotal = Math.max(0, Math.round(Number(totalPrice) || 0))
  if (!config.depositEnabled || cleanTotal <= 0) {
    return { depositRequired: 0, remainingBalance: cleanTotal }
  }

  let depositRequired = 0
  if (config.depositType === 'FIXED') {
    depositRequired = Math.min(cleanTotal, Math.max(0, Math.round(Number(config.depositFixedAmount) || 0)))
  } else {
    const pct = Math.min(90, Math.max(5, Number(config.depositPercentage) || 30))
    depositRequired = Math.round((cleanTotal * pct) / 100)
  }

  const remainingBalance = Math.max(0, cleanTotal - depositRequired)
  return { depositRequired, remainingBalance }
}

/**
 * Genera un resumen legible de los medios de pago configurados para WhatsApp o texto plano
 */
export function formatPaymentMethodsSummary(
  config: ParsedBusinessDepositConfig
): string {
  const lines: string[] = []
  const pm = config.paymentMethods

  if (pm.nequiEnabled && pm.nequiNumber) {
    lines.push(`• *Nequi:* ${pm.nequiNumber}${pm.nequiHolder ? ` (${pm.nequiHolder})` : ''}`)
  }
  if (pm.daviplataEnabled && pm.daviplataNumber) {
    lines.push(`• *Daviplata:* ${pm.daviplataNumber}${pm.daviplataHolder ? ` (${pm.daviplataHolder})` : ''}`)
  }
  if (pm.brebEnabled && pm.brebKey) {
    const entityNotice = pm.brebEntity ? ` [${pm.brebEntity}]` : ''
    lines.push(`• *Llave Bre-B:* ${pm.brebKey}${entityNotice}${pm.brebHolder ? ` (${pm.brebHolder})` : ''}`)
  }
  if (pm.bankEnabled && pm.bankAccountNumber) {
    lines.push(
      `• *${pm.bankName || 'Banco'} (${pm.bankAccountType || 'Ahorros'}):* ${pm.bankAccountNumber}${
        pm.bankHolder ? ` - ${pm.bankHolder}` : ''
      }`
    )
  }
  if (Array.isArray(pm.customMethods)) {
    for (const cm of pm.customMethods) {
      if (cm.enabled && cm.name) {
        lines.push(`• *${cm.name}:* ${cm.accountNumber || ''}${cm.accountHolder ? ` (${cm.accountHolder})` : ''}`)
      }
    }
  }
  if (config.cleanInstructions) {
    lines.push(config.cleanInstructions)
  }

  return lines.join('\n')
}

export interface DepositHealthIssue {
  type: 'ERROR' | 'WARNING'
  method: string
  message: string
}

export interface DepositHealthReport {
  isConfigured: boolean
  hasActiveMethods: boolean
  activeMethodsCount: number
  totalIssuesCount: number
  issues: DepositHealthIssue[]
  qrCount: number
}

export function validateDepositConfigHealth(config: ParsedBusinessDepositConfig): DepositHealthReport {
  const pm = config.paymentMethods
  const issues: DepositHealthIssue[] = []
  let activeMethodsCount = 0
  let qrCount = 0

  if (pm.nequiEnabled) {
    activeMethodsCount++
    if (pm.nequiQrUrl) qrCount++
    const cleanPhone = (pm.nequiNumber || '').replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length !== 10 || !cleanPhone.startsWith('3')) {
      issues.push({
        type: 'ERROR',
        method: 'Nequi',
        message: 'El número de Nequi debe tener exactamente 10 dígitos colombianos iniciando con 3 (ej: 3001234567).'
      })
    }
    if (!pm.nequiHolder || pm.nequiHolder.trim().length < 3) {
      issues.push({
        type: 'WARNING',
        method: 'Nequi',
        message: 'Falta especificar el nombre del titular de la cuenta Nequi.'
      })
    }
  }

  if (pm.daviplataEnabled) {
    activeMethodsCount++
    if (pm.daviplataQrUrl) qrCount++
    const cleanPhone = (pm.daviplataNumber || '').replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length !== 10 || !cleanPhone.startsWith('3')) {
      issues.push({
        type: 'ERROR',
        method: 'Daviplata',
        message: 'El número de Daviplata debe tener exactamente 10 dígitos colombianos iniciando con 3 (ej: 3109876543).'
      })
    }
    if (!pm.daviplataHolder || pm.daviplataHolder.trim().length < 3) {
      issues.push({
        type: 'WARNING',
        method: 'Daviplata',
        message: 'Falta especificar el nombre del titular de Daviplata.'
      })
    }
  }

  if (pm.brebEnabled) {
    activeMethodsCount++
    if (pm.brebQrUrl) qrCount++
    if (!pm.brebKey || pm.brebKey.trim().length < 3) {
      issues.push({
        type: 'ERROR',
        method: 'Bre-B',
        message: 'Falta ingresar la llave Bre-B (celular, correo, documento o identificador alfanumérico).'
      })
    }
    if (!pm.brebHolder || pm.brebHolder.trim().length < 3) {
      issues.push({
        type: 'WARNING',
        method: 'Bre-B',
        message: 'Falta el nombre del titular registrado para la llave Bre-B.'
      })
    }
  }

  if (pm.bankEnabled) {
    activeMethodsCount++
    if (pm.bankQrUrl) qrCount++
    if (!pm.bankAccountNumber || pm.bankAccountNumber.trim().length < 4) {
      issues.push({
        type: 'ERROR',
        method: 'Cuenta Bancaria',
        message: 'Falta ingresar el número de cuenta bancaria.'
      })
    }
    if (!pm.bankHolder || pm.bankHolder.trim().length < 3) {
      issues.push({
        type: 'WARNING',
        method: 'Cuenta Bancaria',
        message: 'Falta el nombre o razón social del titular de la cuenta bancaria.'
      })
    }
  }

  if (Array.isArray(pm.customMethods)) {
    for (const cm of pm.customMethods) {
      if (cm.enabled) {
        activeMethodsCount++
        if (cm.qrUrl) qrCount++
        if (!cm.name || cm.name.trim().length < 2) {
          issues.push({
            type: 'ERROR',
            method: 'Personalizado',
            message: 'Un medio personalizado activo no tiene nombre asignado.'
          })
        }
      }
    }
  }

  if (config.depositEnabled && activeMethodsCount === 0) {
    issues.push({
      type: 'ERROR',
      method: 'General',
      message: 'Los anticipos están exigidos pero no has activado ningún medio de pago receptor (Nequi, Daviplata, Bre-B, Banco o personalizado).'
    })
  }

  const hasErrors = issues.some(i => i.type === 'ERROR')

  return {
    isConfigured: config.depositEnabled && activeMethodsCount > 0 && !hasErrors,
    hasActiveMethods: activeMethodsCount > 0,
    activeMethodsCount,
    totalIssuesCount: issues.length,
    issues,
    qrCount,
  }
}
