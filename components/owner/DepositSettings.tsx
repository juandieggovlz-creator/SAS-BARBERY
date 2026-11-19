'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import jsQR from 'jsqr'
import {
  DollarSign,
  CheckCircle2,
  Sliders,
  Calculator,
  Info,
  Loader2,
  Wallet,
  Clock,
  KeyRound,
  Building2,
  Smartphone,
  Eye,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  QrCode,
  FileText,
  ArrowRight,
  TrendingUp,
  Upload,
  Trash2,
  Copy,
  Plus,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Maximize2,
  Download,
} from 'lucide-react'
import {
  DEFAULT_PAYMENT_METHODS_CONFIG,
  DEFAULT_PROFESSIONAL_INSTRUCTIONS,
  DepositPaymentMethodsConfig,
  CustomDepositMethod,
  validateDepositConfigHealth,
  DepositHealthReport,
} from '@/lib/booking/deposit-config'

interface DepositAppointmentItem {
  id: string
  reservationCode: string
  date: string
  status: string
  depositPaid: boolean
  client: {
    id: string
    name: string
    phone: string
    email?: string | null
  }
  barber: {
    id: string
    name: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
  financials: {
    totalPrice: number
    depositRequired: number
    depositPaidAmount: number
    remainingBalance: number
    depositStatus: string
    proofUrl?: string | null
    proofSubmittedAt?: string | null
    depositChannelLabel?: string | null
    holdExpiresAt?: string | null
    verifiedByName?: string | null
    verifiedAt?: string | null
    rejectionReason?: string | null
  }
}

export type DepositInternalTab =
  | 'overview'
  | 'verifications'
  | 'config'
  | 'accounts'
  | 'instructions'

interface QrScanResult {
  decodedData: string | null
  isLowResolution: boolean
  width: number
  height: number
}

interface DepositSettingsProps {
  initialTab?: DepositInternalTab
}

export default function DepositSettings({ initialTab = 'overview' }: DepositSettingsProps) {
  const [activeTab, setActiveTab] = useState<DepositInternalTab>(initialTab)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingQrMethod, setUploadingQrMethod] = useState<string | null>(null)

