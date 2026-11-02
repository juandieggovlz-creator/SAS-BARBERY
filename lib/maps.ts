/**
 * Utilidades para resolución, validación y sanitización de ubicaciones en Google Maps.
 *
 * Soporta de forma inteligente:
 * 1. Direcciones físicas en texto plano (ej: "Calle 85 # 14-20, Bogotá", "Cra 43A # 1-50, Medellín").
 * 2. Coordenadas geográficas (ej: "4.67123, -74.05812").
 * 3. Enlaces compartidos de Google Maps (maps.app.goo.gl, goo.gl/maps).
 * 4. Enlaces completos de navegador (google.com/maps/place/..., google.com/maps?q=...).
 * 5. URLs de mapas incrustados (google.com/maps/embed?pb=...).
 * 6. Código HTML de iframe copiado desde Google Maps (<iframe src="https://www.google.com/maps/embed?..."></iframe>).
 *
 * Seguridad:
 * - Sanitiza y valida contra inyección de HTML o scripts (XSS).
 * - Restringe iframes y enlaces exclusivamente a dominios legítimos de Google Maps.
 * - No requiere API Key de pago de Google Maps Platform.
 */

export interface LocationInfo {
  displayText: string
  embedUrl: string
  directionsUrl: string
}

export function parseLocation(
  address: string | null | undefined,
  businessName?: string | null
): LocationInfo | null {
  if (!address) return null
  let trimmed = address.trim()
  if (!trimmed) return null

  // 1. Si el usuario pegó el código iframe copiado de Google Maps ("Insertar un mapa")
  if (/<iframe[\s\S]+<\/iframe>/i.test(trimmed) || /<iframe[\s\S]+>/i.test(trimmed)) {
    const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i)
    if (srcMatch && srcMatch[1]) {
      trimmed = srcMatch[1].trim()
    } else {
      return null
    }
  }

  // 2. Seguridad: Rechazar cualquier otro tag HTML o esquemas maliciosos
  if (/<[a-z][\s\S]*>/i.test(trimmed) || /^(javascript:|data:|vbscript:)/i.test(trimmed)) {
    return null
  }

  // 3. Si es una URL http/https
  const isUrl = /^https?:\/\//i.test(trimmed)

  if (isUrl) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null
      }

      const host = parsed.hostname.toLowerCase()
      const isGoogleMapsHost =
        host === 'maps.google.com' ||
        host.endsWith('.google.com') ||
        host === 'goo.gl' ||
        host.endsWith('.goo.gl')

      if (!isGoogleMapsHost) {
        return null
      }

      // Caso A: URL de embed directo de Google Maps (https://www.google.com/maps/embed?pb=...)
      if (parsed.pathname.includes('/maps/embed')) {
        const embedUrl = trimmed
        const safeName = businessName ? businessName.trim() : 'Barbería'
        const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeName)}`
        return {
          displayText: safeName,
          embedUrl,
          directionsUrl
        }
      }

      // Caso B: URL con parámetro de búsqueda (?q=... o ?query=...)
      const queryParam = parsed.searchParams.get('q') || parsed.searchParams.get('query')

      // Caso C: URL de lugar (/maps/place/<LUGAR_O_DIRECCION>/@<LAT>,<LNG>...)
      const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/i)
      const coordsMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || parsed.search.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)

      let query = ''
      let displayText = ''

      if (queryParam) {
        query = queryParam
        displayText = decodeURIComponent(queryParam)
      } else if (placeMatch && placeMatch[1]) {
        query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        displayText = query
      } else if (coordsMatch) {
        query = `${coordsMatch[1]},${coordsMatch[2]}`
        displayText = query
      } else {
        query = businessName ? businessName.trim() : ''
        displayText = businessName ? businessName.trim() : 'Ubicación en Google Maps'
      }

      const embedUrl = query
        ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
        : trimmed
      const directionsUrl = trimmed

      return {
        displayText: displayText || 'Ubicación en Google Maps',
        embedUrl,
        directionsUrl
      }
    } catch {
      return null
    }
  }

  // 4. Dirección física tradicional de texto o coordenadas (ej: "Calle 85 # 14-20, Bogotá")
  const query = trimmed
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`

  return {
    displayText: trimmed,
    embedUrl,
    directionsUrl
  }
}
