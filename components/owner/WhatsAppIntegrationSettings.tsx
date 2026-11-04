'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Rocket,
  Play,
  Plug,
  Settings as SettingsIcon,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Copy,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  Check,
  CheckCheck,
  Info,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Bot,
  Loader2,
  X,
  UserCheck,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Headphones,
  Zap,
  Lock,
  Wand2,
  Save,
  Wifi,
  Radio,
  HelpCircle,
  PauseCircle,
  PlayCircle
} from 'lucide-react'
import { getWhatsAppWebhookUrl } from '@/lib/url'

interface WhatsAppData {
  id?: string
  businessName?: string
  businessSlug?: string
  isEnabled: boolean
  provider: 'META' | 'BAILEYS' | 'NONE'
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_READY' | 'FAILED'
  phoneNumber: string | null
  metaPhoneNumberId: string | null
  metaWabaId: string | null
  metaAccessToken: string | null
  metaAccessTokenMasked?: string | null
  hasMetaAccessToken?: boolean
  metaWebhookSecret: string | null
  metaAppId?: string | null
  metaAppSecret?: string | null
  baileysEndpoint: string | null
  baileysQrCode: string | null
  botEnabled: boolean
  bookingEnabled: boolean
  allowBarberSelection: boolean
  welcomeMessage: string | null
  advisorMessage: string | null
  goodbyeMessage: string | null
  notifyBusinessOnBooking: boolean
  confirmTemplate: string | null
  reminderTemplate: string | null
  reminderHoursBefore: number
  connectedAt?: string | null
  humanConversations?: {
    id: string
    customerPhone: string
    lastActivityAt: string
    state: string
    isBotActive?: boolean
    isHumanAgent?: boolean
  }[]
  conversations?: {
    id: string
    customerPhone: string
    lastActivityAt: string
    state: string
    isBotActive: boolean
    isHumanAgent: boolean
  }[]
  recentLogs?: {
    id: string
    direction: 'INBOUND' | 'OUTBOUND'
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING'
    provider: string
    from: string
    to: string
    messageBody: string
    errorDetails: string | null
    createdAt: string
  }[]
  defaultTemplates?: {
    confirm: string
    reminder: string
    welcome: string
  }
}