  // Configuración de Anticipos
  const [depositEnabled, setDepositEnabled] = useState(false)
  const [depositType, setDepositType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [depositPercentage, setDepositPercentage] = useState<number>(30)
  const [depositFixedAmount, setDepositFixedAmount] = useState<number>(15000)
  const [depositInstructions, setDepositInstructions] = useState<string>('')
  const [paymentMethods, setPaymentMethods] = useState<DepositPaymentMethodsConfig>({
    ...DEFAULT_PAYMENT_METHODS_CONFIG,
  })

  // Listado de citas con anticipo
  const [depositAppointments, setDepositAppointments] = useState<DepositAppointmentItem[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [previewProofItem, setPreviewProofItem] = useState<DepositAppointmentItem | null>(null)
  const [filterMode, setFilterMode] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING')

  // Modales adicionales
  const [previewQrModal, setPreviewQrModal] = useState<{ title: string; url: string; decoded?: string | null } | null>(null)
  const [showClientSimulationModal, setShowClientSimulationModal] = useState(false)
  const [simulatedSelectedMethod, setSimulatedSelectedMethod] = useState<string>('nequi')

  // Análisis QR en cliente por método
  const [qrAnalysisState, setQrAnalysisState] = useState<Record<string, QrScanResult>>({})

  // Formulario nuevo método personalizado
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  const [newCustomName, setNewCustomName] = useState('')
  const [newCustomAccount, setNewCustomAccount] = useState('')
  const [newCustomHolder, setNewCustomHolder] = useState('')
  const [newCustomDetails, setNewCustomDetails] = useState('')

  // Simulador de cálculo
  const [sampleServicePrice, setSampleServicePrice] = useState<number>(40000)

  // Referencias a inputs de archivos QR
  const qrInputRefs = {
    nequi: useRef<HTMLInputElement | null>(null),
    daviplata: useRef<HTMLInputElement | null>(null),
    breb: useRef<HTMLInputElement | null>(null),
    bank: useRef<HTMLInputElement | null>(null),
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/owner/settings/deposits')
      if (res.ok) {
        const data = await res.json()
        setDepositEnabled(Boolean(data.depositEnabled))
        setDepositType(data.depositType === 'FIXED' ? 'FIXED' : 'PERCENTAGE')
        setDepositPercentage(Number(data.depositPercentage) || 30)
        setDepositFixedAmount(Number(data.depositFixedAmount) || 15000)
        setDepositInstructions(data.depositInstructions || DEFAULT_PROFESSIONAL_INSTRUCTIONS)
        if (data.paymentMethods) {
          setPaymentMethods({
            ...DEFAULT_PAYMENT_METHODS_CONFIG,
            ...data.paymentMethods,
            customMethods: Array.isArray(data.paymentMethods.customMethods)
              ? data.paymentMethods.customMethods
              : [],
          })
        }
        if (Array.isArray(data.depositAppointments)) {
          setDepositAppointments(data.depositAppointments)
        }
      }
    } catch {
      toast.error('Error al cargar la información de anticipos')
    } finally {
      setLoading(false)
    }
  }

  const updateMethodField = <K extends keyof DepositPaymentMethodsConfig>(
    key: K,
    value: DepositPaymentMethodsConfig[K]
  ) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async (customSuccessMsg?: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/settings/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositEnabled,
          depositType,
          depositPercentage,
          depositFixedAmount,
          depositInstructions,
          paymentMethods,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(customSuccessMsg || 'Configuración de anticipos guardada correctamente ✨')
      } else {
        toast.error(data.error || 'Error al guardar los cambios')
      }
    } catch {
      toast.error('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Analizador técnico de QR en navegador con canvas + jsQR
  const analyzeImageQr = (file: File): Promise<QrScanResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new window.Image()
        img.onload = () => {
          const width = img.naturalWidth || img.width
          const height = img.naturalHeight || img.height
          const isLowResolution = width < 200 || height < 200

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            return resolve({ decodedData: null, isLowResolution, width, height })
          }

          ctx.drawImage(img, 0, 0, width, height)
          try {
            const imageData = ctx.getImageData(0, 0, width, height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            })
            resolve({
              decodedData: code ? code.data : null,
              isLowResolution,
              width,
              height,
            })
          } catch {
            resolve({ decodedData: null, isLowResolution, width, height })
          }
        }
        img.onerror = () =>
          resolve({ decodedData: null, isLowResolution: false, width: 0, height: 0 })
        img.src = dataUrl
      }
      reader.onerror = () =>
        resolve({ decodedData: null, isLowResolution: false, width: 0, height: 0 })
      reader.readAsDataURL(file)
    })
  }

  // Subida segura de QR
  const handleUploadQr = async (
    method: 'nequi' | 'daviplata' | 'breb' | 'bank' | string,
    file: File
  ) => {
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('Solo se admiten imágenes PNG, JPG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe pesar más de 5MB.')
      return
    }

    setUploadingQrMethod(method)

    try {
      // 1. Análisis local de legibilidad óptica con jsQR
      const analysis = await analyzeImageQr(file)
      setQrAnalysisState((prev) => ({ ...prev, [method]: analysis }))

      if (analysis.isLowResolution) {
        toast.warning(
          `Resolución reducida (${analysis.width}x${analysis.height}px). Podría verse borroso en móviles.`
        )
      }

      if (analysis.decodedData) {
        toast.success('¡Código QR decodificado con éxito! (Legible)')
      } else {
        toast.info(
          'El QR se guardará, pero recomendamos recortar la imagen y verificar contraste si tu banco no lo reconoce.'
        )
      }

      // 2. Subida segura a Cloudinary mediante API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('method', method)

      const res = await fetch('/api/owner/settings/deposits/qr', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.secureUrl) {
        if (method === 'nequi') {
          updateMethodField('nequiQrUrl', data.secureUrl)
        } else if (method === 'daviplata') {
          updateMethodField('daviplataQrUrl', data.secureUrl)
        } else if (method === 'breb') {
          updateMethodField('brebQrUrl', data.secureUrl)
        } else if (method === 'bank') {
          updateMethodField('bankQrUrl', data.secureUrl)
        } else {
          // Custom method
          setPaymentMethods((prev) => ({
            ...prev,
            customMethods: (prev.customMethods || []).map((cm) =>
              cm.id === method ? { ...cm, qrUrl: data.secureUrl } : cm
            ),
          }))
        }
        toast.success(`Código QR cargado correctamente para ${method.toUpperCase()} ✨`)
      } else {
        toast.error(data.error || 'No se pudo subir la imagen del QR.')
      }
    } catch {
      toast.error('Error de red al subir el código QR.')
    } finally {
      setUploadingQrMethod(null)
    }
  }

  const handleDeleteQr = async (
    method: 'nequi' | 'daviplata' | 'breb' | 'bank' | string,
    currentUrl?: string
  ) => {
    if (!currentUrl) return

    setUploadingQrMethod(method)
    try {
      const res = await fetch('/api/owner/settings/deposits/qr', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, qrUrl: currentUrl }),
      })

      if (res.ok) {
        if (method === 'nequi') updateMethodField('nequiQrUrl', '')
        else if (method === 'daviplata') updateMethodField('daviplataQrUrl', '')
        else if (method === 'breb') updateMethodField('brebQrUrl', '')
        else if (method === 'bank') updateMethodField('bankQrUrl', '')
        else {
          setPaymentMethods((prev) => ({
            ...prev,
            customMethods: (prev.customMethods || []).map((cm) =>
              cm.id === method ? { ...cm, qrUrl: '' } : cm
            ),
          }))
        }
        setQrAnalysisState((prev) => {
          const next = { ...prev }
          delete next[method]
          return next
        })
        toast.success('Código QR eliminado correctamente')
      } else {
        toast.error('No se pudo eliminar el código QR')
      }
    } catch {
      toast.error('Error de conexión al eliminar QR')
    } finally {
      setUploadingQrMethod(null)
    }
  }

  // Métodos de pago personalizados
  const handleAddCustomMethod = () => {
    if (!newCustomName.trim()) {
      toast.error('Ingresa el nombre del medio de pago')
      return
    }

    const newMethod: CustomDepositMethod = {
      id: `custom_${Date.now()}`,
      name: newCustomName.trim(),
      accountNumber: newCustomAccount.trim(),
      accountHolder: newCustomHolder.trim(),
      extraDetails: newCustomDetails.trim(),
      enabled: true,
    }

    setPaymentMethods((prev) => ({
      ...prev,
      customMethods: [...(prev.customMethods || []), newMethod],
    }))

    setNewCustomName('')
    setNewCustomAccount('')
    setNewCustomHolder('')
    setNewCustomDetails('')
    setShowAddCustomModal(false)
    toast.success('Medio de pago personalizado añadido ✨')
  }

  const handleDeleteCustomMethod = (id: string) => {
    setPaymentMethods((prev) => ({
      ...prev,
      customMethods: (prev.customMethods || []).filter((cm) => cm.id !== id),
    }))
    toast.success('Medio de pago eliminado')
  }

  const handleToggleCustomMethod = (id: string, enabled: boolean) => {
    setPaymentMethods((prev) => ({
      ...prev,
      customMethods: (prev.customMethods || []).map((cm) =>
        cm.id === id ? { ...cm, enabled } : cm
      ),
    }))
  }

  const handleVerifyDeposit = async (
    appointmentId: string,
    action: 'APPROVE' | 'REJECT',
    cancelOnReject = false
  ) => {
    setProcessingId(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositAction: action,
          paymentMethod: 'TRANSFER',
          cancelAppointmentOnReject: cancelOnReject,
          rejectionReason:
            action === 'REJECT'
              ? 'El comprobante enviado no pudo ser validado. Por favor adjunta un comprobante legible.'
              : null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(
          action === 'APPROVE'
            ? 'Anticipo aprobado y cita confirmada correctamente'
            : 'Comprobante rechazado'
        )
        setPreviewProofItem(null)
        fetchSettings()
      } else {
        toast.error(data.error || 'No se pudo procesar la verificación')
      }
    } catch {
      toast.error('Error de red al verificar anticipo')
    } finally {
      setProcessingId(null)
    }
  }

  // Cálculos del simulador
  const calculateDeposit = (price: number) => {
    if (!depositEnabled) return { deposit: 0, balance: price }
    if (depositType === 'PERCENTAGE') {
      const deposit = Math.round((price * depositPercentage) / 100)
      const balance = Math.max(0, price - deposit)
      return { deposit, balance }
    } else {
      const deposit = Math.min(price, depositFixedAmount)
      const balance = Math.max(0, price - deposit)
      return { deposit, balance }
    }
  }

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0)

  const preview = calculateDeposit(sampleServicePrice)

  const filteredAppointments = depositAppointments.filter((item) => {
    const st = item.financials.depositStatus
    if (filterMode === 'PENDING') {
      return st === 'PROOF_SUBMITTED' || st === 'TEMP_HOLD' || st === 'REJECTED'
    }
    if (filterMode === 'APPROVED') {
      return st === 'APPROVED' || item.depositPaid
    }
    return true
  })

  const pendingProofCount = depositAppointments.filter(
    (i) => i.financials.depositStatus === 'PROOF_SUBMITTED'
  ).length

  const approvedDepositCount = depositAppointments.filter(
    (i) => i.financials.depositStatus === 'APPROVED' || i.depositPaid
  ).length

  const totalCollectedDeposits = depositAppointments
    .filter((i) => i.financials.depositStatus === 'APPROVED' || i.depositPaid)
    .reduce(
      (sum, i) => sum + (i.financials.depositPaidAmount || i.financials.depositRequired || 0),
      0
    )

  // Diagnóstico de salud de configuración
  const healthReport: DepositHealthReport = validateDepositConfigHealth({
    depositEnabled,
    depositType,
    depositPercentage,
    depositFixedAmount,
    cleanInstructions: depositInstructions,
    paymentMethods,
  })

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-zinc-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span>Cargando gestión profesional de anticipos y medios de pago...</span>
      </div>
    )
  }

  const SUB_TABS: { id: DepositInternalTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Resumen & Diagnóstico',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'verifications',
      label: 'Comprobantes y Verificaciones',
      icon: <Clock className="w-3.5 h-3.5" />,
      badge: pendingProofCount,
    },
    {
      id: 'config',
      label: 'Reglas de Anticipo',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
    {
      id: 'accounts',
      label: 'Medios de Pago & Códigos QR',
      icon: <Wallet className="w-3.5 h-3.5" />,
    },
    {
      id: 'instructions',
      label: 'Instrucciones para Clientes',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── HEADER PRINCIPAL DE ANTICIPOS EN FINANZAS ── */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign className="w-6 h-6" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Módulo Financiero
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  depositEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {depositEnabled ? '● Exigencia Activa' : '○ Anticipos Opcionales'}
              </span>
              {healthReport.totalIssuesCount > 0 && depositEnabled && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {healthReport.totalIssuesCount} aviso(s)
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
              Configuración Profesional de Medios de Pago y Anticipos
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">
              Configura tus cuentas de Nequi, Daviplata, Bre-B, banco y personalizadas con códigos QR auditados. Sin pasarelas externas ni comisiones por transacción.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowClientSimulationModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-zinc-950 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Ver cómo lo verá mi cliente</span>
          </button>
          <button
            type="button"
            onClick={fetchSettings}
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── NAVEGACIÓN INTERNA DE PESTAÑAS (5 APARTADOS) ── */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/80 p-1.5 rounded-2xl overflow-x-auto">
        {SUB_TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#18181b] shadow-xs text-zinc-950 dark:text-white border border-zinc-200/60 dark:border-zinc-700/80'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          APARTADO 1 — RESUMEN & DIAGNÓSTICO
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Estado del Motor
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-zinc-950 dark:text-white">
                  {depositEnabled ? 'Exigencia Activa' : 'Desactivado'}
                </span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    depositEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {depositEnabled
                  ? `Cobrando ${depositType === 'PERCENTAGE' ? `${depositPercentage}%` : formatCOP(depositFixedAmount)} por cita.`
                  : 'Las reservas públicas se registran directamente sin anticipo.'}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('verifications')}
              className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2 cursor-pointer hover:border-amber-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  Por Verificar
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-2xl font-black text-zinc-950 dark:text-white">
                {pendingProofCount}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Comprobantes subidos esperando tu aprobación.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Recaudado en Señas
              </span>
              <div className="text-2xl font-black text-zinc-950 dark:text-white">
                {formatCOP(totalCollectedDeposits)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {approvedDepositCount} cita(s) con anticipo confirmado.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('accounts')}
              className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2 cursor-pointer hover:border-zinc-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Medios Activos & QRs
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-2xl font-black text-zinc-950 dark:text-white">
                {healthReport.activeMethodsCount} activos · {healthReport.qrCount} QR(s)
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Nequi, Daviplata, Bre-B, banco y personalizados.
              </p>
            </div>
          </div>

          {/* Checklist de Salud y Diagnóstico Visual */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Diagnóstico Visual de Configuración</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Verifica que tus medios de pago estén listos y que los datos sean coherentes antes de recibirlos de tus clientes.
                </p>
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                  healthReport.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {healthReport.isConfigured ? '✓ Configuración Saludable' : '⚠️ Requiere Atención'}
              </span>
            </div>

            {/* Alertas del Diagnóstico */}
            {healthReport.issues.length > 0 ? (
              <div className="space-y-2 pt-1">
                {healthReport.issues.map((iss, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                      iss.type === 'ERROR'
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="font-black uppercase tracking-wide mr-1.5">
                        [{iss.method}]:
                      </strong>
                      <span>{iss.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Todos los medios de pago activos tienen su información obligatoria completa (números, titulares y reglas consistentes).
                </span>
              </div>
            )}

            {/* Recomendación de Seguridad del Banco */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <div className="flex items-center gap-2 font-black uppercase text-[11px] text-zinc-900 dark:text-white">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Recomendación de seguridad obligatoria</span>
              </div>
              <p className="leading-relaxed">
                Antes de activar o publicar un código QR al público, abre tu aplicación bancaria oficial (Nequi, Daviplata o tu app de banco), escanea el código y confirma que el nombre del destinatario coincida con tu barbería o tu titular registrado.
              </p>
              <p className="text-[10px] text-zinc-400 italic">
                * BarberOS nunca te solicitará contraseñas, claves dinámicas ni credenciales bancarias.
              </p>
            </div>
          </div>

          {/* Simulador Interactivo */}
          <div className="bg-zinc-950 dark:bg-[#121215] text-white p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-white">
                    Simulador de Liquidación de Anticipo en Vivo
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Comprueba cómo el motor divide el anticipo inicial y el saldo restante en caja.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Precio del Servicio:</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">$</span>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={sampleServicePrice}
                    onChange={(e) => setSampleServicePrice(Math.max(5000, Number(e.target.value)))}
                    className="w-32 pl-6 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono font-black text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Total del Servicio
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {formatCOP(sampleServicePrice)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Valor bruto de la cita</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Anticipo Exigido al Agendar
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {formatCOP(preview.deposit)}
                </div>
                <div className="text-[11px] text-amber-200/80 mt-0.5">
                  {depositEnabled
                    ? depositType === 'PERCENTAGE'
                      ? `${depositPercentage}% del total`
                      : 'Monto fijo configurado'
                    : 'Sin anticipo (Inactivo)'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Saldo Restante al Pagar en Caja
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCOP(preview.balance)}
                </div>
                <div className="text-[11px] text-emerald-200/70 mt-0.5">
                  Cobrado en Finanzas → Pendientes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          APARTADO 2 — COMPROBANTES Y VERIFICACIONES (BANDEJA CENTRALIZADA)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'verifications' && (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Bandeja de Comprobantes y Verificaciones</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Valida las capturas enviadas por los clientes desde la web o WhatsApp. Al aprobar, la cita se confirma automáticamente y el anticipo se registra en Finanzas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl text-[11px] font-black uppercase">
                <button
                  type="button"
                  onClick={() => setFilterMode('PENDING')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterMode === 'PENDING'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Por Verificar ({pendingProofCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('APPROVED')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterMode === 'APPROVED'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Verificados ({approvedDepositCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterMode === 'ALL'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Todos ({depositAppointments.length})
                </button>
              </div>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400 font-bold flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span>No hay comprobantes en este filtro.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((item) => {
                const fin = item.financials
                const st = fin.depositStatus
                const isApproved = st === 'APPROVED' || item.depositPaid
                const isProofSubmitted = st === 'PROOF_SUBMITTED'
                const isRejected = st === 'REJECTED'

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          #{item.reservationCode}
                        </span>
                        <span className="text-sm font-black text-zinc-950 dark:text-white uppercase">
                          {item.client.name}
                        </span>
                        <span className="text-xs text-zinc-400 font-semibold">
                          ({item.client.phone})
                        </span>
                        {isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Anticipo Aprobado
                          </span>
                        ) : isProofSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                            Comprobante Adjunto · Por Verificar
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            Comprobante Rechazado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            Esperando Comprobante
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        <strong>{item.service.name}</strong> · Barbero: {item.barber.name} ·{' '}
                        {new Date(item.date).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <span>
                          Total Cita: <strong>{formatCOP(fin.totalPrice)}</strong>
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          Anticipo: <strong>{formatCOP(fin.depositRequired)}</strong>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Saldo restante a cobrar: <strong>{formatCOP(fin.remainingBalance)}</strong>
                        </span>
                        {fin.verifiedByName && (
                          <span className="text-[11px] text-zinc-400">
                            Aprobado por: <strong>{fin.verifiedByName}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {fin.proofUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewProofItem(item)}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5 hover:border-amber-500 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ver Comprobante</span>
                        </button>
                      )}

                      {!isApproved && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleVerifyDeposit(item.id, 'APPROVE')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleVerifyDeposit(item.id, 'REJECT', false)}
                            className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          APARTADO 3 — REGLAS DE ANTICIPO
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Switch Principal */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight block cursor-pointer">
                Exigir anticipo obligatorio para agendar citas
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {depositEnabled
                  ? 'Activo: los clientes deberán transferir el anticipo para proteger su cupo.'
                  : 'Inactivo: las citas se agendan directamente sin solicitar abono previo.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDepositEnabled(!depositEnabled)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                depositEnabled ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
              role="switch"
              aria-checked={depositEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  depositEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modalidad de Cálculo */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Modalidad de Cálculo y Montos</span>
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Elige cómo calcular la seña exigida a tus clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDepositType('PERCENTAGE')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositType === 'PERCENTAGE'
                    ? 'border-amber-500 bg-amber-500/10 text-zinc-950 dark:text-white'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-tight">
                    Porcentaje del Total
                  </span>
                  <span className="text-xs font-bold text-amber-500">%</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Calcula el abono proporcional al valor total de los servicios seleccionados.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDepositType('FIXED')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositType === 'FIXED'
                    ? 'border-amber-500 bg-amber-500/10 text-zinc-950 dark:text-white'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-tight">
                    Valor Fijo en COP
                  </span>
                  <span className="text-xs font-bold text-amber-500">$ COP</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Un monto fijo para asegurar el turno (nunca superará el valor del servicio).
                </p>
              </button>
            </div>

            {depositType === 'PERCENTAGE' ? (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Porcentaje exigido:{' '}
                    <strong className="text-amber-600 dark:text-amber-400 font-black text-sm">
                      {depositPercentage}%
                    </strong>
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Rango: 5% a 90%
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] font-bold text-zinc-400 font-mono">
                  <span>10%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>90%</span>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Monto Fijo de Anticipo ($ COP)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={depositFixedAmount}
                    onChange={(e) =>
                      setDepositFixedAmount(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    placeholder="15000"
                  />
                </div>
              </div>
            )}

            {/* Plazo para enviar comprobante */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Plazo máximo para adjuntar comprobante (Hold temporal)
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tiempo que el horario permanece bloqueado esperando la transferencia antes de liberarse automáticamente.
                </p>
              </div>
              <select
                value={paymentMethods.holdMinutes || 30}
                onChange={(e) => updateMethodField('holdMinutes', Number(e.target.value))}
                className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white outline-none"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos (Recomendado)</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleSave('Reglas de anticipo guardadas exitosamente ✨')}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              <span>Guardar Reglas de Anticipo</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          APARTADO 4 — MEDIOS DE PAGO & CÓDIGOS QR
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Introducción y botón agregar personalizado */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <span>Medios de Pago Autorizados & Códigos QR</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Cada barbería gestiona exclusivamente sus propios números y QRs. Los clientes transferirán directamente a estas cuentas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-950 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Añadir Otro Medio Manual</span>
            </button>
          </div>

          {/* Grid de Medios de Pago Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. NEQUI */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-zinc-950 dark:text-white">
                      Nequi
                    </h4>
                    <span className="text-[10px] text-zinc-400 block font-medium">Billetera Digital</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={paymentMethods.nequiEnabled}
                  onChange={(e) => updateMethodField('nequiEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer rounded-lg"
                />
              </div>

              {paymentMethods.nequiEnabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Número Celular Nequi (10 dígitos) *
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={paymentMethods.nequiNumber}
                      onChange={(e) => updateMethodField('nequiNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 3001234567"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.nequiHolder}
                      onChange={(e) => updateMethodField('nequiHolder', e.target.value)}
                      placeholder="Ej: Juan Pérez / Barbería Elite SAS"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Sección QR Nequi */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-pink-500" />
                        Código QR Nequi (Opcional)
                      </span>
                      {paymentMethods.nequiQrUrl && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ QR Cargado
                        </span>
                      )}
                    </div>

                    {paymentMethods.nequiQrUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div
                          onClick={() =>
                            setPreviewQrModal({
                              title: 'Código QR Nequi',
                              url: paymentMethods.nequiQrUrl!,
                              decoded: qrAnalysisState.nequi?.decodedData,
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border">
                            <img
                              src={paymentMethods.nequiQrUrl}
                              alt="QR Nequi"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                              Ver código QR ampliado
                            </span>
                            <span className="text-[10px] text-zinc-400">Clic para previsualizar</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => qrInputRefs.nequi.current?.click()}
                            disabled={uploadingQrMethod === 'nequi'}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQr('nequi', paymentMethods.nequiQrUrl)}
                            disabled={uploadingQrMethod === 'nequi'}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Eliminar QR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={qrInputRefs.nequi}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadQr('nequi', f)
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingQrMethod === 'nequi'}
                          onClick={() => qrInputRefs.nequi.current?.click()}
                          className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-pink-500 hover:text-pink-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {uploadingQrMethod === 'nequi' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analizando y subiendo QR...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir imagen de Código QR Nequi</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {qrAnalysisState.nequi?.decodedData && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                        ✓ Decodificado: {qrAnalysisState.nequi.decodedData}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. DAVIPLATA */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-black">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-zinc-950 dark:text-white">
                      Daviplata
                    </h4>
                    <span className="text-[10px] text-zinc-400 block font-medium">Davivienda</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={paymentMethods.daviplataEnabled}
                  onChange={(e) => updateMethodField('daviplataEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer rounded-lg"
                />
              </div>

              {paymentMethods.daviplataEnabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Número Celular Daviplata (10 dígitos) *
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={paymentMethods.daviplataNumber}
                      onChange={(e) => updateMethodField('daviplataNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 3109876543"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.daviplataHolder}
                      onChange={(e) => updateMethodField('daviplataHolder', e.target.value)}
                      placeholder="Ej: María Gómez"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Sección QR Daviplata */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-red-500" />
                        Código QR Daviplata (Opcional)
                      </span>
                      {paymentMethods.daviplataQrUrl && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ QR Cargado
                        </span>
                      )}
                    </div>

                    {paymentMethods.daviplataQrUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div
                          onClick={() =>
                            setPreviewQrModal({
                              title: 'Código QR Daviplata',
                              url: paymentMethods.daviplataQrUrl!,
                              decoded: qrAnalysisState.daviplata?.decodedData,
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border">
                            <img
                              src={paymentMethods.daviplataQrUrl}
                              alt="QR Daviplata"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                              Ver código QR ampliado
                            </span>
                            <span className="text-[10px] text-zinc-400">Clic para previsualizar</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => qrInputRefs.daviplata.current?.click()}
                            disabled={uploadingQrMethod === 'daviplata'}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQr('daviplata', paymentMethods.daviplataQrUrl)}
                            disabled={uploadingQrMethod === 'daviplata'}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Eliminar QR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={qrInputRefs.daviplata}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadQr('daviplata', f)
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingQrMethod === 'daviplata'}
                          onClick={() => qrInputRefs.daviplata.current?.click()}
                          className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {uploadingQrMethod === 'daviplata' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analizando y subiendo QR...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir imagen de Código QR Daviplata</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. BRE-B / TRANSFIYA */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-zinc-950 dark:text-white">
                      Bre-B / Transfiya
                    </h4>
                    <span className="text-[10px] text-zinc-400 block font-medium">Interoperabilidad Inmediata</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={paymentMethods.brebEnabled}
                  onChange={(e) => updateMethodField('brebEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer rounded-lg"
                />
              </div>

              {paymentMethods.brebEnabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                        Llave Bre-B *
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.brebKey}
                        onChange={(e) => updateMethodField('brebKey', e.target.value)}
                        placeholder="Celular, correo o llave alfanumérica"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                        Entidad Financiera *
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.brebEntity || 'Bancolombia'}
                        onChange={(e) => updateMethodField('brebEntity', e.target.value)}
                        placeholder="Ej: Bancolombia, Lulo, Davivienda"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Nombre del Titular de la Llave *
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.brebHolder}
                      onChange={(e) => updateMethodField('brebHolder', e.target.value)}
                      placeholder="Ej: Barbería Elite SAS"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Sección QR Bre-B */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-500" />
                        Código QR Bre-B (Opcional)
                      </span>
                      {paymentMethods.brebQrUrl && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ QR Cargado
                        </span>
                      )}
                    </div>

                    {paymentMethods.brebQrUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div
                          onClick={() =>
                            setPreviewQrModal({
                              title: 'Código QR Bre-B',
                              url: paymentMethods.brebQrUrl!,
                              decoded: qrAnalysisState.breb?.decodedData,
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border">
                            <img
                              src={paymentMethods.brebQrUrl}
                              alt="QR Bre-B"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                              Ver código QR ampliado
                            </span>
                            <span className="text-[10px] text-zinc-400">Clic para previsualizar</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => qrInputRefs.breb.current?.click()}
                            disabled={uploadingQrMethod === 'breb'}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQr('breb', paymentMethods.brebQrUrl)}
                            disabled={uploadingQrMethod === 'breb'}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Eliminar QR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={qrInputRefs.breb}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadQr('breb', f)
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingQrMethod === 'breb'}
                          onClick={() => qrInputRefs.breb.current?.click()}
                          className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {uploadingQrMethod === 'breb' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analizando y subiendo QR...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir imagen de Código QR Bre-B</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. TRANSFERENCIA BANCARIA */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-zinc-950 dark:text-white">
                      Cuenta Bancaria
                    </h4>
                    <span className="text-[10px] text-zinc-400 block font-medium">Transferencia Directa</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={paymentMethods.bankEnabled}
                  onChange={(e) => updateMethodField('bankEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer rounded-lg"
                />
              </div>

              {paymentMethods.bankEnabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                        Banco *
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.bankName}
                        onChange={(e) => updateMethodField('bankName', e.target.value)}
                        placeholder="Ej: Bancolombia"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                        Tipo de Cuenta *
                      </label>
                      <select
                        value={paymentMethods.bankAccountType}
                        onChange={(e) => updateMethodField('bankAccountType', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-950 dark:text-white outline-none"
                      >
                        <option value="Ahorros">Cuenta de Ahorros</option>
                        <option value="Corriente">Cuenta Corriente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Número de Cuenta *
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.bankAccountNumber}
                      onChange={(e) => updateMethodField('bankAccountNumber', e.target.value)}
                      placeholder="Ej: 123-456789-00"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                      Nombre del Titular / NIT o CC *
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.bankHolder}
                      onChange={(e) => updateMethodField('bankHolder', e.target.value)}
                      placeholder="Ej: Barbería Elite SAS - NIT 900.123.456-7"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Sección QR Bancario */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-blue-500" />
                        Código QR Bancario (Opcional)
                      </span>
                      {paymentMethods.bankQrUrl && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ QR Cargado
                        </span>
                      )}
                    </div>

                    {paymentMethods.bankQrUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div
                          onClick={() =>
                            setPreviewQrModal({
                              title: `Código QR ${paymentMethods.bankName}`,
                              url: paymentMethods.bankQrUrl!,
                              decoded: qrAnalysisState.bank?.decodedData,
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden border">
                            <img
                              src={paymentMethods.bankQrUrl}
                              alt="QR Banco"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                              Ver código QR ampliado
                            </span>
                            <span className="text-[10px] text-zinc-400">Clic para previsualizar</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => qrInputRefs.bank.current?.click()}
                            disabled={uploadingQrMethod === 'bank'}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQr('bank', paymentMethods.bankQrUrl)}
                            disabled={uploadingQrMethod === 'bank'}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Eliminar QR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={qrInputRefs.bank}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadQr('bank', f)
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingQrMethod === 'bank'}
                          onClick={() => qrInputRefs.bank.current?.click()}
                          className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {uploadingQrMethod === 'bank' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analizando y subiendo QR...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir imagen de Código QR Bancario</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medios de Pago Personalizados Adicionales */}
          {Array.isArray(paymentMethods.customMethods) && paymentMethods.customMethods.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Otros Medios Manuales Personalizados</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.customMethods.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                          {cm.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cm.enabled}
                          onChange={(e) => handleToggleCustomMethod(cm.id, e.target.checked)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomMethod(cm.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      {cm.accountNumber && (
                        <p>
                          Cuenta/Ref: <strong>{cm.accountNumber}</strong>
                        </p>
                      )}
                      {cm.accountHolder && (
                        <p>
                          Titular: <strong>{cm.accountHolder}</strong>
                        </p>
                      )}
                      {cm.extraDetails && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {cm.extraDetails}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón Guardar Medios de Pago */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handleSave('Cuentas y códigos QR guardados exitosamente ✨')}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span>Guardar Cuentas y Códigos QR</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          APARTADO 5 — INSTRUCCIONES PARA CLIENTES
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'instructions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Mensaje de Instrucciones para Clientes (Web y WhatsApp)</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Texto que guía al cliente paso a paso al momento de transferir el anticipo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDepositInstructions(DEFAULT_PROFESSIONAL_INSTRUCTIONS)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Restablecer texto recomendado
              </button>
            </div>

            <textarea
              rows={9}
              value={depositInstructions}
              onChange={(e) => setDepositInstructions(e.target.value)}
              placeholder="Instrucciones paso a paso para el cliente..."
              className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 resize-none font-medium leading-relaxed font-sans"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Política de Cancelación y Reprogramación</span>
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Reglas sobre devoluciones, reprogramación sin costo y plazos para notificar.
              </p>
            </div>

            <input
              type="text"
              value={paymentMethods.cancellationPolicy || ''}
              onChange={(e) => updateMethodField('cancellationPolicy', e.target.value)}
              placeholder="Ej: El anticipo asegura tu cupo exclusivo. Puedes reprogramar sin costo avisando con al menos 3 horas de anticipación."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleSave('Instrucciones y políticas guardadas exitosamente ✨')}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              <span>Guardar Instrucciones</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVISUALIZAR CÓDIGO QR AMPLIADO ── */}
      {previewQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewQrModal(null)}
        >
          <div
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                {previewQrModal.title}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewQrModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center">
              <img
                src={previewQrModal.url}
                alt={previewQrModal.title}
                className="w-64 h-64 object-contain"
              />
            </div>

            {previewQrModal.decoded && (
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 break-all text-left">
                <strong>Contenido Decodificado:</strong> {previewQrModal.decoded}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={previewQrModal.url}
                download="codigo-qr-barberos.png"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-zinc-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Imagen</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VER CÓMO LO VERÁ MI CLIENTE («VISTA PREVIA CLIENTE») ── */}
      {showClientSimulationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowClientSimulationModal(false)}
        >
          <div
            className="bg-zinc-950 text-white border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Simulación de Pantalla del Cliente
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowClientSimulationModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulación del Ticket */}
            <div className="p-5 rounded-2xl bg-[#111317] border border-amber-500/40 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-black uppercase tracking-wider text-amber-400 text-xs">
                  Reserva en Proceso #{Date.now().toString().slice(-6)}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Pago en Verificación
                </span>
              </div>

              {/* Desglose Financiero */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Total Cita</span>
                  <span className="font-black text-sm">{formatCOP(sampleServicePrice)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40">
                  <span className="text-[10px] text-amber-300 block font-black uppercase">Anticipo</span>
                  <span className="font-black text-sm text-amber-400">{formatCOP(preview.deposit)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Saldo al llegar</span>
                  <span className="font-black text-sm">{formatCOP(preview.balance)}</span>
                </div>
              </div>

              {/* Selector de Medios Activos */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Selecciona cómo vas a transferir:
                </span>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.nequiEnabled && (
                    <button
                      type="button"
                      onClick={() => setSimulatedSelectedMethod('nequi')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        simulatedSelectedMethod === 'nequi'
                          ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      Nequi
                    </button>
                  )}
                  {paymentMethods.daviplataEnabled && (
                    <button
                      type="button"
                      onClick={() => setSimulatedSelectedMethod('daviplata')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        simulatedSelectedMethod === 'daviplata'
                          ? 'border-red-500 bg-red-500/20 text-red-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      Daviplata
                    </button>
                  )}
                  {paymentMethods.brebEnabled && (
                    <button
                      type="button"
                      onClick={() => setSimulatedSelectedMethod('breb')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        simulatedSelectedMethod === 'breb'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      Bre-B
                    </button>
                  )}
                  {paymentMethods.bankEnabled && (
                    <button
                      type="button"
                      onClick={() => setSimulatedSelectedMethod('bank')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        simulatedSelectedMethod === 'bank'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {paymentMethods.bankName || 'Banco'}
                    </button>
                  )}
                </div>
              </div>

              {/* Detalle del Medio Seleccionado con Copiar y QR */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                {simulatedSelectedMethod === 'nequi' && paymentMethods.nequiEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-pink-400 font-bold block uppercase">
                          Nequi {paymentMethods.nequiHolder ? `· ${paymentMethods.nequiHolder}` : ''}
                        </span>
                        <span className="text-sm font-mono font-bold">{paymentMethods.nequiNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(paymentMethods.nequiNumber)
                          toast.success('Número Nequi copiado')
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>

                    {paymentMethods.nequiQrUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                        <img
                          src={paymentMethods.nequiQrUrl}
                          alt="QR Nequi"
                          className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                        />
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">
                            Código QR Nequi
                          </span>
                          <span className="text-xs font-medium text-zinc-300">
                            Disponible para escanear en pantalla
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {simulatedSelectedMethod === 'daviplata' && paymentMethods.daviplataEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-red-400 font-bold block uppercase">
                          Daviplata {paymentMethods.daviplataHolder ? `· ${paymentMethods.daviplataHolder}` : ''}
                        </span>
                        <span className="text-sm font-mono font-bold">{paymentMethods.daviplataNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(paymentMethods.daviplataNumber)
                          toast.success('Número Daviplata copiado')
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>

                    {paymentMethods.daviplataQrUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                        <img
                          src={paymentMethods.daviplataQrUrl}
                          alt="QR Daviplata"
                          className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                        />
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">
                            Código QR Daviplata
                          </span>
                          <span className="text-xs font-medium text-zinc-300">
                            Disponible para escanear en pantalla
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {simulatedSelectedMethod === 'breb' && paymentMethods.brebEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold block uppercase">
                          Llave Bre-B ({paymentMethods.brebEntity || 'Bancolombia'}) {paymentMethods.brebHolder ? `· ${paymentMethods.brebHolder}` : ''}
                        </span>
                        <span className="text-sm font-mono font-bold">{paymentMethods.brebKey}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(paymentMethods.brebKey)
                          toast.success('Llave Bre-B copiada')
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>

                    {paymentMethods.brebQrUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                        <img
                          src={paymentMethods.brebQrUrl}
                          alt="QR Bre-B"
                          className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                        />
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">
                            Código QR Bre-B
                          </span>
                          <span className="text-xs font-medium text-zinc-300">
                            Disponible para escanear en pantalla
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {simulatedSelectedMethod === 'bank' && paymentMethods.bankEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-400 font-bold block uppercase">
                          {paymentMethods.bankName} ({paymentMethods.bankAccountType}) {paymentMethods.bankHolder ? `· ${paymentMethods.bankHolder}` : ''}
                        </span>
                        <span className="text-sm font-mono font-bold">{paymentMethods.bankAccountNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(paymentMethods.bankAccountNumber)
                          toast.success('Número de cuenta copiado')
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>

                    {paymentMethods.bankQrUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                        <img
                          src={paymentMethods.bankQrUrl}
                          alt="QR Banco"
                          className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                        />
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">
                            Código QR Bancario
                          </span>
                          <span className="text-xs font-medium text-zinc-300">
                            Disponible para escanear en pantalla
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Simulado de Adjuntar Comprobante */}
              <div className="p-3.5 rounded-xl border border-dashed border-zinc-700 text-center space-y-1">
                <span className="text-xs font-bold text-amber-400 block">
                  Paso Final: Adjuntar Comprobante
                </span>
                <p className="text-[10px] text-zinc-400">
                  El cliente sube la captura de su transferencia y la cita entra en la bandeja de verificación.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowClientSimulationModal(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AÑADIR MEDIO DE PAGO PERSONALIZADO ── */}
      {showAddCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowAddCustomModal(false)}
        >
          <div
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                Añadir Medio Manual Personalizado
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                  Nombre del Medio (ej: Efecty, Zelle, Western Union) *
                </label>
                <input
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="Ej: Zelle / Dólares"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                  Número, Correo o Referencia de Pago
                </label>
                <input
                  type="text"
                  value={newCustomAccount}
                  onChange={(e) => setNewCustomAccount(e.target.value)}
                  placeholder="Ej: pagos@barberia.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  value={newCustomHolder}
                  onChange={(e) => setNewCustomHolder(e.target.value)}
                  placeholder="Ej: Barbería Elite"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                  Instrucciones específicas
                </label>
                <input
                  type="text"
                  value={newCustomDetails}
                  onChange={(e) => setNewCustomDetails(e.target.value)}
                  placeholder="Ej: Enviar comprobante con tu nombre y fecha en la nota."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-950 dark:text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomMethod}
                className="px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white text-xs font-black uppercase cursor-pointer hover:bg-zinc-800"
              >
                Agregar Medio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PARA INSPECCIONAR EL COMPROBANTE DE PAGO EN ALTA RESOLUCIÓN ── */}
      {previewProofItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewProofItem(null)}
        >
          <div
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  Reserva #{previewProofItem.reservationCode}
                </span>
                <h4 className="text-base font-black text-zinc-950 dark:text-white uppercase">
                  Comprobante de {previewProofItem.client.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block font-bold">
                  Total Cita
                </span>
                <span className="font-black text-zinc-950 dark:text-white">
                  {formatCOP(previewProofItem.financials.totalPrice)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-500 uppercase block font-bold">
                  Anticipo Exigido
                </span>
                <span className="font-black text-amber-500">
                  {formatCOP(previewProofItem.financials.depositRequired)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-500 uppercase block font-bold">
                  Saldo Restante
                </span>
                <span className="font-black text-emerald-500">
                  {formatCOP(previewProofItem.financials.remainingBalance)}
                </span>
              </div>
            </div>

            {previewProofItem.financials.proofUrl && (
              <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 max-h-96 flex items-center justify-center p-1">
                <img
                  src={previewProofItem.financials.proofUrl}
                  alt="Comprobante de pago"
                  className="max-h-96 w-auto object-contain rounded-xl"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={processingId === previewProofItem.id}
                onClick={() => handleVerifyDeposit(previewProofItem.id, 'REJECT', false)}
                className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black uppercase cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all disabled:opacity-50"
              >
                Rechazar Comprobante
              </button>
              <button
                type="button"
                disabled={processingId === previewProofItem.id}
                onClick={() => handleVerifyDeposit(previewProofItem.id, 'APPROVE')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase cursor-pointer transition-all shadow-xs disabled:opacity-50"
              >
                Aprobar Anticipo y Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
