'use client'

import React, { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Check,
  ChevronLeft,
  ArrowRight,
  Clock,
  Sparkles,
  User,
  Calendar,
  Phone,
  Loader2,
  CheckCircle2,
  X,
  QrCode,
  Wallet,
  Building2,
  KeyRound,
  Scissors,
  ShieldCheck,
  Upload,
  Copy,
  AlertCircle,
  Download,
} from 'lucide-react'
import { ThemeColors } from '@/lib/themes'
import { getOptimizedImageUrl } from '@/lib/gallery'

export interface NextDayOption {
  full: string
  dayName: string
  dayNum: number
  month: string
  isToday: boolean
}

export interface CinematicBookingWidgetProps {
  businessName: string
  services: any[]
  barbers: any[]
  selectedServices: any[]
  selectedBarber: any | null
  selectedDate: string
  selectedSlot: string | null
  availableSlots: { time: string; available?: boolean }[]
  loadingSlots: boolean
  bookingStep: 1 | 2 | 3 | 4 | 5
  bookingError: string | null
  bookingSuccess: any | null
  submittingBooking: boolean
  clientName: string
  clientPhone: string
  whatsappConsent?: boolean
  nextDays: NextDayOption[]
  totalAccumulatedPrice: number
  totalAccumulatedDuration: number
  depositEnabled?: boolean
  depositType?: string
  depositPercentage?: number
  depositFixedAmount?: number
  depositInstructions?: string | null
  advancePaymentConfig?: {
    enabled?: boolean
    nequiEnabled?: boolean
    nequiNumber?: string
    nequiHolder?: string
    nequiQrUrl?: string
    daviplataEnabled?: boolean
    daviplataNumber?: string
    daviplataHolder?: string
    daviplataQrUrl?: string
    brebEnabled?: boolean
    brebKey?: string
    brebEntity?: string
    brebHolder?: string
    brebQrUrl?: string
    bankEnabled?: boolean
    bankName?: string
    bankAccountType?: string
    bankAccountNumber?: string
    bankHolder?: string
    bankQrUrl?: string
    customMethods?: Array<{
      id: string
      name: string
      accountNumber?: string
      accountHolder?: string
      extraDetails?: string
      qrUrl?: string
      enabled: boolean
    }>
    holdMinutes?: number
    requireProof?: boolean
    cancellationPolicy?: string
  } | null
  whatsappUrl?: string
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  isLightMode: boolean
  formatCOP: (n: number) => string
  onSetBookingStep: (step: 1 | 2 | 3 | 4 | 5) => void
  onToggleService: (service: any) => void
  onSelectDefaultServiceIfEmpty: () => void
  onSelectBarber: (barber: any | null) => void
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string | null) => void
  onChangeClientName: (val: string) => void
  onChangeClientPhone: (val: string) => void
  onChangeWhatsappConsent?: (val: boolean) => void
  onSubmitBooking: (e: React.FormEvent) => void
  onResetBooking: () => void
  onScrollToBooking: () => void
}

const STEPS = [
  { num: 1 as const, code: '01', label: 'Servicios' },
  { num: 2 as const, code: '02', label: 'Profesional' },
  { num: 3 as const, code: '03', label: 'Fecha' },
  { num: 4 as const, code: '04', label: 'Horario' },
  { num: 5 as const, code: '05', label: 'Confirmar' },
]