export default function WhatsAppIntegrationSettings() {
  const [data, setData] = useState<WhatsAppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'flows' | 'human_agents' | 'logs'>('flows')
  const [chatFilter, setChatFilter] = useState<'all' | 'human' | 'bot'>('all')

  // Estado para responder manualmente a un chat
  const [replyingPhone, setReplyingPhone] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Modales
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [metaModalTab, setMetaModalTab] = useState<'embedded' | 'manual'>('embedded')
  const [showMetaQrModal, setShowMetaQrModal] = useState(false)
  const [metaQrData, setMetaQrData] = useState<{
    qrCodeDataUrl: string
    chatUrl: string
    phoneNumber: string
    verifiedName?: string
  } | null>(null)
  const [metaVerifying, setMetaVerifying] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [currentQr, setCurrentQr] = useState<string | null>(null)
  const [qrStep, setQrStep] = useState<0 | 1 | 2>(0) // 0=iniciando, 1=escanear, 2=conectado
  const [qrCountdown, setQrCountdown] = useState(45)
  const [qrExpired, setQrExpired] = useState(false)
  const [embeddedSignupLoading, setEmbeddedSignupLoading] = useState(false)

  // Testing
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState(false)

  // Meta WhatsApp Form State
  const [metaSavingOnly, setMetaSavingOnly] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookOnline, setWebhookOnline] = useState<boolean | null>(null)

  const [metaForm, setMetaForm] = useState({
    appId: '',
    appSecret: '',
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    webhookSecret: ''
  })

  // Cargar configuración
  const fetchConfig = async () => {
    try {
      setLoading(true)
      const activeBranch = typeof window !== 'undefined' ? sessionStorage.getItem('active_branch_id') : null
      const url = activeBranch ? `/api/owner/integrations/whatsapp?branchId=${activeBranch}` : '/api/owner/integrations/whatsapp'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setMetaForm({
          appId: json.metaAppId || '',
          appSecret: json.metaAppSecret || '',
          phoneNumberId: json.metaPhoneNumberId || '',
          wabaId: json.metaWabaId || '',
          accessToken: '', // Mantener vacío en edición por seguridad
          webhookSecret: json.metaWebhookSecret || 'barberos_secure_webhook_token_2026'
        })
      }
    } catch {
      toast.error('Error al cargar la integración de WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    const handleBranchChange = () => fetchConfig()
    window.addEventListener('branch-changed', handleBranchChange)
    return () => window.removeEventListener('branch-changed', handleBranchChange)
  }, [])

  // Pre-cargar SDK de Meta (Facebook Login for Business) anticipadamente para que esté listo al hacer clic
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).FB) return

    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || '1798187644961786'

    ;(window as any).fbAsyncInit = function () {
      try {
        ;(window as any).FB.init({
          appId: metaAppId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v21.0'
        })
      } catch (e) {
        console.warn('Error inicializando FB SDK:', e)
      }
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/es_LA/sdk.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  // Guardar cambios generales
  const handleSave = async (partialUpdates?: Partial<WhatsAppData>) => {
    if (!data) return
    setSaving(true)
    const payload = { ...data, ...partialUpdates }
    try {
      const res = await fetch('/api/owner/integrations/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const updated = await res.json()
        setData(prev => prev ? { ...prev, ...updated.integration } : updated.integration)
        toast.success('Configuración guardada correctamente ✨')
      } else {
        toast.error('No se pudo guardar la configuración')
      }
    } catch {
      toast.error('Error de red al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Reanudar Bot para un cliente específico
  const handleResumeBot = async (customerPhone: string) => {
    try {
      const res = await fetch('/api/owner/integrations/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumePhone: customerPhone })
      })
      if (res.ok) {
        toast.success(`Bot activado para +${customerPhone} 🤖`)
        await fetchConfig()
      } else {
        toast.error('Error al activar el bot')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // Pausar Bot para un cliente (Tomar chat manual / Evitar choque)
  const handlePauseBot = async (customerPhone: string) => {
    try {
      const res = await fetch('/api/owner/integrations/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pausePhone: customerPhone })
      })
      if (res.ok) {
        toast.success(`Bot pausado para +${customerPhone}. ¡Ahora estás a cargo! 👤`)
        await fetchConfig()
      } else {
        toast.error('Error al pausar el bot')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // Enviar mensaje manual y pausar el bot automáticamente para ese chat
  const handleSendManualReply = async (customerPhone: string) => {
    if (!replyMessage.trim()) {
      toast.error('Escribe un mensaje antes de enviar')
      return
    }
    setSendingReply(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone,
          manualMessage: replyMessage.trim()
        })
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success(`Mensaje enviado a +${customerPhone} y bot pausado 🚀`)
        setReplyMessage('')
        setReplyingPhone(null)
        await fetchConfig()
      } else {
        toast.error(resData.error || 'Error al enviar el mensaje')
      }
    } catch {
      toast.error('Error de red al enviar el mensaje')
    } finally {
      setSendingReply(false)
    }
  }

  // Envío rápido de prueba al número oficial del dueño (Sandbox)
  const handleQuickTestToOwner = async () => {
    const target = data?.phoneNumber
    if (!target) {
      toast.info('Ingresa tu número de WhatsApp para recibir la prueba')
      setShowTestModal(true)
      return
    }
    setTestSending(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: target })
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success(`¡Plantilla de prueba enviada exitosamente a ${target}! 📲`)
        await fetchConfig()
      } else {
        toast.error(resData.error || 'Fallo al enviar mensaje de prueba')
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setTestSending(false)
    }
  }

  // Cambiar Proveedor
  const handleSelectProvider = async (newProvider: 'META' | 'BAILEYS') => {
    if (!data) return
    const isActivating = data.provider !== newProvider || !data.isEnabled
    const updated = {
      ...data,
      provider: newProvider,
      isEnabled: isActivating ? true : false,
      connectionStatus: newProvider === 'META'
        ? (data.hasMetaAccessToken && data.metaPhoneNumberId ? ('CONNECTED' as const) : ('DISCONNECTED' as const))
        : (data.connectionStatus === 'CONNECTED' ? ('CONNECTED' as const) : ('DISCONNECTED' as const))
    }
    setData(updated)
    await handleSave(updated)
  }

  // Generar QR de Baileys
  // Generar QR de Baileys
  const handleOpenQrModal = async (forceRefresh: boolean | unknown = false) => {
    const isForce = typeof forceRefresh === 'boolean' ? forceRefresh : false
    setShowQrModal(true)
    setQrLoading(true)
    setQrExpired(false)
    setQrCountdown(45)
    setQrStep(1)
    try {
      const url = isForce
        ? '/api/owner/integrations/whatsapp/qr?refresh=true'
        : '/api/owner/integrations/whatsapp/qr'
      const res = await fetch(url)
      if (res.ok) {
        const resData = await res.json()
        const qrImg = resData.qrCodeDataUrl || resData.qrString
        if (qrImg) {
          setCurrentQr(qrImg)
        }
        setData(prev => prev ? { ...prev, provider: 'BAILEYS', connectionStatus: resData.status || 'QR_READY' } : null)

        if (resData.status === 'CONNECTED') {
          setQrStep(2)
          toast.success('¡WhatsApp ya está vinculado y activo! 🎉')
          setTimeout(() => {
            setShowQrModal(false)
            fetchConfig()
          }, 1500)
        }
      } else {
        toast.error('Error al generar código QR')
      }
    } catch {
      toast.error('Error de conexión con el servicio')
    } finally {
      setQrLoading(false)
    }
  }

  // Sondeo del estado de escaneo mientras el modal QR está abierto
  // Usa poll=true para SOLO verificar si cambió el estado a CONNECTED sin resetear el contador ni rotar el QR
  useEffect(() => {
    if (!showQrModal || qrStep === 2) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/owner/integrations/whatsapp/qr?poll=true')
        if (res.ok) {
          const resData = await res.json()
          if (resData.status === 'CONNECTED') {
            setQrStep(2)
            toast.success('¡WhatsApp vinculado exitosamente! 🎉')
            setTimeout(() => {
              setShowQrModal(false)
              fetchConfig()
            }, 1800)
          }
        }
      } catch {
        // Silenciar errores temporales de red en el polling
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [showQrModal, qrStep])

  // Countdown QR (45s) limpio y continuo segundo a segundo
  useEffect(() => {
    if (!showQrModal || qrStep !== 1 || qrExpired) return

    const timer = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setQrExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showQrModal, qrStep, qrExpired])

  // Auto-regenerar código QR cuando expire sin recargar la página
  useEffect(() => {
    if (showQrModal && qrExpired && qrStep === 1) {
      const autoRefreshTimer = setTimeout(() => {
        handleOpenQrModal(true)
      }, 1000)
      return () => clearTimeout(autoRefreshTimer)
    }
  }, [showQrModal, qrExpired, qrStep])

  // Meta Embedded Signup Oficial (Facebook Login SDK con Config ID)
  const handleEmbeddedSignup = () => {
    // Meta exige HTTPS para Facebook Login (FB.login)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      toast.error(
        'Meta exige HTTPS para iniciar el Embedded Signup. En desarrollo local, corre "npm run dev:https" para abrir https://localhost:3000 o ingresa los datos en Configuración Manual.',
        { duration: 8000 }
      )
      return
    }

    setEmbeddedSignupLoading(true)

    // Variables de configuración de Meta
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || '1798187644961786'
    const metaConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID || '2369676903865189'

    // Variables capturadas del popup mediante Message Event
    let capturedPhoneNumberId: string | null = null
    let capturedWabaId: string | null = null
    let hasCompleted = false

    // Listener para eventos de sesión de WhatsApp Embedded Signup
    const messageListener = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return
      }

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (payload && (payload.type === 'WA_EMBEDDED_SIGNUP' || payload.event === 'FINISH')) {
          if (payload.data?.phone_number_id) {
            capturedPhoneNumberId = String(payload.data.phone_number_id)
          }
          if (payload.data?.waba_id) {
            capturedWabaId = String(payload.data.waba_id)
          }
        }
      } catch {
        // Ignorar mensajes no compatibles
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', messageListener)
    }

    // Temporizador de seguridad (Watchdog timeout): evita que la interfaz quede cargando indefinidamente
    const watchdogTimer = setTimeout(() => {
      if (!hasCompleted) {
        hasCompleted = true
        setEmbeddedSignupLoading(false)
        if (typeof window !== 'undefined') {
          window.removeEventListener('message', messageListener)
        }
        toast.error(
          'La ventana de conexión de Meta tardó demasiado o fue cerrada. Si tu navegador bloqueó las ventanas emergentes (pop-ups), permítelas e intenta de nuevo. También puedes conectar ingresando tus credenciales en la pestaña "Credenciales Manuales".',
          { duration: 9000 }
        )
      }
    }, 30000)

    const cleanup = () => {
      hasCompleted = true
      clearTimeout(watchdogTimer)
      setEmbeddedSignupLoading(false)
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', messageListener)
      }
    }

    const launchSignup = () => {
      if (typeof window !== 'undefined' && (window as any).FB) {
        try {
          ;(window as any).FB.login(
            function (response: any) {
              if (hasCompleted) return
              clearTimeout(watchdogTimer)

              if (response.authResponse?.code) {
                const toastId = toast.loading('Sincronizando WhatsApp Business con Meta...')
                fetch('/api/whatsapp/meta-callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: response.authResponse.code,
                    phoneNumberId: capturedPhoneNumberId,
                    wabaId: capturedWabaId
                  })
                })
                  .then(function (res: Response) { return res.json().then(function (d: any) { return { ok: res.ok, data: d } }) })
                  .then(function (result: { ok: boolean; data: any }) {
                    if (result.ok && result.data.success) {
                      toast.success(result.data.message || '¡WhatsApp Business conectado exitosamente con Meta! 🚀', { id: toastId })
                      setData(function (prev: any) { return prev ? {
                        ...prev,
                        provider: 'META',
                        connectionStatus: 'CONNECTED',
                        isEnabled: true,
                        phoneNumber: result.data.phoneNumber || prev.phoneNumber,
                        metaPhoneNumberId: result.data.phoneNumberId || prev.metaPhoneNumberId,
                        metaWabaId: result.data.wabaId || prev.metaWabaId
                      } : null })
                      setShowMetaModal(false)
                      fetchConfig()
                    } else {
                      toast.error(result.data.error || 'Error al validar credenciales de Meta con la Graph API', { id: toastId, duration: 8000 })
                    }
                  })
                  .catch(function () {
                    toast.error('Error de red al completar la vinculación con Meta', { id: toastId })
                  })
                  .finally(function () {
                    cleanup()
                  })
              } else {
                cleanup()
                toast.info('Proceso de vinculación de Meta cancelado o ventana cerrada.')
              }
            },
            {
              config_id: metaConfigId,
              response_type: 'code',
              override_default_response_type: true,
              extras: {
                setup: {},
                sessionInfoVersion: '3'
              }
            }
          )
        } catch (err: any) {
          cleanup()
          toast.error(err?.message || 'Error al invocar FB.login. Verifica que no tengas bloqueador de popups.', { duration: 7000 })
        }
      } else {
        cleanup()
        toast.error('El SDK de Meta no está disponible todavía en tu navegador. Puedes intentar de nuevo en unos segundos o usar la pestaña "Credenciales Manuales".', { duration: 7000 })
      }
    }

    // Si FB ya está listo, lanzar inmediatamente
    if (typeof window !== 'undefined' && (window as any).FB) {
      launchSignup()
    } else {
      const script = (document.getElementById('facebook-jssdk') as HTMLScriptElement) || document.createElement('script')
      if (!script.id) {
        script.id = 'facebook-jssdk'
        script.src = 'https://connect.facebook.net/es_LA/sdk.js'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.onload = () => {
        try {
          ;(window as any).FB.init({
            appId: metaAppId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v21.0'
          })
          launchSignup()
        } catch {
          cleanup()
          toast.error('No se pudo inicializar el SDK de Meta. Revisa tu conexión o usa la configuración manual.')
        }
      }
      script.onerror = () => {
        cleanup()
        toast.error('No se pudo cargar el SDK de Meta. Comprueba tu conexión a internet.')
      }
    }
  }

  // Simular conexión exitosa del QR (para pruebas directas)
  const handleConfirmQrScan = async () => {
    try {
      setQrLoading(true)
      const res = await fetch('/api/owner/integrations/whatsapp/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONNECTED', phoneNumber: data?.phoneNumber || '+57 300 000 0000' })
      })
      if (res.ok) {
        toast.success('¡WhatsApp vinculado exitosamente! 🎉')
        setShowQrModal(false)
        await fetchConfig()
      }
    } catch {
      toast.error('Error al sincronizar QR')
    } finally {
      setQrLoading(false)
    }
  }

  // Desconectar sesión QR
  const handleDisconnectQr = async () => {
    try {
      const res = await fetch('/api/owner/integrations/whatsapp/qr', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Sesión desconectada')
        await fetchConfig()
      }
    } catch {
      toast.error('Error al desconectar')
    }
  }

  // Abrir modal de QR oficial de Meta WhatsApp
  const handleOpenMetaQrModal = async () => {
    setShowMetaQrModal(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp/meta/qr')
      if (res.ok) {
        const json = await res.json()
        setMetaQrData(json)
      } else {
        toast.error('Configura primero las credenciales de Meta')
      }
    } catch {
      toast.error('Error al obtener código QR de Meta')
    }
  }

  // Guardar datos de Meta sin forzar verificación inmediata
  const handleSaveMetaOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setMetaSavingOnly(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'META',
          metaAppId: metaForm.appId.trim(),
          metaAppSecret: metaForm.appSecret.trim(),
          metaPhoneNumberId: metaForm.phoneNumberId.trim(),
          metaWabaId: metaForm.wabaId.trim(),
          ...(metaForm.accessToken.trim() ? { metaAccessToken: metaForm.accessToken.trim() } : {}),
          metaWebhookSecret: metaForm.webhookSecret.trim() || 'barberos_secure_webhook_token_2026'
        })
      })

      if (res.ok) {
        toast.success('¡Datos de Meta WhatsApp guardados correctamente! 💾')
        await fetchConfig()
      } else {
        toast.error('Error al guardar credenciales en el servidor')
      }
    } catch {
      toast.error('Error de red al guardar datos de Meta')
    } finally {
      setMetaSavingOnly(false)
    }
  }

  // Comprobar estado del Webhook funcional en tiempo real
  const handleTestWebhook = async () => {
    setWebhookTesting(true)
    try {
      const res = await fetch('/api/webhooks/whatsapp')
      if (res.ok) {
        setWebhookOnline(true)
        toast.success('¡Webhook funcional y en línea! Respondiendo eventos 🌐')
      } else {
        setWebhookOnline(false)
        toast.error('El Webhook respondió con código de error')
      }
    } catch {
      setWebhookOnline(false)
      toast.error('No se pudo verificar el Webhook')
    } finally {
      setWebhookTesting(false)
    }
  }

  // Probar y Verificar credenciales de Meta en vivo contra Meta Graph API
  const handleSaveMetaCredentials = async (e?: React.FormEvent, isSim = false) => {
    if (e) e.preventDefault()
    if (!isSim && (!metaForm.phoneNumberId || (!metaForm.accessToken && !data?.hasMetaAccessToken))) {
      toast.error('Ingresa al menos el Meta Number ID y el Meta JWT Token')
      return
    }

    setMetaVerifying(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp/meta/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: metaForm.appId,
          appSecret: metaForm.appSecret,
          phoneNumberId: metaForm.phoneNumberId,
          wabaId: metaForm.wabaId,
          accessToken: metaForm.accessToken,
          webhookSecret: metaForm.webhookSecret || 'barberos_secure_webhook_token_2026',
          isSimulation: isSim
        })
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success(resData.message || '¡WhatsApp de Meta vinculado y verificado con éxito! 🚀')
        setMetaQrData({
          qrCodeDataUrl: resData.qrCodeDataUrl,
          chatUrl: resData.chatUrl,
          phoneNumber: resData.phoneNumber,
          verifiedName: resData.verifiedName
        })
        await fetchConfig()
      } else {
        toast.error(resData.error || 'No se pudo validar la conexión con Meta Graph API. Revisa el Token y Number ID.')
      }
    } catch {
      toast.error('Error de conexión al autenticar con Meta')
    } finally {
      setMetaVerifying(false)
    }
  }

  // Enviar mensaje de prueba
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) {
      toast.error('Por favor ingresa un número de teléfono')
      return
    }

    setTestSending(true)
    try {
      const res = await fetch('/api/owner/integrations/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          text: `💈 *Prueba de BarberOS WhatsApp*\n\n¡Felicidades! La conexión de WhatsApp está activa y respondiendo correctamente.\n\n⏰ Fecha: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`
        })
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success('¡Mensaje de prueba enviado con éxito a WhatsApp! 📲')
        setShowTestModal(false)
        setTestPhone('')
        await fetchConfig()
      } else {
        toast.error(resData.error || 'Fallo al enviar mensaje de prueba')
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setTestSending(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 size={32} className="animate-spin text-amber-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Cargando módulo de WhatsApp...</p>
      </div>
    )
  }

  const isMetaActive = data.isEnabled && data.provider === 'META'
  const isBaileysActive = data.isEnabled && data.provider === 'BAILEYS'

  // Renderizador de vista previa de plantilla
  const previewConfirm = (data.confirmTemplate || '')
    .replace(/\{cliente\}/g, 'Carlos Mendoza')
    .replace(/\{barberia\}/g, 'Barbería Elite')
    .replace(/\{barbero\}/g, 'Mateo Gómez')
    .replace(/\{servicio\}/g, 'Corte Clásico & Barba')
    .replace(/\{precio\}/g, '$35.000')
    .replace(/\{fecha\}/g, 'Viernes, 24 de Octubre 2026')
    .replace(/\{hora\}/g, '04:30 PM')
    .replace(/\{codigo\}/g, 'RES-8942')
    .replace(/\{enlace_agenda\}/g, 'https://sas-barbery.vercel.app/b/elite')

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ───────────────────────── ENCABEZADO Y STATUS GLOBAL */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white tracking-tight">
                  WhatsApp y Reservas Automáticas
                </h2>
                {data.isEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado ({data.provider === 'META' ? 'Meta Cloud API' : 'WhatsApp QR'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                    Desconectado
                  </span>
                )}
                {data.humanConversations && data.humanConversations.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Headphones size={12} /> {data.humanConversations.length} esperando asesor
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Atiende a tus clientes por WhatsApp con un flujo guiado real, consulta citas, reprograma y confirma reservas con sincronización directa en tu agenda.
              </p>
            </div>
          </div>

          {/* Toggle Principal de Activación */}
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-2 px-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full transition-all ${
              data.isEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              {data.isEnabled ? 'Módulo Activo' : 'Módulo Inactivo'}
            </span>
            <button
              type="button"
              onClick={() => handleSave({ isEnabled: !data.isEnabled })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 shrink-0 ${
                data.isEnabled
                  ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300/80 border border-emerald-400'
                  : 'bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
                  data.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Input de número de atención */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Número de WhatsApp Oficial de la Barbería (+Código de país)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Phone size={15} />
              </div>
              <input
                type="text"
                placeholder="Ej. +57 300 123 4567"
                value={data.phoneNumber || ''}
                onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>
          <div className="sm:self-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              className="w-full sm:w-auto px-6 py-3 bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar Número
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────── TARJETAS DE CONEXIÓN (META vs BAILEYS QR) */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Método de Conexión de WhatsApp
            </h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
              Elige uno
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cada barbería opera con aislamiento total. Puedes cambiar el método en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ══════════════════════════════════════════════════════════════
              CARD 1: META CLOUD API (CONEXIÓN OFICIAL)
             ══════════════════════════════════════════════════════════════ */}
          <div
            className={`rounded-3xl flex flex-col justify-between transition-all duration-500 relative overflow-hidden backdrop-blur-xl ${
              isMetaActive
                ? 'shadow-[0_0_60px_-10px_rgba(0,129,251,0.4)] border-2 border-[#0081FB]/80 ring-1 ring-[#0081FB]/30'
                : 'border border-white/10 hover:border-[#0081FB]/30 shadow-lg'
            }`}
            style={{ background: 'linear-gradient(145deg, #070e1c 0%, #0b172a 45%, #060c18 100%)' }}
          >
            {/* Ambient Lighting Orbs */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 pointer-events-none blur-3xl" style={{ background: 'radial-gradient(circle, #0081FB 0%, transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15 pointer-events-none blur-2xl" style={{ background: 'radial-gradient(circle, #0052cc 0%, transparent 70%)' }} />

            <div>
              {/* Header: Badge + Status + Switch */}
              <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0081FB]/15 text-[#60a5fa] border border-[#0081FB]/30 shadow-sm">
                    ⭐ Oficial · Meta Direct
                  </span>
                  {isMetaActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {data.hasMetaAccessToken && data.metaPhoneNumberId ? (
                    <span className="text-[11px] font-bold text-emerald-400 hidden sm:inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Cuenta Vinculada
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline-flex items-center gap-1">
                      <AlertCircle size={12} /> Sin vincular
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('META')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 shrink-0 shadow-inner ${
                      isMetaActive ? 'bg-[#0081FB] shadow-[0_0_16px_rgba(0,129,251,0.7)] ring-2 ring-blue-300 border border-blue-400' : 'bg-zinc-800 border border-zinc-700/60'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white transition-transform duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${
                      isMetaActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Hero: 3D Meta Icon + Title + Description */}
              <div className="relative p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,129,251,0.2) 0%, rgba(0,70,180,0.08) 100%)',
                        border: '1px solid rgba(0,129,251,0.3)',
                        boxShadow: '0 12px 32px -8px rgba(0,129,251,0.35)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
                        <defs>
                          <linearGradient id="metaGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0064e0" />
                            <stop offset="100%" stopColor="#00a3ff" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#metaGlow)" d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-black text-white tracking-tight">Meta Cloud API</h4>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                        WhatsApp Business Oficial
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Conexión empresarial directa con la nube de Meta. Mayor confiabilidad, soporte para número verificado y envío transaccional a gran escala.
                    </p>
                  </div>
                </div>

                {/* 2x2 Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 text-blue-400">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Número Verificado</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Identidad comercial oficial respaldada por Meta.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0 text-sky-400">
                      <Rocket size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Alto Volumen</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Sin suspensiones ni bloqueos por envíos masivos.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                      <Lock size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">OAuth 2.0 Permanente</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Token cifrado de forma segura en base de datos.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                      <Sparkles size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Políticas Oficiales</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">100% alineado con las normativas comerciales de WhatsApp.</p>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleEmbeddedSignup}
                    disabled={embeddedSignupLoading}
                    className="w-full py-3.5 px-5 rounded-2xl text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-xl hover:shadow-[0_12px_40px_-8px_rgba(0,129,251,0.6)] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #0056cc 0%, #0081FB 50%, #1a94ff 100%)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {embeddedSignupLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-white" />
                        Iniciando Meta Embedded Signup...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0 group-hover:scale-110 transition-transform">
                          <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/>
                        </svg>
                        Conectar con WhatsApp Business (Meta)
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-zinc-400 mt-1">
                    Vinculación oficial automática en 1 clic (Embedded Signup)
                  </p>
                </div>
              </div>
            </div>

            {/* Symmetrical Utility Footer */}
            <div className="relative px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setMetaModalTab('manual')
                    setShowMetaModal(true)
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <SettingsIcon size={13} className="text-[#0081FB]" /> Manual (Token)
                </button>
                <button
                  type="button"
                  onClick={handleOpenMetaQrModal}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <QrCode size={13} className="text-emerald-400" /> QR Negocio
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getWhatsAppWebhookUrl())
                    toast.success('Webhook copiado al portapapeles 📋')
                  }}
                  title="Copiar URL del Webhook para Meta"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
                >
                  <Plug size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  title="Probar envío con simulador"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
                >
                  <Play size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARD 2: WHATSAPP WEB QR (BAILEYS) — ZERO QR DISPLAY BEFORE ACTIVATION
             ══════════════════════════════════════════════════════════════ */}
          <div
            className={`rounded-3xl flex flex-col justify-between transition-all duration-500 relative overflow-hidden backdrop-blur-xl ${
              isBaileysActive
                ? 'shadow-[0_0_60px_-10px_rgba(37,211,102,0.35)] border-2 border-[#25D366]/80 ring-1 ring-[#25D366]/30'
                : 'border border-white/10 hover:border-[#25D366]/30 shadow-lg'
            }`}
            style={{ background: 'linear-gradient(145deg, #05140b 0%, #081d11 45%, #040e08 100%)' }}
          >
            {/* Ambient Lighting Orbs */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 pointer-events-none blur-3xl" style={{ background: 'radial-gradient(circle, #25D366 0%, transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15 pointer-events-none blur-2xl" style={{ background: 'radial-gradient(circle, #128C7E 0%, transparent 70%)' }} />

            <div>
              {/* Header: Badge + Status + Switch */}
              <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                    ⚡ Conexión Directa · Escaneo QR
                  </span>
                  {isBaileysActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isBaileysActive && data.connectionStatus === 'CONNECTED' ? (
                    <span className="text-[11px] font-bold text-emerald-400 hidden sm:inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sesión Activa
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline-flex items-center gap-1">
                      <QrCode size={12} /> Sin escanear
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('BAILEYS')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 shrink-0 shadow-inner ${
                      isBaileysActive ? 'bg-[#25D366] shadow-[0_0_16px_rgba(37,211,102,0.7)] ring-2 ring-emerald-300 border border-emerald-400' : 'bg-zinc-800 border border-zinc-700/60'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white transition-transform duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${
                      isBaileysActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Hero: 3D WhatsApp Icon + Title + Description */}
              <div className="relative p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37,211,102,0.2) 0%, rgba(18,140,126,0.08) 100%)',
                        border: '1px solid rgba(37,211,102,0.3)',
                        boxShadow: '0 12px 32px -8px rgba(37,211,102,0.3)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-10 h-10 sm:w-12 sm:h-12" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-black text-white tracking-tight">WhatsApp Web QR</h4>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Motor Baileys · Directo
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Vincula tu línea móvil actual escaneando un código QR desde la app de WhatsApp de tu teléfono. Listo en segundos sin requerir aprobación ni cuenta Meta.
                    </p>
                  </div>
                </div>

                {/* 2x2 Feature Grid — Strictly Matching Card 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                      <Smartphone size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Tu Línea Actual</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Usa cualquier chip personal o de la barbería.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                      <Zap size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Vinculación en 10s</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Escaneas desde tu WhatsApp como en la web.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0 text-teal-400">
                      <Bot size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Bot y Reservas</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Agendamiento guiado y respuestas automáticas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 text-blue-400">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100">Aislamiento Seguro</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Sesión local cifrada y dedicada a tu negocio.</p>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button — NO STATIC QR ON CARD! */}
                <div className="pt-2">
                  {isBaileysActive && data.connectionStatus === 'CONNECTED' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQrStep(0)
                          setQrCountdown(45)
                          setQrExpired(false)
                          handleOpenQrModal()
                        }}
                        className="flex-1 py-3.5 px-5 rounded-2xl text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-400/30"
                      >
                        <CheckCircle2 size={18} className="text-white" />
                        Sesión Conectada ({data.phoneNumber || 'Activa'})
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectQr}
                        title="Desconectar sesión actual"
                        className="py-3.5 px-4 rounded-2xl bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-white transition-all cursor-pointer border border-red-800/40 text-xs font-black uppercase"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectProvider('BAILEYS')
                        setQrStep(0)
                        setQrCountdown(45)
                        setQrExpired(false)
                        handleOpenQrModal()
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-xl hover:shadow-[0_12px_40px_-8px_rgba(37,211,102,0.5)]"
                      style={{
                        background: 'linear-gradient(135deg, #128C7E 0%, #25D366 50%, #2ee875 100%)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <QrCode size={18} className="group-hover:scale-110 transition-transform" />
                      Vincular Dispositivo con QR
                    </button>
                  )}
                  <p className="text-center text-[10px] text-zinc-500 mt-2">
                    Abre el escáner interactivo seguro · Generación en tiempo real con renovación automática
                  </p>
                </div>
              </div>
            </div>

            {/* Symmetrical Utility Footer */}
            <div className="relative px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectProvider('BAILEYS')
                    setQrStep(0)
                    setQrCountdown(45)
                    setQrExpired(false)
                    handleOpenQrModal()
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <QrCode size={13} className="text-[#25D366]" /> Abrir Escáner QR
                </button>
                {data.connectionStatus === 'CONNECTED' && (
                  <button
                    type="button"
                    onClick={handleDisconnectQr}
                    className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 hover:text-white transition-all cursor-pointer border border-red-800/30 flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <X size={13} /> Desconectar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQrStep(0)
                    setQrCountdown(45)
                    setQrExpired(false)
                    handleOpenQrModal()
                  }}
                  title="Reiniciar o renovar QR"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  title="Probar envío con simulador"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
                >
                  <Play size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────── MÓDULO DE AUTOMATIZACIÓN Y RESPUESTAS ───────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
        
        {/* Barra Superior: Título + Interruptor General + Sección de Sandbox */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Bot size={18} />
              </span>
              <h3 className="text-base font-black text-zinc-950 dark:text-white tracking-tight">
                Automatización y Respuestas de WhatsApp
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Ultra Sencillo · Sin Códigos
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xl">
              Flujos preprogramados en el backend listos para operar. No necesitas redactar plantillas complejas ni configurar variables técnicas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 1. SECCIÓN DE SANDBOX: PROBAR CONEXIÓN */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                disabled={testSending}
                onClick={handleQuickTestToOwner}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {testSending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Probar Conexión
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestPhone(data.phoneNumber || '')
                  setShowTestModal(true)
                }}
                title="Configurar número personalizado de prueba"
                className="p-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <SettingsIcon size={14} />
              </button>
            </div>

            {/* 2. INTERRUPTOR GENERAL: BOT DE WHATSAPP EN EL NEGOCIO */}
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/80 p-2 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-inner">
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center justify-end gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${data.botEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                  {data.botEnabled ? 'Bot Activo' : 'Bot en Pausa'}
                </span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {data.botEnabled ? 'Atención activa' : 'Respuestas en pausa'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave({ botEnabled: !data.botEnabled })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 shrink-0 ${
                  data.botEnabled
                    ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300/80 border border-emerald-400'
                    : 'bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
                    data.botEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Vistas / Pestañas */}
        <div className="flex flex-wrap items-center gap-2 pt-6 pb-6">
          <button
            type="button"
            onClick={() => setActiveTab('flows')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'flows'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'flows' ? 'text-amber-500' : ''} />
            Flujos Predeterminados (3)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('human_agents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'human_agents'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Headphones size={14} />
            Gestión de Chats & Asesor Humano
            {data.humanConversations && data.humanConversations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black text-[10px] animate-pulse">
                {data.humanConversations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock size={14} />
            Historial de Auditoría (Logs)
            {data.recentLogs && data.recentLogs.length > 0 && (
              <span className="text-[10px] text-zinc-400 font-bold">
                ({data.recentLogs.length})
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            VISTA 1: LISTA DE FLUJOS PREDETERMINADOS (3 CARDS PREMIUM)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'flows' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ───────────────────────── FLUJO 1: MENÚ DE BIENVENIDA */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                        <Bot size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                          Flujo 1
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          Menú de Bienvenida
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
                        data.botEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {data.botEnabled ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSave({ botEnabled: !data.botEnabled })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer shrink-0 p-0.5 ${
                          data.botEnabled
                            ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300/80 border border-emerald-400'
                            : 'bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
                            data.botEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Responde de inmediato al primer saludo del cliente con las opciones de servicios, precios y enlaces directos de reserva.
                  </p>

                  {/* Vista Previa WhatsApp Bubble */}
                  <div className="rounded-2xl bg-[#0b141a] p-3.5 border border-zinc-800/80 shadow-md">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-zinc-200">Vista Previa al Cliente</span>
                    </div>

                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-[11px] leading-relaxed shadow font-sans">
                      <p className="font-bold">¡Hola! Bienvenido a {data.businessName || 'tu Barbería'} 💈</p>
                      <p className="mt-1.5 opacity-90">¿En qué te podemos ayudar hoy?</p>
                      <p className="mt-1 font-medium">1️⃣ 📅 Reservar cita</p>
                      <p>2️⃣ 📋 Mis citas (Consultar / Reprogramar)</p>
                      <p>3️⃣ 👤 Hablar con un asesor</p>
                      <p className="mt-1.5 opacity-80 text-[10px]">📲 Agenda en segundos: sas-barbery.vercel.app/b/{data.businessSlug || 'tu-barberia'}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/80">
                        <span>10:42 AM</span>
                        <CheckCheck size={12} className="text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">Variables dinámicas:</span>
                  <span className="font-bold text-emerald-500">Preprogramadas</span>
                </div>
              </div>

              {/* ───────────────────────── FLUJO 2: CONFIRMACIÓN DE RESERVA */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                          Flujo 2
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          Confirmación de Reserva
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
                        data.notifyBusinessOnBooking
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {data.notifyBusinessOnBooking ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSave({ notifyBusinessOnBooking: !data.notifyBusinessOnBooking })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer shrink-0 p-0.5 ${
                          data.notifyBusinessOnBooking
                            ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300/80 border border-emerald-400'
                            : 'bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
                            data.notifyBusinessOnBooking ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Se dispara automáticamente al crear una cita en la web y la guarda en la base de datos de BarberOS validando anti-colisión.
                  </p>

                  {/* Vista Previa WhatsApp Bubble */}
                  <div className="rounded-2xl bg-[#0b141a] p-3.5 border border-zinc-800/80 shadow-md">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-bold text-zinc-200">Disparo Inmediato al Agendar</span>
                    </div>

                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-[11px] leading-relaxed shadow font-sans">
                      <p className="font-bold">👋 ¡Hola Carlos Mendoza!</p>
                      <p className="opacity-95">Tu reserva en <strong>{data.businessName || 'tu Barbería'}</strong> ha sido confirmada con éxito 💈✂️</p>
                      <p className="mt-1.5">📅 <strong>Fecha:</strong> Sábado, 15 de Noviembre</p>
                      <p>⏰ <strong>Hora:</strong> 04:30 PM</p>
                      <p>💈 <strong>Barbero:</strong> Mateo Silva</p>
                      <p>💇‍♂️ <strong>Servicio:</strong> Corte Clásico + Barba ($35.000)</p>
                      <p>🔖 <strong>Código:</strong> WAPP-20261115-A1F</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/80">
                        <span>10:43 AM</span>
                        <CheckCheck size={12} className="text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">Validación con Agenda:</span>
                  <span className="font-bold text-blue-500">Anti-colisión Activa</span>
                </div>
              </div>

              {/* ───────────────────────── FLUJO 3: RECORDATORIO DE CITA */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                        <Clock size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                          Flujo 3
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          Recordatorio de Cita
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
                        (data.reminderHoursBefore || 0) > 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {(data.reminderHoursBefore || 0) > 0 ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newHours = (data.reminderHoursBefore || 0) > 0 ? 0 : 2
                          handleSave({ reminderHoursBefore: newHours })
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer shrink-0 p-0.5 ${
                          (data.reminderHoursBefore || 0) > 0
                            ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)] ring-2 ring-emerald-300/80 border border-emerald-400'
                            : 'bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white keep-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
                            (data.reminderHoursBefore || 0) > 0 ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                    Envía una alerta automática de tiempo antes de la cita para asegurar la asistencia del cliente y reducir inasistencias.
                  </p>

                  {/* Selector simple de horas sin códigos */}
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Enviar recordatorio con anticipación:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[2, 4, 24].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => handleSave({ reminderHoursBefore: hrs })}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center ${
                            data.reminderHoursBefore === hrs
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {hrs === 24 ? '1 Día antes' : `${hrs}h antes`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vista Previa WhatsApp Bubble */}
                  <div className="rounded-2xl bg-[#0b141a] p-3.5 border border-zinc-800/80 shadow-md">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-bold text-zinc-200">Alerta Programada</span>
                    </div>

                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-[11px] leading-relaxed shadow font-sans">
                      <p className="font-bold">🔔 Recordatorio de tu Cita 💈</p>
                      <p className="opacity-95 mt-1">
                        Hola Carlos, te recordamos que tienes una cita en <strong>{data.businessName || 'tu Barbería'}</strong> en aproximadamente {data.reminderHoursBefore || 2} horas.
                      </p>
                      <p className="mt-1">⏰ <strong>Hora:</strong> 04:30 PM</p>
                      <p>💈 <strong>Barbero:</strong> Mateo Silva</p>
                      <p>✂️ <strong>Servicio:</strong> Corte Clásico + Barba</p>
                      <p className="mt-1 text-[10px] opacity-80">¡Te esperamos puntual!</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/80">
                        <span>02:30 PM</span>
                        <CheckCheck size={12} className="text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">Despacho por Cron:</span>
                  <span className="font-bold text-amber-500">Automático</span>
                </div>
              </div>

            </div>

            {/* Banner de Garantía "Zero Code" */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-zinc-100 to-amber-500/10 dark:from-emerald-950/20 dark:via-zinc-900/50 dark:to-amber-950/20 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong>Plantillas 100% Preprogramadas:</strong> Las variables seguras (<code className="text-amber-500 font-mono text-[11px]">&#123;businessName&#125;</code>, <code className="text-amber-500 font-mono text-[11px]">&#123;clientName&#125;</code>, <code className="text-amber-500 font-mono text-[11px]">&#123;serviceName&#125;</code>, <code className="text-amber-500 font-mono text-[11px]">&#123;date&#125;</code>, <code className="text-amber-500 font-mono text-[11px]">&#123;time&#125;</code>, <code className="text-amber-500 font-mono text-[11px]">&#123;barberName&#125;</code>) se rellenan de forma automática desde la base de datos de BarberOS.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VISTA 2: ATENCIÓN HUMANA / DERIVACIÓN Y REPROGRAMACIÓN
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'human_agents' && (() => {
          const allChats = (data.conversations && data.conversations.length > 0)
            ? data.conversations
            : (data.humanConversations || [])

          const humanChatsCount = allChats.filter(c => !c.isBotActive || c.isHumanAgent).length
          const botChatsCount = allChats.filter(c => c.isBotActive && !c.isHumanAgent).length

          const displayedChats = allChats.filter(c => {
            const isHuman = !c.isBotActive || c.isHumanAgent
            if (chatFilter === 'human') return isHuman
            if (chatFilter === 'bot') return !isHuman
            return true
          })

          return (
            <div className="space-y-6">
              {/* Banner Explicativo de Anti-Choque */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-zinc-900/40 to-blue-500/10 border border-amber-500/20 rounded-2xl text-xs leading-relaxed flex items-start gap-3">
                <Headphones size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    Control de Choque: Bot vs Atención Humana
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
                      Protección Activa
                    </span>
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[11px] mt-1">
                    Cuando tú o tu equipo atienden a un cliente enviando un mensaje manual o haciendo clic en <strong>&quot;Tomar Chat&quot;</strong>, el bot entra en <strong>silencio total</strong> para ese número (<code className="text-amber-400 font-mono text-[10px]">isBotActive = false</code>). Así nunca interrumpirá tu conversación. Puedes reactivar el bot en cualquier momento cuando termines.
                  </p>
                </div>
              </div>

              {/* Barra de Filtros y Actualización */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setChatFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      chatFilter === 'all'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todos ({allChats.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatFilter('human')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      chatFilter === 'human'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-400'
                    }`}
                  >
                    <UserCheck size={13} />
                    Asignados a Humano ({humanChatsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatFilter('bot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      chatFilter === 'bot'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-400'
                    }`}
                  >
                    <Bot size={13} />
                    Atendidos por Bot ({botChatsCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={fetchConfig}
                  className="p-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto"
                >
                  <RotateCcw size={13} />
                  Actualizar Lista
                </button>
              </div>

              {/* Lista de Conversaciones */}
              {displayedChats.length === 0 ? (
                <div className="p-10 text-center bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/60 dark:border-zinc-800">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    No hay conversaciones con este filtro.
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-md mx-auto">
                    Los clientes que envíen mensajes a tu WhatsApp se registrarán aquí con su estado y podrás alternar el control del bot.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
                  {displayedChats.map((chat) => {
                    const isHumanMode = !chat.isBotActive || chat.isHumanAgent
                    const isReplying = replyingPhone === chat.customerPhone

                    return (
                      <div key={chat.id} className="p-4 sm:p-5 transition-colors hover:bg-zinc-500/5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Datos del Cliente y Estado */}
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isHumanMode
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-emerald-500/20 text-emerald-500'
                            }`}>
                              {isHumanMode ? <UserCheck size={18} /> : <Bot size={18} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-black text-zinc-900 dark:text-white">
                                  +{chat.customerPhone}
                                </p>
                                {isHumanMode ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Asignado a Humano (Bot en Silencio)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Atendido por Bot (Automático)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Última actividad: {new Date(chat.lastActivityAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} ({new Date(chat.lastActivityAt).toLocaleDateString('es-CO')})
                              </p>
                            </div>
                          </div>

                          {/* Botones de Control de la Conversación */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Alternar Control Bot / Humano */}
                            {isHumanMode ? (
                              <button
                                type="button"
                                onClick={() => handleResumeBot(chat.customerPhone)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <PlayCircle size={14} />
                                Activar Bot
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePauseBot(chat.customerPhone)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <PauseCircle size={14} />
                                Tomar Chat (Pausar Bot)
                              </button>
                            )}

                            {/* Botón Responder Manualmente */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isReplying) {
                                  setReplyingPhone(null)
                                  setReplyMessage('')
                                } else {
                                  setReplyingPhone(chat.customerPhone)
                                  setReplyMessage('')
                                }
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                isReplying
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              <Send size={13} />
                              {isReplying ? 'Cerrar' : 'Mensaje Manual'}
                            </button>

                            {/* Abrir en WhatsApp Web */}
                            <a
                              href={`https://wa.me/${chat.customerPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <ExternalLink size={13} />
                              WhatsApp Web
                            </a>
                          </div>
                        </div>

                        {/* Compositor de Mensaje Manual Inline */}
                        {isReplying && (
                          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-950/60 p-4 rounded-2xl border border-blue-500/30 animate-fadeIn">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Send size={13} className="text-blue-500" />
                                Enviar mensaje directo a +{chat.customerPhone}
                              </span>
                              <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Pausará el bot automáticamente para este cliente
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Escribe tu mensaje aquí... (Ej. Hola, te confirmo que tu cita ha sido reprogramada con éxito. ¡Te esperamos!)"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-blue-500 resize-none font-sans"
                            />
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingPhone(null)
                                  setReplyMessage('')
                                }}
                                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={sendingReply || !replyMessage.trim()}
                                onClick={() => handleSendManualReply(chat.customerPhone)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20"
                              >
                                {sendingReply ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Send size={13} />
                                    Enviar y Pausar Bot
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* ══════════════════════════════════════════════════════════════
            VISTA 3: HISTORIAL DE AUDITORÍA (LOGS DE MENSAJERÍA)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Registro de Mensajes Automáticos del Sistema
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Monitoreo de confirmaciones, recordatorios y respuestas enviadas.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchConfig}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <RotateCcw size={13} />
                Refrescar Logs
              </button>
            </div>

            {(!data.recentLogs || data.recentLogs.length === 0) ? (
              <div className="p-10 text-center bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 text-zinc-400 text-xs font-bold">
                Aún no hay mensajes automáticos registrados en este negocio.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Flujo / Dirección</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Destinatario</th>
                      <th className="p-3">Mensaje</th>
                      <th className="p-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.direction === 'OUTBOUND' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                          }`}>
                            {log.direction === 'OUTBOUND' ? 'Saliente' : 'Entrante'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.status === 'SENT' || log.status === 'DELIVERED'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : log.status === 'FAILED'
                              ? 'bg-red-500/15 text-red-500'
                              : 'bg-zinc-500/15 text-zinc-400'
                          }`}>
                            {log.status === 'SENT' || log.status === 'DELIVERED' ? 'Enviado' : log.status === 'FAILED' ? 'Error' : log.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                          {log.direction === 'OUTBOUND' ? log.to : log.from}
                        </td>
                        <td className="p-3 max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                          {log.messageBody}
                          {log.errorDetails && (
                            <span className="block text-red-400 text-[10px] mt-0.5 font-bold">
                              Error: {log.errorDetails}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-zinc-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ───────────────────────── MODAL META WHATSAPP ───────────────────────── */}
      {showMetaModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowMetaModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] text-white w-full max-w-xl max-h-[90vh] rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-scaleIn relative"
          >
            {/* Header Fijo con botón X siempre visible y accesible */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#0f172a] shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Meta WhatsApp Business
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Vinculación oficial Cloud API o credenciales manuales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMetaModal(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-zinc-700 shrink-0"
                title="Cerrar modal (o haz clic fuera)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pestañas de Navegación Segmentada */}
            <div className="px-6 pt-2 bg-[#0c1322] border-b border-zinc-800/80 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMetaModalTab('embedded')}
                className={`pb-2.5 pt-1.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  metaModalTab === 'embedded'
                    ? 'border-[#0081FB] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap size={13} className={metaModalTab === 'embedded' ? 'text-[#0081FB]' : ''} />
                Conexión 1 Clic (Oficial)
              </button>
              <button
                type="button"
                onClick={() => setMetaModalTab('manual')}
                className={`pb-2.5 pt-1.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  metaModalTab === 'manual'
                    ? 'border-[#0081FB] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SettingsIcon size={13} className={metaModalTab === 'manual' ? 'text-[#0081FB]' : ''} />
                Credenciales Manuales (Tokens)
              </button>
            </div>

            {/* Contenido con Scroll Interno Seguro (no desborda la pantalla) */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
              {metaModalTab === 'embedded' ? (
                <div className="space-y-4">
                  {/* Aviso de entorno local HTTP */}
                  {typeof window !== 'undefined' && window.location.protocol === 'http:' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold text-amber-300">Entorno Local HTTP detectado: </span>
                        Meta exige que Facebook Login funcione bajo <strong className="text-white">HTTPS</strong>. En desarrollo local corre <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">npm run dev:https</code> y abre <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">https://localhost:3000</code>, o usa la pestaña <button type="button" onClick={() => setMetaModalTab('manual')} className="underline font-bold text-white cursor-pointer">Credenciales Manuales</button>.
                      </div>
                    </div>
                  )}

                  {/* Embedded Signup Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <Zap size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Embedded Signup Oficial</h4>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Inicia sesión con Meta para conectar automáticamente tu WhatsApp Business Account y número de teléfono.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleEmbeddedSignup}
                      disabled={embeddedSignupLoading}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0081FB] hover:bg-[#0070db] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {embeddedSignupLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Conectando...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0"><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/></svg>
                          Conectar con Meta
                        </>
                      )}
                    </button>
                  </div>

                  {/* Asistente y Tutorial */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#152238] border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">¿Necesitas ayuda con Meta?</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          Te guiamos paso a paso para crear tu aplicación y configurar WhatsApp Business.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowTutorialModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 border border-zinc-700/60 cursor-pointer"
                      >
                        <Play size={13} className="text-blue-400" /> Tutorial
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWizardStep(1)
                          setShowWizardModal(true)
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-xs font-bold text-blue-300 hover:text-white transition-all flex items-center gap-1.5 border border-blue-500/40 cursor-pointer"
                      >
                        <Wand2 size={13} className="text-blue-400" /> Asistente
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulario Manual */
                <form onSubmit={handleSaveMetaOnly} className="space-y-4">
                  {/* Webhook URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-zinc-300">Webhook URL</label>
                      <div className="flex items-center gap-2">
                        {webhookOnline === true && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En línea
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleTestWebhook}
                          disabled={webhookTesting}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                        >
                          {webhookTesting ? 'Verificando...' : 'Comprobar Webhook'}
                        </button>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={getWhatsAppWebhookUrl()}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 select-all outline-none focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getWhatsAppWebhookUrl())
                          toast.success('¡Webhook URL copiado al portapapeles! 📋')
                        }}
                        title="Copiar URL del Webhook"
                        className="absolute right-2.5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    {/* Token de Verificación (Verify Token) para Meta */}
                    <div className="mt-2 p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-zinc-400">Token de Verificación (Verify Token):</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          {metaForm.webhookSecret || data?.metaWebhookSecret || 'barberos_secure_webhook_token_2026'}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(metaForm.webhookSecret || data?.metaWebhookSecret || 'barberos_secure_webhook_token_2026')
                            toast.success('Token de verificación copiado 📋')
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* App ID & Secret en fila responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-zinc-300 mb-1">App ID</label>
                      <input
                        type="text"
                        placeholder="ID de la App de Meta"
                        value={metaForm.appId}
                        onChange={(e) => setMetaForm({ ...metaForm, appId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-zinc-300 mb-1">App Secret</label>
                      <input
                        type="password"
                        placeholder="Clave secreta de la App"
                        value={metaForm.appSecret}
                        onChange={(e) => setMetaForm({ ...metaForm, appSecret: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Meta Number ID */}
                  <div>
                    <label className="block text-xs font-black text-zinc-300 mb-1">Meta Number ID (Phone Number ID)</label>
                    <input
                      type="text"
                      placeholder="Identificador del número de teléfono"
                      value={metaForm.phoneNumberId}
                      onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Meta JWT Token */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black text-zinc-300">Token de Acceso Permanente (System Token)</label>
                      {data?.hasMetaAccessToken && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Token activo: {data.metaAccessTokenMasked}
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder={data?.hasMetaAccessToken ? '(Mantener token actual o ingresar nuevo)' : 'Ingrese su Token de Acceso de Meta'}
                      value={metaForm.accessToken}
                      onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Botones de Acción */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={metaSavingOnly}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-900/30"
                    >
                      {metaSavingOnly ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      Guardar Credenciales
                    </button>

                    <button
                      type="button"
                      disabled={metaVerifying}
                      onClick={() => handleSaveMetaCredentials(undefined, false)}
                      className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                    >
                      {metaVerifying ? <Loader2 size={15} className="animate-spin" /> : <Wifi size={15} />}
                      Probar Conexión
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL DE TUTORIAL PASO A PASO ───────────────────────── */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] text-white w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleIn relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <Play size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Tutorial: Cómo obtener tus credenciales de Meta</h3>
                  <p className="text-xs text-zinc-400">Guía paso a paso en developers.facebook.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  Paso 1 · Crear la App en Meta
                </span>
                <p className="font-bold text-white text-sm">Crear aplicación en Meta for Developers</p>
                <p className="text-zinc-400 leading-relaxed">
                  Ingresa a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">developers.facebook.com/apps</a>, haz clic en <strong>Crear app</strong>, selecciona el caso de uso <strong>Empresa / Otro</strong> y añade el producto <strong>WhatsApp</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  Paso 2 · App ID y App Secret
                </span>
                <p className="font-bold text-white text-sm">Obtener identificador y clave secreta</p>
                <p className="text-zinc-400 leading-relaxed">
                  En el menú lateral de tu app, ve a <strong>Configuración de la app &gt; Básica</strong>. Allí encontrarás el <strong>Identificador de la app (App ID)</strong> y la <strong>Clave secreta de la app (App Secret)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  Paso 3 · Meta Number ID (Phone Number ID)
                </span>
                <p className="font-bold text-white text-sm">Identificador del número de WhatsApp</p>
                <p className="text-zinc-400 leading-relaxed">
                  En el menú lateral, dirígete a <strong>WhatsApp &gt; Configuración de la API</strong>. En la sección <em>Paso 1: Seleccionar números de teléfono</em>, copia el valor que aparece en <strong>Identificador de número de teléfono</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  Paso 4 · Meta JWT Token Permanente
                </span>
                <p className="font-bold text-white text-sm">Token de acceso de Usuario del Sistema</p>
                <p className="text-zinc-400 leading-relaxed">
                  Para que tu token no caduque a las 24 horas, ve a <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Meta Business Suite &gt; Usuarios del Sistema</a>, agrega un usuario de rol Administrador y genera un token con los permisos <strong>whatsapp_business_messaging</strong> y <strong>whatsapp_business_management</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Paso 5 · Configurar Webhook en Meta
                </span>
                <p className="font-bold text-white text-sm">Configurar la URL de Callback de BarberOS</p>
                <p className="text-zinc-300 leading-relaxed">
                  En <strong>WhatsApp &gt; Configuración</strong>, haz clic en <strong>Editar</strong> en la tarjeta de Webhook. Pega la <strong>Webhook URL</strong> de tu barbería y el <strong>Token de verificación</strong>, luego haz clic en <strong>Verificar y guardar</strong>. Finalmente, suscríbete al campo <strong>messages</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Entendido, ir a configurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL DE ASISTENTE PASO A PASO INTERACTIVO ───────────────────────── */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] text-white w-full max-w-xl rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleIn relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Asistente Guiado de Meta WhatsApp</h3>
                  <p className="text-xs text-zinc-400">Paso {wizardStep} de 4</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWizardModal(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper bar */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s <= wizardStep ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Wizard Step 1: App ID & Secret */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">1. Identificadores de tu App en Meta Developers</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  En <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">developers.facebook.com</a>, abre tu aplicación y ve a <strong>Configuración de la app &gt; Básica</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">App ID</label>
                  <input
                    type="text"
                    placeholder="Ej. 123456789012345"
                    value={metaForm.appId}
                    onChange={(e) => setMetaForm({ ...metaForm, appId: e.target.value })}
                    className="w-full px-3.5 py-3 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">App Secret</label>
                  <input
                    type="password"
                    placeholder="Clave secreta de tu aplicación"
                    value={metaForm.appSecret}
                    onChange={(e) => setMetaForm({ ...metaForm, appSecret: e.target.value })}
                    className="w-full px-3.5 py-3 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Wizard Step 2: Webhook setup */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">2. Configura el Webhook en Meta</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  En el panel de Meta, ve a <strong>WhatsApp &gt; Configuración &gt; Webhook</strong> y copia estos dos datos:
                </p>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400">Webhook URL:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-200 select-all truncate">
                      {typeof window !== 'undefined' ? getWhatsAppWebhookUrl() : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getWhatsAppWebhookUrl())
                        toast.success('Webhook copiado 📋')
                      }}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-white cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400">Token de Verificación (Verify Token):</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-emerald-400 select-all truncate">
                      {metaForm.webhookSecret || data?.metaWebhookSecret || 'barberos_secure_webhook_token_2026'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(metaForm.webhookSecret || data?.metaWebhookSecret || 'barberos_secure_webhook_token_2026')
                        toast.success('Token copiado 📋')
                      }}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-white cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Step 3: Meta Number ID & JWT Token */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">3. Número y Token de Meta</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Copia el <strong>Phone Number ID</strong> desde WhatsApp &gt; Configuración de la API, y tu <strong>Token Permanente</strong> de Usuario del Sistema.
                </p>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Meta Number ID</label>
                  <input
                    type="text"
                    placeholder="Ej. 104829103948192"
                    value={metaForm.phoneNumberId}
                    onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                    className="w-full px-3.5 py-3 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Meta JWT Token (Token permanente)</label>
                  <textarea
                    rows={2}
                    placeholder="EAA..."
                    value={metaForm.accessToken}
                    onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0a101d] border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Wizard Step 4: Resumen y Prueba */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">4. Confirmación y Prueba en Vivo</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Todo está listo para guardar y verificar la conexión con Meta WhatsApp API.
                </p>

                <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">App ID:</span>
                    <span className="font-mono text-zinc-200">{metaForm.appId || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Meta Number ID:</span>
                    <span className="font-mono text-zinc-200">{metaForm.phoneNumberId || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Token JWT:</span>
                    <span className="font-mono text-emerald-400">{metaForm.accessToken ? '••••••••' : (data?.hasMetaAccessToken ? 'Activo' : 'Pendiente')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper controls */}
            <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s - 1) as any)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Anterior
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => (s + 1) as any)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={metaVerifying}
                    onClick={async () => {
                      await handleSaveMetaOnly()
                      await handleSaveMetaCredentials(undefined, false)
                      setShowWizardModal(false)
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    {metaVerifying ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                    Guardar y Conectar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL DE CÓDIGO QR OFICIAL DE META ───────────────────────── */}
      {showMetaQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white w-full max-w-md rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl animate-scaleIn text-center">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">QR Oficial de WhatsApp (Meta)</h3>
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cuenta Business Verificada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMetaQrModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div className="w-64 h-64 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg relative border-4 border-emerald-500/40 overflow-hidden">
                {metaQrData?.qrCodeDataUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl select-none p-1">
                    <img
                      src={metaQrData.qrCodeDataUrl}
                      alt="Código QR de WhatsApp Meta"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-800">
                    <Loader2 size={32} className="animate-spin text-emerald-600" />
                    <span className="text-xs font-bold">Cargando código QR oficial...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-xs font-mono font-bold text-zinc-200">
                  <Phone size={12} className="text-emerald-400" />
                  {metaQrData?.phoneNumber || data?.phoneNumber || '+57 Oficial'}
                </span>
              </div>

              <div className="mt-4 text-left text-xs text-zinc-300 space-y-1.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800 w-full">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Info size={13} className="text-emerald-400" /> ¿Cómo funciona este QR?
                </p>
                <p>• Los clientes apuntan la cámara de su teléfono y abren el chat directo en WhatsApp.</p>
                <p>• El bot de reservas responderá automáticamente con el menú interactivo.</p>
                <p>• Puedes descargar este QR para imprimirlo en tu barbería o compartirlo en redes.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {metaQrData?.chatUrl && (
                <a
                  href={metaQrData.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink size={14} /> Abrir Chat
                </a>
              )}

              {metaQrData?.qrCodeDataUrl && (
                <a
                  href={metaQrData.qrCodeDataUrl}
                  download="whatsapp-meta-qr.png"
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  Descargar QR
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL DE ESCANEO QR (BAILEYS) — PREMIUM ───────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0a1a10] via-[#0b1810] to-[#0d1a14] text-white w-full max-w-2xl rounded-3xl border border-[#25D366]/20 shadow-2xl shadow-emerald-900/30 overflow-hidden">
            {/* Modal header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Vincular WhatsApp QR</h3>
                  <p className="text-[11px] text-[#25D366]">Conexión segura via Baileys</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowQrModal(false); setQrStep(0) }} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {/* LEFT: Step indicators */}
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-5">Estado de conexión</p>

                {[
                  {
                    n: 1,
                    label: 'Iniciando entorno',
                    sublabel: 'Preparando sesión segura en el servidor',
                    active: qrStep === 0,
                    done: qrStep > 0
                  },
                  {
                    n: 2,
                    label: 'Escanea el código QR',
                    sublabel: 'Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo',
                    active: qrStep === 1,
                    done: qrStep > 1
                  },
                  {
                    n: 3,
                    label: 'WhatsApp conectado',
                    sublabel: 'Sesión activa y sincronizada con BarberOS',
                    active: qrStep === 2,
                    done: qrStep === 2
                  },
                ].map(step => (
                  <div key={step.n} className={`flex items-start gap-3 p-3 rounded-2xl transition-all border ${
                    step.done
                      ? 'bg-emerald-950/50 border-[#25D366]/30'
                      : step.active
                      ? 'bg-white/5 border-[#25D366]/50 ring-1 ring-[#25D366]/20'
                      : 'bg-white/2 border-white/5 opacity-50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black transition-all ${
                      step.done
                        ? 'bg-[#25D366] text-white'
                        : step.active
                        ? 'bg-[#25D366]/20 text-[#25D366] ring-2 ring-[#25D366]/40'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {step.done ? <Check size={12} /> : step.active && step.n === 1 ? <Loader2 size={12} className="animate-spin" /> : step.n}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-black ${
                        step.done ? 'text-emerald-300' : step.active ? 'text-white' : 'text-zinc-500'
                      }`}>{step.label}</p>
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5">{step.sublabel}</p>
                      {/* Countdown bar for step 2 */}
                      {step.active && step.n === 2 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-zinc-400 font-bold">Expira en</span>
                            <span className={`text-[11px] font-black tabular-nums ${
                              qrCountdown <= 10 ? 'text-red-400' : 'text-[#25D366]'
                            }`}>{qrCountdown}s</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                qrCountdown <= 10 ? 'bg-red-500' : 'bg-[#25D366]'
                              }`}
                              style={{ width: `${(qrCountdown / 45) * 100}%`, transition: 'width 1s linear' }}
                            />
                          </div>
                          {qrExpired && (
                            <p className="text-[10px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                              <RefreshCw size={10} className="animate-spin" /> Renovando QR automáticamente...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenQrModal(true)
                    }}
                    disabled={qrLoading}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
                  >
                    <RefreshCw size={13} className={qrLoading ? 'animate-spin' : ''} />
                    {qrLoading ? 'Generando QR...' : 'Regenerar QR'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmQrScan}
                    disabled={qrLoading || qrStep === 2}
                    className="w-full py-2.5 bg-[#25D366]/90 hover:bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-40"
                  >
                    <Check size={13} /> Confirmar escaneado
                  </button>
                </div>
              </div>

              {/* RIGHT: QR Visualizer */}
              <div className="p-6 flex flex-col items-center justify-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 self-start mb-1">Código QR</p>

                {/* QR container */}
                <div className={`relative w-52 h-52 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${
                  qrStep === 2 ? 'border-4 border-[#25D366] bg-emerald-950/40' : 'bg-white border-4 border-[#25D366]/30'
                }`}>
                  {qrStep === 2 ? (
                    <div className="flex flex-col items-center gap-2 text-[#25D366]">
                      <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-[#25D366]" />
                      </div>
                      <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">¡Conectado!</p>
                    </div>
                  ) : qrLoading ? (
                    <div className="flex flex-col items-center gap-3 text-zinc-600">
                      <div className="relative">
                        <Loader2 size={36} className="animate-spin text-[#25D366]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#25D366"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" /></svg>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500">Generando QR...</span>
                    </div>
                  ) : currentQr ? (
                    <>
                      <img
                        src={currentQr.startsWith('data:') ? currentQr : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentQr)}`}
                        alt="Código QR de WhatsApp"
                        className={`w-44 h-44 object-contain rounded-xl select-none transition-all ${
                          qrExpired ? 'opacity-30 blur-sm' : 'opacity-100'
                        }`}
                      />
                      {/* WA icon overlay center */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#25D366"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" /></svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <AlertCircle size={28} className="text-amber-500" />
                      <span className="text-xs font-bold text-zinc-400">Error al cargar QR</span>
                      <button
                        type="button"
                        onClick={() => handleOpenQrModal()}
                        className="text-[10px] text-[#25D366] font-bold underline cursor-pointer"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  )}
                </div>

                {/* QR expiry warning */}
                {qrExpired && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-950/60 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-bold">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    QR expirado. Regenerando automáticamente...
                  </div>
                )}

                <p className="text-[10px] text-zinc-500 text-center leading-relaxed max-w-[180px]">
                  Apunta la cámara al código QR desde WhatsApp en tu teléfono
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MODAL DE TEST EN VIVO ───────────────────────── */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white w-full max-w-md rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Play size={16} />
                </div>
                <h3 className="text-sm font-black text-white">Disparar Mensaje de Prueba</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Tu número de WhatsApp (+Código de país)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+57 300 123 4567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
                Se enviará a través de: <strong className="text-white">{data.provider === 'META' ? 'Meta Cloud API' : 'WhatsApp QR'}</strong>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {testSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Enviar Ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
