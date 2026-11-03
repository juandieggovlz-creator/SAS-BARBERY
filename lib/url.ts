/**
 * Centralized Canonical URL and Domain Management for BarberOS
 *
 * Reglas de arquitectura:
 * 1. Dominio canónico oficial de producción: https://sas-barbery.vercel.app
 * 2. Entorno local de desarrollo: http://localhost:3000
 * 3. Enlaces permanentes (reservas, páginas públicas, invitaciones, webhooks y OAuth):
 *    SIEMPRE utilizan el dominio canónico o localhost en desarrollo, NUNCA dominios
 *    temporales de Preview con hashes o nombres de usuario.
 */

export const CANONICAL_APP_URL = 'https://sas-barbery.vercel.app'

/**
 * Obtiene la URL base canónica del sistema.
 */
export function getCanonicalAppUrl(): string {
  // 1. Entorno de navegador local (localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin
    }
  }

  // 2. Entorno Node.js de desarrollo local
  if (process.env.NODE_ENV === 'development') {
    const localUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '')
    return localUrl || 'http://localhost:3000'
  }

  // 3. Variable de entorno en producción (siempre que sea un dominio limpio, no preview temporal)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '')
  if (
    envUrl &&
    !envUrl.includes('-git-') &&
    !envUrl.includes('juandieggovlz') &&
    !envUrl.includes('localhost')
  ) {
    return envUrl
  }

  // 4. Dominio canónico oficial de producción
  return CANONICAL_APP_URL
}

/**
 * URL permanente de la página pública de una barbería (/b/[slug])
 */
export function getPublicPageUrl(slug: string): string {
  return `${getCanonicalAppUrl()}/b/${slug}`
}

/**
 * URL permanente del portal directo de reservas (/reserve/[slug])
 */
export function getBookingUrl(slug: string): string {
  return `${getCanonicalAppUrl()}/reserve/${slug}`
}

/**
 * URL permanente de invitación de acceso para un barbero (/invite/[token])
 */
export function getBarberInviteUrl(token: string): string {
  return `${getCanonicalAppUrl()}/invite/${token}`
}

/**
 * URL canónica del Webhook de WhatsApp de producción (/api/webhooks/whatsapp)
 */
export function getWhatsAppWebhookUrl(): string {
  return `${getCanonicalAppUrl()}/api/webhooks/whatsapp`
}

/**
 * URI canónica de redirección para Google OAuth (/api/auth/callback/google)
 */
export function getGoogleOAuthRedirectUri(): string {
  return `${getCanonicalAppUrl()}/api/auth/callback/google`
}

