/**
 * Transforma de forma inteligente cualquier entrada en un enlace URL directo y válido para redes sociales.
 *
 * WhatsApp:
 * - Acepta enlaces wa.link (ej: "wa.link/abcde" o "https://wa.link/abcde")
 * - Acepta enlaces directos wa.me o api.whatsapp.com
 * - Acepta números telefónicos (ej: "+57 300 123 4567", "3001234567", "573001234567") y los convierte a wa.me con mensaje inicial predeterminado.
 *
 * Instagram:
 * - Acepta URLs completas ("https://instagram.com/tubarberia")
 * - Acepta dominios ("instagram.com/tubarberia")
 * - Acepta usuarios con o sin @ ("@tubarberia", "tubarberia")
 *
 * Facebook:
 * - Acepta URLs completas ("https://facebook.com/tubarberia")
 * - Acepta dominios ("facebook.com/tubarberia", "fb.com/tubarberia")
 * - Acepta nombres de página/usuario
 *
 * TikTok:
 * - Acepta URLs completas ("https://tiktok.com/@tubarberia")
 * - Acepta usuarios ("@tubarberia", "tubarberia")
 */

export function buildSocialUrl(network: string, rawValue?: string | null): string {
  if (!rawValue || !rawValue.trim()) return ''
  const val = rawValue.trim()

  switch (network.toLowerCase()) {
    case 'whatsapp': {
      // 1. Enlace tipo wa.link
      if (/^(https?:\/\/)?(www\.)?wa\.link\/[a-zA-Z0-9_-]+/i.test(val)) {
        return val.startsWith('http') ? val : `https://${val}`
      }

      // 2. Enlace completo wa.me o api.whatsapp.com o web.whatsapp.com
      if (/^(https?:\/\/)?(www\.)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(val)) {
        return val.startsWith('http') ? val : `https://${val}`
      }

      // 3. Extracción de dígitos telefónicos
      let digits = val.replace(/\D/g, '')
      if (!digits) return ''

      // Si es un número móvil de Colombia de 10 dígitos (inicia en 3), añadir prefijo 57
      if (digits.length === 10 && digits.startsWith('3')) {
        digits = `57${digits}`
      }

      return `https://wa.me/${digits}?text=Hola!%20Deseo%20información%20sobre%20sus%20servicios`
    }

    case 'instagram': {
      if (/^https?:\/\//i.test(val)) return val
      if (/^(www\.)?instagram\.com\//i.test(val)) return `https://${val.replace(/^https?:\/\//i, '')}`
      const handle = val.replace(/^@+/, '')
      return `https://instagram.com/${handle}`
    }

    case 'facebook': {
      if (/^https?:\/\//i.test(val)) return val
      if (/^(www\.)?(facebook\.com|fb\.com)\//i.test(val)) return `https://${val.replace(/^https?:\/\//i, '')}`
      const handle = val.replace(/^@+/, '')
      return `https://facebook.com/${handle}`
    }

    case 'tiktok': {
      if (/^https?:\/\//i.test(val)) return val
      if (/^(www\.)?tiktok\.com\//i.test(val)) return `https://${val.replace(/^https?:\/\//i, '')}`
      const handle = val.replace(/^@+/, '')
      return `https://tiktok.com/@${handle}`
    }

    case 'youtube': {
      if (/^https?:\/\//i.test(val)) return val
      if (/^(www\.)?youtube\.com\//i.test(val)) return `https://${val.replace(/^https?:\/\//i, '')}`
      const handle = val.replace(/^@+/, '')
      return `https://youtube.com/@${handle}`
    }

    case 'twitter':
    case 'x': {
      if (/^https?:\/\//i.test(val)) return val
      if (/^(www\.)?(twitter\.com|x\.com)\//i.test(val)) return `https://${val.replace(/^https?:\/\//i, '')}`
      const handle = val.replace(/^@+/, '')
      return `https://x.com/${handle}`
    }

    default: {
      if (/^https?:\/\//i.test(val)) return val
      return `https://${val}`
    }
  }
}
