/**
 * lib/platform-config.ts
 * Client-side utility to fetch and cache public platform configuration.
 * Used by landing page, footer, and legal pages to show correct contact info.
 */

export interface PublicPlatformSettings {
  platform_name: string
  support_email: string
  support_whatsapp: string
  platform_logo: string
  platform_logo_light: string
  platform_logo_dark: string
}

const DEFAULTS: PublicPlatformSettings = {
  platform_name: 'BarberOS',
  support_email: 'barberos.contacto@gmail.com',
  support_whatsapp: '+57 324 2063393',
  platform_logo: '/logo-dark.png',
  platform_logo_light: '/logo-light.png',
  platform_logo_dark: '/logo-dark.png'
}

let cachedSettings: PublicPlatformSettings | null = null
let cacheExpiry = 0

/**
 * Notifies all listeners that platform settings (e.g. logos or names) have been updated.
 */
export function notifyPlatformSettingsUpdated(newSettings?: Partial<PublicPlatformSettings>) {
  if (typeof window !== 'undefined') {
    if (newSettings && cachedSettings) {
      cachedSettings = { ...cachedSettings, ...newSettings }
    } else {
      cachedSettings = null
      cacheExpiry = 0
    }
    window.dispatchEvent(new CustomEvent('platform-settings-updated', { detail: newSettings }))
  }
}

/**
 * Formats a WhatsApp number for use in wa.me links.
 * Input: '+57 324 2063393' → Output: '573242063393'
 */
export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/[\s+\-()]/g, '')
}

/**
 * Returns wa.me URL for a given phone number string.
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const number = formatWhatsAppNumber(phone)
  const url = `https://wa.me/${number}`
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`
  }
  return url
}

/**
 * Fetches public platform settings with 5-minute in-memory cache.
 * Falls back to defaults on error.
 */
export async function getPublicSettings(): Promise<PublicPlatformSettings> {
  const now = Date.now()
  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings
  }

  try {
    const res = await fetch('/api/platform/settings', {
      next: { revalidate: 300 }
    })
    if (res.ok) {
      const data = await res.json()
      const merged = { ...DEFAULTS, ...data.settings }
      cachedSettings = merged
      cacheExpiry = now + 5 * 60 * 1000
      return merged
    }
  } catch {
    // fall through to defaults
  }

  return DEFAULTS
}