function getInitials(name?: string | null): string {
  const clean = (name || 'B').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function CinematicBookingWidget({
  businessName,
  services,
  barbers,
  selectedServices,
  selectedBarber,
  selectedDate,
  selectedSlot,
  availableSlots,
  loadingSlots,
  bookingStep,
  bookingError,
  bookingSuccess,
  submittingBooking,
  clientName,
  clientPhone,
  whatsappConsent = false,
  nextDays,
  totalAccumulatedPrice,
  totalAccumulatedDuration,
  depositEnabled,
  depositType,
  depositPercentage = 50,
  depositFixedAmount = 0,
  depositInstructions,
  advancePaymentConfig,
  whatsappUrl,
  colors,
  accentBtnText,
  headingFont,
  isLightMode,
  formatCOP,
  onSetBookingStep,
  onToggleService,
  onSelectDefaultServiceIfEmpty,
  onSelectBarber,
  onSelectDate,
  onSelectSlot,
  onChangeClientName,
  onChangeClientPhone,
  onChangeWhatsappConsent,
  onSubmitBooking,
  onResetBooking,
}: CinematicBookingWidgetProps) {
  const stepStageRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!stepStageRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          stepStageRef.current,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.26,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        )
      })
      return () => mm.revert()
    },
    { dependencies: [bookingStep, Boolean(bookingSuccess)] }
  )

  const isAdvanceActive = Boolean(depositEnabled || advancePaymentConfig?.enabled)
  const calculatedDepositAmount = isAdvanceActive
    ? depositType === 'PERCENTAGE'
      ? Math.round((totalAccumulatedPrice * Number(depositPercentage || 0)) / 100)
      : Math.min(totalAccumulatedPrice, Number(depositFixedAmount) || 0)
    : 0
  const calculatedRemainingBalance = Math.max(0, totalAccumulatedPrice - calculatedDepositAmount)

  const progressPercentage = ((bookingStep - 1) / (STEPS.length - 1)) * 100
  const selectedDayObj = nextDays.find((d) => d.full === selectedDate)

  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null)
  const [proofFileName, setProofFileName] = useState<string>('')
  const [proofChannel, setProofChannel] = useState<string>('Nequi')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofSubmittedDone, setProofSubmittedDone] = useState(false)
  const [proofUploadError, setProofUploadError] = useState<string | null>(null)
  const [declaringWhatsApp, setDeclaringWhatsApp] = useState(false)
  const [declaredViaWhatsApp, setDeclaredViaWhatsApp] = useState(false)
  const [copiedAccountKey, setCopiedAccountKey] = useState<string | null>(null)
  const [activeQrModal, setActiveQrModal] = useState<{ title: string; qrUrl: string } | null>(null)
  const proofInputRef = useRef<HTMLInputElement | null>(null)

  const copyAccountValue = (label: string, val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {})
    setCopiedAccountKey(label)
    setTimeout(() => setCopiedAccountKey(null), 2000)
  }

  const handleDownloadQr = async (url: string, title: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `QR-${title.replace(/\s+/g, '_')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const handleSelectProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setProofUploadError('Solo se permiten imágenes PNG, JPG o WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofUploadError('La imagen supera el límite de 5MB.')
      return
    }
    setProofFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofDataUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUploadDepositProof = async () => {
    if (!proofDataUrl || !bookingSuccess) return
    setUploadingProof(true)
    setProofUploadError(null)
    try {
      const res = await fetch('/api/public/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: bookingSuccess.id,
          reservationCode: bookingSuccess.reservationCode,
          businessId: bookingSuccess.businessId,
          proofUrl: proofDataUrl,
          depositChannelLabel: proofChannel,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setProofSubmittedDone(true)
      } else {
        setProofUploadError(json.error || 'Error al enviar el comprobante.')
      }
    } catch {
      setProofUploadError('Error de conexión al enviar el comprobante.')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleDeclareWhatsAppPayment = async () => {
    if (!bookingSuccess) return
    setDeclaringWhatsApp(true)
    setProofUploadError(null)
    try {
      const res = await fetch('/api/public/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLARE_WHATSAPP_PAYMENT',
          appointmentId: bookingSuccess.id,
          reservationCode: bookingSuccess.reservationCode,
          businessId: bookingSuccess.businessId,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setDeclaredViaWhatsApp(true)
        setProofSubmittedDone(true)
      } else {
        setProofUploadError(json.error || 'Error al registrar comprobante por WhatsApp.')
      }
    } catch {
      setProofUploadError('Error de conexión al registrar.')
    } finally {
      setDeclaringWhatsApp(false)
    }
  }

  /* ── VISTA DE ÉXITO: TICKET DE RESERVA (CON SOPORTE DE RESERVA TEMPORAL Y COMPROBANTE) ── */
  if (bookingSuccess && bookingStep === 5) {
    const serverDepositReq = Number(
      bookingSuccess.financials?.depositRequired ??
        bookingSuccess.depositRequired ??
        calculatedDepositAmount
    )
    const requiresDepositForTicket = isAdvanceActive && serverDepositReq > 0
    const isProofSubmittedState =
      proofSubmittedDone ||
      bookingSuccess.financials?.depositStatus === 'PROOF_SUBMITTED'
    const isDepositApprovedState =
      Boolean(bookingSuccess.depositPaid) ||
      bookingSuccess.financials?.depositStatus === 'APPROVED'
    const holdMinutesLabel = advancePaymentConfig?.holdMinutes || 30

    return (
      <div className="max-w-3xl mx-auto">
        <div
          className="p-6 sm:p-10 md:p-12 rounded-[32px] border shadow-2xl text-center space-y-8"
          style={{
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
          }}
        >
          <div className="space-y-3">
            {requiresDepositForTicket && !isDepositApprovedState ? (
              isProofSubmittedState ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/35 flex items-center justify-center mx-auto shadow-lg">
                    <Clock className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-400 block">
                    Comprobante en verificación
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{ fontFamily: headingFont }}
                  >
                    Recibimos tu comprobante en {businessName}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-75 max-w-lg mx-auto">
                    Tu horario ha quedado protegido mientras el propietario verifica el ingreso del anticipo para confirmar definitivamente tu cita.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/35 flex items-center justify-center mx-auto shadow-lg">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-400 block">
                    Reserva temporal protegida ({holdMinutesLabel} min)
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{ fontFamily: headingFont }}
                  >
                    Envía tu anticipo para confirmar tu cita
                  </h3>
                  <p className="text-xs sm:text-sm opacity-75 max-w-lg mx-auto">
                    Hemos reservado temporalmente tu horario en {businessName}. Realiza la transferencia del anticipo a los medios oficiales de la barbería y adjunta aquí tu comprobante.
                  </p>
                </>
              )
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400 block">
                  Reserva registrada
                </span>
                <h3
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ fontFamily: headingFont }}
                >
                  Te esperamos en {businessName}
                </h3>
              </>
            )}
          </div>

          {/* Ticket Desglosado */}
          <div
            className="max-w-lg mx-auto p-6 sm:p-7 rounded-3xl border text-left space-y-4 text-xs sm:text-sm shadow-lg"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: `${colors.border}80` }}
            >
              <span className="opacity-60 uppercase tracking-wider text-[11px] font-black">
                Código de reserva
              </span>
              <span
                className="font-mono font-black text-sm px-3 py-1 rounded-xl border"
                style={{
                  color: colors.accent,
                  borderColor: `${colors.accent}45`,
                  backgroundColor: `${colors.accent}14`,
                }}
              >
                {bookingSuccess.reservationCode}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-65">Estado actual:</span>
              <span className="font-black uppercase text-xs" style={{ color: colors.accent }}>
                {requiresDepositForTicket
                  ? isDepositApprovedState
                    ? 'Confirmada (Anticipo Verificado)'
                    : isProofSubmittedState
                    ? 'Pago en verificación por la barbería'
                    : 'Reserva temporal — Esperando comprobante'
                  : 'Pendiente de atención'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-65">Servicio(s):</span>
              <span className="font-bold text-right">
                {selectedServices.map((s) => s.name).join(' + ')}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-65">Profesional:</span>
              <span className="font-bold">
                {bookingSuccess.barber?.name || selectedBarber?.name || 'Asignado'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-65">Fecha y hora:</span>
              <span className="font-bold" style={{ color: colors.accent }}>
                {selectedDate} · {selectedSlot}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-65">Duración estimada:</span>
              <span className="font-bold">{totalAccumulatedDuration} min</span>
            </div>

            <div
              className="flex justify-between pt-4 border-t font-black text-base"
              style={{ borderColor: `${colors.border}80` }}
            >
              <span>Precio total:</span>
              <span style={{ color: colors.accent, fontFamily: headingFont }}>
                {formatCOP(totalAccumulatedPrice)}
              </span>
            </div>

            {requiresDepositForTicket && (
              <div
                className="pt-3 space-y-3 border-t text-xs"
                style={{ borderColor: `${colors.border}60` }}
              >
                <div className="flex justify-between text-amber-400 font-black">
                  <span>Anticipo requerido hoy:</span>
                  <span>
                    {formatCOP(serverDepositReq)}
                    {depositType === 'PERCENTAGE' ? ` (${depositPercentage}%)` : ''}
                  </span>
                </div>
                <div className="flex justify-between opacity-85">
                  <span>Saldo restante al llegar a la barbería:</span>
                  <span className="font-black">
                    {formatCOP(Math.max(0, totalAccumulatedPrice - serverDepositReq))}
                  </span>
                </div>

                {/* Medios de pago configurados por la barbería */}
                {advancePaymentConfig && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                      Cuentas oficiales de {businessName}:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {advancePaymentConfig.nequiEnabled && advancePaymentConfig.nequiNumber && (
                        <div
                          className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                          style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase block" style={{ color: colors.accent }}>
                              Nequi {advancePaymentConfig.nequiHolder ? `· ${advancePaymentConfig.nequiHolder}` : ''}
                            </span>
                            <span className="font-mono text-xs font-bold">
                              {advancePaymentConfig.nequiNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {advancePaymentConfig.nequiQrUrl && (
                              <button
                                type="button"
                                onClick={() => setActiveQrModal({ title: 'Nequi', qrUrl: advancePaymentConfig.nequiQrUrl! })}
                                className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                                style={{ borderColor: `${colors.accent}66`, color: colors.accent, backgroundColor: `${colors.accent}14` }}
                                title="Ver código QR para escanear"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyAccountValue('nequi', advancePaymentConfig.nequiNumber!)}
                              className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              style={{ borderColor: colors.border }}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedAccountKey === 'nequi' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {advancePaymentConfig.daviplataEnabled && advancePaymentConfig.daviplataNumber && (
                        <div
                          className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                          style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase block" style={{ color: colors.accent }}>
                              Daviplata {advancePaymentConfig.daviplataHolder ? `· ${advancePaymentConfig.daviplataHolder}` : ''}
                            </span>
                            <span className="font-mono text-xs font-bold">
                              {advancePaymentConfig.daviplataNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {advancePaymentConfig.daviplataQrUrl && (
                              <button
                                type="button"
                                onClick={() => setActiveQrModal({ title: 'Daviplata', qrUrl: advancePaymentConfig.daviplataQrUrl! })}
                                className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                                style={{ borderColor: `${colors.accent}66`, color: colors.accent, backgroundColor: `${colors.accent}14` }}
                                title="Ver código QR para escanear"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyAccountValue('daviplata', advancePaymentConfig.daviplataNumber!)}
                              className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              style={{ borderColor: colors.border }}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedAccountKey === 'daviplata' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {advancePaymentConfig.brebEnabled && advancePaymentConfig.brebKey && (
                        <div
                          className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                          style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase block" style={{ color: colors.accent }}>
                              Llave Bre-B {advancePaymentConfig.brebEntity ? `(${advancePaymentConfig.brebEntity})` : ''} {advancePaymentConfig.brebHolder ? `· ${advancePaymentConfig.brebHolder}` : ''}
                            </span>
                            <span className="font-mono text-xs font-bold">
                              {advancePaymentConfig.brebKey}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {advancePaymentConfig.brebQrUrl && (
                              <button
                                type="button"
                                onClick={() => setActiveQrModal({ title: 'Bre-B', qrUrl: advancePaymentConfig.brebQrUrl! })}
                                className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                                style={{ borderColor: `${colors.accent}66`, color: colors.accent, backgroundColor: `${colors.accent}14` }}
                                title="Ver código QR para escanear"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyAccountValue('breb', advancePaymentConfig.brebKey!)}
                              className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              style={{ borderColor: colors.border }}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedAccountKey === 'breb' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {advancePaymentConfig.bankEnabled && advancePaymentConfig.bankAccountNumber && (
                        <div
                          className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                          style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase block" style={{ color: colors.accent }}>
                              {advancePaymentConfig.bankName || 'Banco'} ({advancePaymentConfig.bankAccountType || 'Ahorros'})
                              {advancePaymentConfig.bankHolder ? ` · ${advancePaymentConfig.bankHolder}` : ''}
                            </span>
                            <span className="font-mono text-xs font-bold">
                              {advancePaymentConfig.bankAccountNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {advancePaymentConfig.bankQrUrl && (
                              <button
                                type="button"
                                onClick={() => setActiveQrModal({ title: advancePaymentConfig.bankName || 'Transferencia', qrUrl: advancePaymentConfig.bankQrUrl! })}
                                className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                                style={{ borderColor: `${colors.accent}66`, color: colors.accent, backgroundColor: `${colors.accent}14` }}
                                title="Ver código QR para escanear"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyAccountValue('bank', advancePaymentConfig.bankAccountNumber!)}
                              className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              style={{ borderColor: colors.border }}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedAccountKey === 'bank' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Medios manuales personalizados adicionales */}
                      {Array.isArray(advancePaymentConfig.customMethods) &&
                        advancePaymentConfig.customMethods
                          .filter((m) => m && m.enabled)
                          .map((method) => (
                            <div
                              key={method.id}
                              className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                              style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                            >
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block" style={{ color: colors.accent }}>
                                  {method.name} {method.accountHolder ? `· ${method.accountHolder}` : ''}
                                </span>
                                {method.accountNumber && (
                                  <span className="font-mono text-xs font-bold truncate block">
                                    {method.accountNumber}
                                  </span>
                                )}
                                {method.extraDetails && (
                                  <span className="text-[10px] opacity-70 block">
                                    {method.extraDetails}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {method.qrUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveQrModal({ title: method.name, qrUrl: method.qrUrl! })}
                                    className="px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:brightness-110"
                                    style={{ borderColor: `${colors.accent}66`, color: colors.accent, backgroundColor: `${colors.accent}14` }}
                                    title="Ver código QR para escanear"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    <span>QR</span>
                                  </button>
                                )}
                                {method.accountNumber && (
                                  <button
                                    type="button"
                                    onClick={() => copyAccountValue(method.id, method.accountNumber!)}
                                    className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    style={{ borderColor: colors.border }}
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedAccountKey === method.id ? 'Copiado' : 'Copiar'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}

                {depositInstructions && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 mt-2 leading-relaxed">
                    <strong className="block text-amber-300 mb-0.5">
                      Instrucciones de pago:
                    </strong>
                    {depositInstructions}
                  </div>
                )}

                {/* Módulo de adjuntar comprobante de pago */}
                {!isProofSubmittedState && !isDepositApprovedState ? (
                  <div
                    className="p-4 rounded-2xl border space-y-3 mt-3"
                    style={{ backgroundColor: colors.surfaceCard, borderColor: `${colors.accent}55` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: colors.accent }}>
                        Adjuntar Comprobante de Pago
                      </span>
                      <span className="text-[10px] opacity-65 font-semibold">
                        PNG, JPG o WEBP (máx. 5MB)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-70 block mb-1">
                          Medio utilizado
                        </label>
                        <select
                          value={proofChannel}
                          onChange={(e) => setProofChannel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          }}
                        >
                          <option value="Nequi">Nequi</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Bre-B">Llave Bre-B</option>
                          <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-70 block mb-1">
                          Captura del comprobante
                        </label>
                        <input
                          ref={proofInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleSelectProofFile}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => proofInputRef.current?.click()}
                          className="w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer truncate"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          }}
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
                          <span className="truncate">
                            {proofFileName || 'Seleccionar imagen...'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {proofUploadError && (
                      <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{proofUploadError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!proofDataUrl || uploadingProof}
                      onClick={handleUploadDepositProof}
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
                      style={{ backgroundColor: colors.accent, color: accentBtnText }}
                    >
                      {uploadingProof ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando comprobante...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" strokeWidth={3} />
                          <span>Enviar Comprobante para Verificación</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-2.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Comprobante adjuntado correctamente. Tu pago se encuentra en verificación por {businessName}.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {whatsappUrl && (
              <a
                href={`${whatsappUrl}&text=Hola!%20Acabo%20de%20agendar%20mi%20cita%20con%20código%20${bookingSuccess.reservationCode}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#25d366] text-white shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <span>Notificar por WhatsApp</span>
              </a>
            )}

            {requiresDepositForTicket && !isDepositApprovedState && !isProofSubmittedState && (
              <button
                type="button"
                onClick={handleDeclareWhatsAppPayment}
                disabled={declaringWhatsApp}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {declaringWhatsApp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span>Ya envié el comprobante por WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setProofDataUrl(null)
                setProofFileName('')
                setProofSubmittedDone(false)
                setDeclaredViaWhatsApp(false)
                onResetBooking()
              }}
              className="px-7 py-3.5 rounded-full text-xs font-bold border transition-all hover:opacity-100 opacity-80 w-full sm:w-auto cursor-pointer"
              style={{ borderColor: colors.border }}
            >
              Agendar otra cita
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── 1. BARRA SUPERIOR DE PASOS (ARQUITECTÓNICA Y ACCESIBLE) ── */}
      <div data-narrative-item className="mb-8">
        <div
          className="p-2 sm:p-3 rounded-3xl border relative overflow-x-auto no-scrollbar"
          style={{
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
          }}
        >
          <div className="relative flex items-center justify-between gap-2 min-w-max sm:min-w-0">
            {/* Línea conectora en desktop */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-16 right-16 top-1/2 -translate-y-1/2 h-px z-0"
              style={{ backgroundColor: colors.border }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: colors.accent,
                }}
              />
            </div>

            {STEPS.map((s) => {
              const isPast = bookingStep > s.num
              const isCurrent = bookingStep === s.num

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < bookingStep && onSetBookingStep(s.num)}
                  disabled={s.num > bookingStep}
                  className={`relative z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-200 shrink-0 ${
                    isCurrent
                      ? 'shadow-md'
                      : isPast
                      ? 'cursor-pointer hover:opacity-100'
                      : 'opacity-45 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? colors.accent
                      : isPast
                      ? colors.surface
                      : colors.bg,
                    borderColor: isCurrent || isPast ? colors.accent : colors.border,
                    color: isCurrent ? accentBtnText : colors.textPrimary,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full text-[11px] font-mono font-black flex items-center justify-center shrink-0"
                    style={
                      isCurrent
                        ? {
                            backgroundColor: 'rgba(0,0,0,0.18)',
                            color: accentBtnText,
                          }
                        : isPast
                        ? {
                            backgroundColor: colors.accent,
                            color: accentBtnText,
                          }
                        : {
                            backgroundColor: `${colors.border}80`,
                            color: colors.textSecondary,
                          }
                    }
                  >
                    {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.code}
                  </span>

                  <span
                    className={`text-xs tracking-wide ${
                      isCurrent ? 'font-black uppercase' : 'font-bold'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. DISTRIBUCIÓN DE 2 COLUMNAS EN ESCRITORIO (PROCESO A LA IZQUIERDA + RESUMEN A LA DERECHA) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════
            COLUMNA IZQUIERDA (7/8 COLS): PROCESO INTERACTIVO PASO A PASO
        ═══════════════════════════════════════════════════════ */}
        <div
          data-narrative-item
          className="lg:col-span-7 xl:col-span-8 p-5 sm:p-8 md:p-10 rounded-[32px] border shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
          }}
        >
          {bookingError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <X className="w-4 h-4 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          <div ref={stepStageRef}>
            {/* ── PASO 1: SELECCIÓN DE SERVICIOS ── */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-end gap-3 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <div>
                    <span
                      className="font-mono text-[11px] font-black uppercase tracking-[0.2em] block mb-1"
                      style={{ color: colors.accent }}
                    >
                      PASO 01 · SERVICIOS
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ fontFamily: headingFont }}
                    >
                      Selecciona tus servicios
                    </h3>
                    <p className="text-xs opacity-65 font-medium mt-1">
                      Puedes elegir uno o varios servicios para tu cita.
                    </p>
                  </div>

                  {selectedServices.length > 0 && (
                    <span
                      className="text-xs font-black px-3.5 py-1.5 rounded-full border"
                      style={{
                        backgroundColor: `${colors.accent}15`,
                        color: colors.accent,
                        borderColor: `${colors.accent}40`,
                      }}
                    >
                      {selectedServices.length}{' '}
                      {selectedServices.length === 1 ? 'seleccionado' : 'seleccionados'}
                    </span>
                  )}
                </div>

                {/* Lista vertical editorial de servicios dentro de la agenda */}
                <div
                  className="rounded-2xl border divide-y overflow-hidden"
                  style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                >
                  {services?.map((svc: any) => {
                    const isSelected = selectedServices.some((s) => s.id === svc.id)
                    return (
                      <div
                        key={svc.id}
                        onClick={() => onToggleService(svc)}
                        className="p-4 sm:p-5 transition-colors cursor-pointer flex items-center justify-between gap-4"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : 'transparent',
                        }}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            className="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors"
                            style={
                              isSelected
                                ? {
                                    backgroundColor: colors.accent,
                                    borderColor: colors.accent,
                                    color: accentBtnText,
                                  }
                                : { borderColor: colors.border }
                            }
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm sm:text-base">{svc.name}</h4>
                              {svc.category && (
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border opacity-75"
                                  style={{ borderColor: colors.border }}
                                >
                                  {svc.category}
                                </span>
                              )}
                            </div>
                            {svc.description?.trim() && (
                              <p className="text-xs opacity-65 line-clamp-2 mt-1">
                                {svc.description}
                              </p>
                            )}
                            <span className="text-xs opacity-60 font-medium inline-flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3" style={{ color: colors.accent }} />{' '}
                              {svc.duration} min
                            </span>
                          </div>
                        </div>

                        <span
                          className="font-black text-sm sm:text-base shrink-0"
                          style={{ color: colors.accent, fontFamily: headingFont }}
                        >
                          {formatCOP(Number(svc.price))}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div
                  className="pt-4 flex items-center justify-end"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDefaultServiceIfEmpty()
                      onSetBookingStep(2)
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Continuar con el profesional</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2: SELECCIÓN DE BARBERO ── */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-end gap-2 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <div>
                    <span
                      className="font-mono text-[11px] font-black uppercase tracking-[0.2em] block mb-1"
                      style={{ color: colors.accent }}
                    >
                      PASO 02 · PROFESIONAL
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ fontFamily: headingFont }}
                    >
                      Elige tu barbero
                    </h3>
                    <p className="text-xs opacity-65 font-medium mt-1">
                      Selecciona a un profesional específico o deja que asignemos al primero disponible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(1)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border shrink-0"
                    style={{ borderColor: colors.border }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Servicios
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Cualquier Barbero */}
                  <div
                    onClick={() => onSelectBarber(null)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                      selectedBarber === null
                        ? 'shadow-md'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: selectedBarber === null ? colors.accent : colors.border,
                      backgroundColor: selectedBarber === null ? colors.badgeBg : colors.bg,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${colors.accent}15`,
                        borderColor: `${colors.accent}40`,
                        color: colors.accent,
                      }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm sm:text-base">Cualquier profesional</h4>
                      <span className="text-xs opacity-65 block mt-0.5">
                        Muestra todos los horarios disponibles
                      </span>
                    </div>
                  </div>

                  {/* Barberos Reales */}
                  {barbers?.map((b: any) => {
                    const isSelected = selectedBarber?.id === b.id
                    const hasAvatar = Boolean(b.avatar && String(b.avatar).trim())
                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBarber(b)}
                        className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                          isSelected ? 'shadow-md' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : colors.bg,
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 flex items-center justify-center bg-zinc-900"
                          style={{ borderColor: isSelected ? colors.accent : colors.border }}
                        >
                          {hasAvatar ? (
                            <img
                              src={getOptimizedImageUrl(String(b.avatar).trim(), 300)}
                              alt={b.name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span
                              className="text-sm font-black"
                              style={{ color: colors.accent, fontFamily: headingFont }}
                            >
                              {getInitials(b.name)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm sm:text-base truncate">{b.name}</h4>
                          {b.specialty?.trim() && (
                            <span
                              className="text-xs font-semibold truncate block mt-0.5"
                              style={{ color: colors.accent }}
                            >
                              {b.specialty}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div
                  className="pt-4 border-t flex items-center justify-between gap-4"
                  style={{ borderColor: colors.border }}
                >
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(1)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(3)}
                    className="flex items-center gap-2.5 px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Elegir fecha</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3: SELECCIÓN DE FECHA ── */}
            {bookingStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-end gap-2 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <div>
                    <span
                      className="font-mono text-[11px] font-black uppercase tracking-[0.2em] block mb-1"
                      style={{ color: colors.accent }}
                    >
                      PASO 03 · FECHA
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ fontFamily: headingFont }}
                    >
                      Selecciona el día de tu cita
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(2)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border shrink-0"
                    style={{ borderColor: colors.border }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Profesional
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {nextDays.map((d) => {
                    const isSelected = selectedDate === d.full
                    return (
                      <button
                        key={d.full}
                        type="button"
                        onClick={() => onSelectDate(d.full)}
                        className={`relative p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isSelected ? 'shadow-md scale-[1.02]' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : colors.bg,
                        }}
                      >
                        {d.isToday && (
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1"
                            style={{
                              backgroundColor: `${colors.accent}22`,
                              color: colors.accent,
                            }}
                          >
                            Hoy
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-60">
                          {d.dayName}
                        </span>
                        <span
                          className="text-2xl font-black block my-1"
                          style={{
                            fontFamily: headingFont,
                            color: isSelected ? colors.accent : colors.textPrimary,
                          }}
                        >
                          {d.dayNum}
                        </span>
                        <span className="text-[10px] uppercase font-bold opacity-60 block">
                          {d.month}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div
                  className="pt-4 border-t flex items-center justify-between gap-4"
                  style={{ borderColor: colors.border }}
                >
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(2)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(4)}
                    className="flex items-center gap-2.5 px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Ver horarios disponibles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 4: SELECCIÓN DE HORA ── */}
            {bookingStep === 4 && (
              <div className="space-y-6">
                <div className="flex justify-between items-end gap-2 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <div>
                    <span
                      className="font-mono text-[11px] font-black uppercase tracking-[0.2em] block mb-1"
                      style={{ color: colors.accent }}
                    >
                      PASO 04 · HORARIO
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ fontFamily: headingFont }}
                    >
                      Selecciona la hora
                    </h3>
                    <span className="text-xs opacity-65 font-semibold block mt-1">
                      {selectedDate} ·{' '}
                      {selectedBarber ? selectedBarber.name : 'Cualquier profesional disponible'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(3)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border shrink-0"
                    style={{ borderColor: colors.border }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Fecha
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-65">
                      Consultando agenda en tiempo real...
                    </span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div
                    className="py-12 text-center border-2 border-dashed rounded-2xl p-6"
                    style={{ borderColor: colors.border }}
                  >
                    <Clock className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <h4 className="font-bold text-sm mb-1">
                      Sin turnos disponibles para esta fecha
                    </h4>
                    <p className="text-xs opacity-60 max-w-sm mx-auto mb-4">
                      Selecciona otro día en el calendario o prueba con otro profesional.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSetBookingStep(3)}
                      className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border cursor-pointer"
                      style={{ borderColor: colors.accent, color: colors.accent }}
                    >
                      Cambiar fecha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => onSelectSlot(slot.time)}
                          className={`py-3.5 px-3 rounded-xl border-2 text-center text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'scale-[1.03] shadow-md font-black'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{
                            borderColor: isSelected ? colors.accent : colors.border,
                            backgroundColor: isSelected ? colors.accent : colors.bg,
                            color: isSelected ? accentBtnText : colors.textPrimary,
                          }}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div
                  className="pt-4 border-t flex items-center justify-between gap-4"
                  style={{ borderColor: colors.border }}
                >
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(3)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={() => onSetBookingStep(5)}
                    className={`flex items-center gap-2.5 px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg ${
                      !selectedSlot
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                    style={
                      !selectedSlot
                        ? {
                            backgroundColor: isLightMode ? '#e2e8f0' : '#27272a',
                            color: isLightMode ? '#64748b' : '#94a3b8',
                          }
                        : {
                            backgroundColor: colors.accent,
                            color: accentBtnText,
                          }
                    }
                  >
                    <span>Continuar a tus datos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 5: DATOS DEL CLIENTE Y CONFIRMACIÓN ── */}
            {bookingStep === 5 && (
              <form onSubmit={onSubmitBooking} className="space-y-6">
                <div className="flex justify-between items-end gap-2 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <div>
                    <span
                      className="font-mono text-[11px] font-black uppercase tracking-[0.2em] block mb-1"
                      style={{ color: colors.accent }}
                    >
                      PASO 05 · TUS DATOS
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ fontFamily: headingFont }}
                    >
                      Completa tu reserva
                    </h3>
                    <p className="text-xs opacity-65 font-medium mt-1">
                      Ingresa tu nombre y número de contacto para registrar tu cita.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(4)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border shrink-0"
                    style={{ borderColor: colors.border }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Horario
                  </button>
                </div>

                {/* Campos del cliente con iconos integrados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-2">
                      Nombre completo *
                    </label>
                    <div className="relative">
                      <User
                        className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
                        style={{ color: colors.accent }}
                      />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => onChangeClientName(e.target.value)}
                        placeholder="Tu nombre y apellido"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-colors"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-2">
                      WhatsApp / Teléfono *
                    </label>
                    <div className="relative">
                      <Phone
                        className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
                        style={{ color: colors.accent }}
                      />
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => onChangeClientPhone(e.target.value)}
                        placeholder="Ej: +57 300 123 4567"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-colors"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        }}
                      />
                    </div>

                    {/* Checkbox de Consentimiento para WhatsApp */}
                    <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={whatsappConsent}
                        onChange={(e) => onChangeWhatsappConsent?.(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-400 bg-zinc-900 cursor-pointer"
                      />
                      <span className="text-xs opacity-80 leading-snug" style={{ color: colors.textSecondary }}>
                        Deseo recibir confirmación, recordatorios y gestión de mi cita por <strong className="text-emerald-500 dark:text-emerald-400 font-semibold">WhatsApp</strong>.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Desglose de Anticipo cuando está activo */}
                {isAdvanceActive && (
                  <div
                    className="p-5 rounded-2xl border space-y-4 text-xs"
                    style={{
                      borderColor: `${colors.accent}50`,
                      backgroundColor: `${colors.accent}10`,
                    }}
                  >
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b"
                      style={{ borderColor: `${colors.accent}25` }}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" style={{ color: colors.accent }} />
                        <span
                          className="font-black uppercase tracking-wider text-[11px]"
                          style={{ color: colors.accent }}
                        >
                          Anticipo de reserva
                        </span>
                      </div>
                      <span
                        className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{ borderColor: `${colors.accent}40`, color: colors.accent }}
                      >
                        Nequi · Bre-B · Transferencia
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        className="p-3 rounded-xl border"
                        style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-60 block">
                          Valor total
                        </span>
                        <span className="text-sm font-black">
                          {formatCOP(totalAccumulatedPrice)}
                        </span>
                      </div>
                      <div
                        className="p-3 rounded-xl border"
                        style={{ backgroundColor: colors.surfaceCard, borderColor: colors.accent }}
                      >
                        <span
                          className="text-[10px] uppercase font-black block"
                          style={{ color: colors.accent }}
                        >
                          Anticipo requerido
                        </span>
                        <span className="text-sm font-black" style={{ color: colors.accent }}>
                          {formatCOP(calculatedDepositAmount)}
                          {depositType === 'PERCENTAGE' ? ` (${depositPercentage}%)` : ''}
                        </span>
                      </div>
                      <div
                        className="p-3 rounded-xl border"
                        style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-60 block">
                          Saldo restante
                        </span>
                        <span className="text-sm font-black">
                          {formatCOP(calculatedRemainingBalance)}
                        </span>
                      </div>
                    </div>

                    {advancePaymentConfig && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {advancePaymentConfig.nequiEnabled && advancePaymentConfig.nequiNumber && (
                          <div
                            className="p-3 rounded-xl border flex items-center justify-between gap-2"
                            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <QrCode className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block">
                                  Nequi {advancePaymentConfig.nequiHolder ? `· ${advancePaymentConfig.nequiHolder}` : ''}
                                </span>
                                <span className="font-mono text-xs font-bold truncate block">
                                  {advancePaymentConfig.nequiNumber}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {advancePaymentConfig.nequiQrUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActiveQrModal({ title: 'Nequi', qrUrl: advancePaymentConfig.nequiQrUrl! })}
                                  className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                  style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
                                  title="Ver QR"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => copyAccountValue('nequi-step5', advancePaymentConfig.nequiNumber!)}
                                className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                style={{ borderColor: colors.border }}
                                title="Copiar número"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {advancePaymentConfig.daviplataEnabled && advancePaymentConfig.daviplataNumber && (
                          <div
                            className="p-3 rounded-xl border flex items-center justify-between gap-2"
                            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <QrCode className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block">
                                  Daviplata {advancePaymentConfig.daviplataHolder ? `· ${advancePaymentConfig.daviplataHolder}` : ''}
                                </span>
                                <span className="font-mono text-xs font-bold truncate block">
                                  {advancePaymentConfig.daviplataNumber}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {advancePaymentConfig.daviplataQrUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActiveQrModal({ title: 'Daviplata', qrUrl: advancePaymentConfig.daviplataQrUrl! })}
                                  className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                  style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
                                  title="Ver QR"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => copyAccountValue('daviplata-step5', advancePaymentConfig.daviplataNumber!)}
                                className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                style={{ borderColor: colors.border }}
                                title="Copiar número"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {advancePaymentConfig.brebEnabled && advancePaymentConfig.brebKey && (
                          <div
                            className="p-3 rounded-xl border flex items-center justify-between gap-2"
                            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <KeyRound className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block">
                                  Llave Bre-B {advancePaymentConfig.brebEntity ? `(${advancePaymentConfig.brebEntity})` : ''} {advancePaymentConfig.brebHolder ? `· ${advancePaymentConfig.brebHolder}` : ''}
                                </span>
                                <span className="font-mono text-xs font-bold truncate block">
                                  {advancePaymentConfig.brebKey}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {advancePaymentConfig.brebQrUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActiveQrModal({ title: 'Bre-B', qrUrl: advancePaymentConfig.brebQrUrl! })}
                                  className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                  style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
                                  title="Ver QR"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => copyAccountValue('breb-step5', advancePaymentConfig.brebKey!)}
                                className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                style={{ borderColor: colors.border }}
                                title="Copiar llave"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {advancePaymentConfig.bankEnabled &&
                          advancePaymentConfig.bankAccountNumber && (
                            <div
                              className="p-3 rounded-xl border flex items-center justify-between gap-2"
                              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Building2
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: colors.accent }}
                                />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-black uppercase block">
                                    {advancePaymentConfig.bankName || 'Transferencia'} ({advancePaymentConfig.bankAccountType || 'Ahorros'})
                                    {advancePaymentConfig.bankHolder ? ` · ${advancePaymentConfig.bankHolder}` : ''}
                                  </span>
                                  <span className="font-mono text-xs font-bold truncate block">
                                    {advancePaymentConfig.bankAccountNumber}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {advancePaymentConfig.bankQrUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveQrModal({ title: advancePaymentConfig.bankName || 'Transferencia', qrUrl: advancePaymentConfig.bankQrUrl! })}
                                    className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                    style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
                                    title="Ver QR"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => copyAccountValue('bank-step5', advancePaymentConfig.bankAccountNumber!)}
                                  className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                  style={{ borderColor: colors.border }}
                                  title="Copiar cuenta"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                        {/* Medios manuales personalizados */}
                        {Array.isArray(advancePaymentConfig.customMethods) &&
                          advancePaymentConfig.customMethods
                            .filter((m) => m && m.enabled)
                            .map((method) => (
                              <div
                                key={method.id}
                                className="p-3 rounded-xl border flex items-center justify-between gap-2"
                                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Wallet className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase block">
                                      {method.name} {method.accountHolder ? `· ${method.accountHolder}` : ''}
                                    </span>
                                    {method.accountNumber && (
                                      <span className="font-mono text-xs font-bold truncate block">
                                        {method.accountNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {method.qrUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveQrModal({ title: method.name, qrUrl: method.qrUrl! })}
                                      className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                      style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
                                      title="Ver QR"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {method.accountNumber && (
                                    <button
                                      type="button"
                                      onClick={() => copyAccountValue(`custom-${method.id}`, method.accountNumber!)}
                                      className="p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                                      style={{ borderColor: colors.border }}
                                      title="Copiar datos"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                      </div>
                    )}

                    {depositInstructions && (
                      <div
                        className="text-[11px] opacity-90 pt-2 border-t leading-relaxed"
                        style={{ borderColor: `${colors.accent}25` }}
                      >
                        <strong style={{ color: colors.accent }}>Instrucciones:</strong>{' '}
                        {depositInstructions}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{ borderColor: colors.border }}
                >
                  <button
                    type="button"
                    onClick={() => onSetBookingStep(4)}
                    className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer self-start sm:self-auto"
                  >
                    ← Atrás
                  </button>

                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    {submittingBooking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirmando reserva...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" strokeWidth={3} />
                        <span>Confirmar reserva</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            COLUMNA DERECHA (5/4 COLS): RESUMEN DE RESERVA EN VIVO (STICKY)
        ═══════════════════════════════════════════════════════ */}
        <aside
          data-narrative-item
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 rounded-[32px] border p-6 sm:p-7 shadow-xl space-y-5"
          style={{
            backgroundColor: colors.surfaceCard,
            borderColor: selectedServices.length > 0 ? `${colors.accent}55` : colors.border,
          }}
        >
          <div
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: colors.border }}
          >
            <div>
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] block"
                style={{ color: colors.accent }}
              >
                RESUMEN DE TU CITA
              </span>
              <h4
                className="text-base sm:text-lg font-black tracking-tight mt-0.5 truncate"
                style={{ fontFamily: headingFont }}
              >
                {businessName}
              </h4>
            </div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
            >
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Lista de servicios seleccionados */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-60">
              <span>Servicios elegidos</span>
              <span>{totalAccumulatedDuration} min</span>
            </div>

            {selectedServices.length === 0 ? (
              <div
                className="p-4 rounded-2xl border border-dashed text-xs opacity-65 text-center"
                style={{ borderColor: colors.border }}
              >
                Selecciona al menos un servicio en el paso 1 para comenzar.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedServices.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                  >
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{svc.name}</span>
                      <span className="text-[11px] opacity-60">{svc.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black" style={{ color: colors.accent }}>
                        {formatCOP(Number(svc.price))}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleService(svc)}
                        className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Quitar servicio"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profesional, Fecha y Hora */}
          <div
            className="pt-4 border-t space-y-3 text-xs"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="opacity-60 font-medium">Profesional</span>
              <span className="font-bold truncate">
                {selectedBarber ? selectedBarber.name : 'Cualquier profesional'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="opacity-60 font-medium">Fecha</span>
              <span className="font-bold">
                {selectedDayObj
                  ? `${selectedDayObj.dayName} ${selectedDayObj.dayNum} ${selectedDayObj.month}`
                  : selectedDate}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="opacity-60 font-medium">Horario</span>
              <span
                className="font-bold"
                style={{ color: selectedSlot ? colors.accent : colors.textSecondary }}
              >
                {selectedSlot || 'Por elegir'}
              </span>
            </div>
          </div>

          {/* Total acumulado */}
          <div
            className="pt-4 border-t space-y-2"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-black uppercase tracking-wider opacity-70">
                Total estimado
              </span>
              <span
                className="text-xl sm:text-2xl font-black"
                style={{ fontFamily: headingFont, color: colors.accent }}
              >
                {formatCOP(totalAccumulatedPrice)}
              </span>
            </div>

            {isAdvanceActive && totalAccumulatedPrice > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 opacity-85">
                <span>Anticipo requerido hoy:</span>
                <span className="font-black" style={{ color: colors.accent }}>
                  {formatCOP(calculatedDepositAmount)}
                </span>
              </div>
            )}
          </div>

          <div
            className="pt-3 border-t flex items-center gap-2 text-[11px] opacity-65"
            style={{ borderColor: `${colors.border}80` }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
            <span>Reserva directa en la agenda oficial de {businessName}</span>
          </div>
        </aside>
      </div>

      {/* ── Modal de Ampliación y Descarga de Código QR ── */}
      {activeQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveQrModal(null)}
        >
          <div
            className="relative max-w-sm w-full rounded-3xl p-6 text-center space-y-4 shadow-2xl border"
            style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: `${colors.border}66` }}>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" style={{ color: colors.accent }} />
                <span className="text-xs font-black uppercase tracking-wider">
                  Código QR · {activeQrModal.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrModal(null)}
                className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto">
              <img
                src={activeQrModal.qrUrl}
                alt={`Código QR ${activeQrModal.title}`}
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <p className="text-[11px] opacity-75 max-w-xs mx-auto leading-relaxed">
              Abre la app de tu banco o billetera digital y escanea este código para transferir el anticipo.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadQr(activeQrModal.qrUrl, activeQrModal.title)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-md hover:scale-105"
                style={{ backgroundColor: colors.accent, color: accentBtnText }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveQrModal(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold opacity-80 hover:opacity-100 cursor-pointer"
                style={{ borderColor: colors.border }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
