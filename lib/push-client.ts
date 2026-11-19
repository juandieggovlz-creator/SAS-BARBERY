'use client'

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BKFWb2sz96DoQ2Adr-buKL3wUWvqiVI5VPTX440aL8ZC-LK21iFKH0bQ3F8nRaiBmAuq_9fMOiEjnJBONJTUj7g'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIPad = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || isIPad
}

export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as any
  return Boolean(nav.standalone || window.matchMedia('(display-mode: standalone)').matches)
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  } catch (error) {
    console.warn('[PushClient] Error registering Service Worker:', error)
    return null
  }
}

export async function getPushStatus(): Promise<{
  supported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isIOS: boolean
  isStandalone: boolean
  subscription: PushSubscription | null
}> {
  const supported = isPushSupported()
  const isIOS = isIOSDevice()
  const isStandalone = isPWAStandalone()

  if (!supported) {
    return {
      supported: false,
      permission: 'default',
      isSubscribed: false,
      isIOS,
      isStandalone,
      subscription: null,
    }
  }

  const permission = Notification.permission
  let isSubscribed = false
  let subscription: PushSubscription | null = null

  try {
    const reg = await registerServiceWorker()
    if (reg) {
      subscription = await reg.pushManager.getSubscription()
      isSubscribed = Boolean(subscription)
    }
  } catch (err) {
    console.warn('[PushClient] Error checking push subscription:', err)
  }

  return {
    supported,
    permission,
    isSubscribed,
    isIOS,
    isStandalone,
    subscription,
  }
}

export async function subscribeToPush(deviceName?: string): Promise<{
  success: boolean
  error?: string
  subscription?: PushSubscription
}> {
  if (!isPushSupported()) {
    return { success: false, error: 'Este navegador no soporta notificaciones Web Push.' }
  }

  try {
    // 1. Explicit permission request via user action
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado en el navegador.' }
    }

    // 2. Ensure Service Worker is registered
    const reg = await registerServiceWorker()
    if (!reg) {
      return { success: false, error: 'No se pudo iniciar el Service Worker.' }
    }

    // 3. Subscribe to push manager with VAPID key
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    let sub = await reg.pushManager.getSubscription()

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      })
    }

    const subJson = sub.toJSON()
    if (!subJson.endpoint || !subJson.keys) {
      return { success: false, error: 'Claves de cifrado push no disponibles.' }
    }

    // 4. Send subscription to BarberOS server
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        deviceName: deviceName || (isIOSDevice() ? 'Apple iPhone / iPad' : undefined),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.error || 'Error al guardar la suscripción en el servidor.' }
    }

    return { success: true, subscription: sub }
  } catch (err: any) {
    console.error('[PushClient] subscribeToPush error:', err)
    return { success: false, error: err.message || 'Error desconocido al activar notificaciones.' }
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isPushSupported()) return { success: true }

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()

    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {})
    }

    return { success: true }
  } catch (err: any) {
    console.error('[PushClient] unsubscribeFromPush error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Short, elegant 2-tone chime synthesized via Web Audio API.
 * Frequency E5 (659.25Hz) -> A5 (880Hz) or B5 (987.77Hz).
 * Fully self-contained, offline-compatible, zero-dependency.
 */
export function playChimeSound(force = false): void {
  try {
    if (!force) {
      const soundEnabled = localStorage.getItem('barberos_sound_enabled')
      if (soundEnabled === 'false') return
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Note 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime)
    gain1.gain.setValueAtTime(0.12, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.4)

    // Note 2: A5 (880.00Hz) after 120ms
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12)
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.12)
    osc2.stop(ctx.currentTime + 0.65)
  } catch {
    // Autoplay restrictions or AudioContext unsupported
  }
}
