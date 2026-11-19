import * as webpushModule from 'web-push'

// Safe resolution for both CommonJS and ESM bundlers
const webpush = (webpushModule as any).default || webpushModule

const DEFAULT_VAPID_PUBLIC_KEY = 'BKFWb2sz96DoQ2Adr-buKL3wUWvqiVI5VPTX440aL8ZC-LK21iFKH0bQ3F8nRaiBmAuq_9fMOiEjnJBONJTUj7g'
const DEFAULT_VAPID_PRIVATE_KEY = 'TLImxg5dopHAsmTAiScSBy0-Oz5kssE9jCdRkitfPSQ'
const DEFAULT_VAPID_SUBJECT = 'mailto:soporte@barberos.co'

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT

// Initialize VAPID details safely
try {
  if (typeof webpush.setVapidDetails === 'function') {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )
  }
} catch (error) {
  console.warn('[WebPush] Error setting VAPID details:', error)
}

export { webpush }
export default webpush
