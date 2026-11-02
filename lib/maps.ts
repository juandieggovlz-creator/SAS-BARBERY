/**
 * Utilidades para resolución, validación y sanitización de ubicaciones en Google Maps.
 *
 * Soporta de forma inteligente:
 * 1. Enlaces compartidos de Google Maps (maps.app.goo.gl, goo.gl/maps).
 * 2. Enlaces completos de navegador (google.com/maps/place/..., google.com/maps?q=...).
 * 3. URLs de mapas incrustados (google.com/maps/embed?pb=...).
 * 4. Código HTML de iframe copiado desde Google Maps (<iframe src="https://www.google.com/maps/embed?..."></iframe>).
 * 5. Direcciones físicas en texto plano (ej: "Calle 85 # 14-20, Bogotá").
 * 6. Coordenadas geográficas (ej: "4.67123, -74.05812").
 *
 * Seguridad:
 * - Sanitiza y valida contra inyección de HTML o scripts (XSS).
 * - Restringe iframes y enlaces exclusivamente a dominios legítimos de Google Maps.
 * - No requiere API Key de pago de Google Maps Platform.
 */

export interface LocationInfo {
  displayText: string
  embedUrl: string | null
  directionsUrl: string
}

/**
 * Valida si un enlace ingresado corresponde a un formato legítimo de Google Maps.
 */
export function validateGoogleMapsUrl(url: string | null | undefined): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'Por favor ingresa un enlace de Google Maps.' }
  }

  let trimmed = url.trim()

  // Extraer src si es un iframe
  if (/<iframe[\s\S]+<\/iframe>/i.test(trimmed) || /<iframe[\s\S]+>/i.test(trimmed)) {
    const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i)
    if (srcMatch && srcMatch[1]) {
      trimmed = srcMatch[1].trim()
    } else {
      return { isValid: false, error: 'El código iframe ingresado no contiene un atributo src válido.' }
    }
  }

  // Prevenir XSS o esquemas no seguros
  if (/<[a-z][\s\S]*>/i.test(trimmed) || /^(javascript:|data:|vbscript:)/i.test(trimmed)) {
    return { isValid: false, error: 'El enlace contiene caracteres o secuencias no permitidas.' }
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return { isValid: false, error: 'El enlace debe comenzar por https://' }
  }

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()

    const isGoogleMapsHost =
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host.endsWith('.goo.gl') ||
      host === 'google.com' ||
      host === 'maps.google.com' ||
      host.endsWith('.google.com')

    if (!isGoogleMapsHost) {
      return { isValid: false, error: 'El dominio debe ser un enlace oficial de Google Maps (maps.app.goo.gl o google.com/maps).' }
    }

    return { isValid: true }
  } catch {
    return { isValid: false, error: 'La URL ingresada no tiene un formato válido.' }
  }
}

/**
 * Resuelve y sanitiza la información de ubicación para vista incrustada y botón Cómo llegar.
 */
export function parseLocation(
  addressOrUrl: string | null | undefined,
  businessName?: string | null,
  fallbackAddress?: string | null
): LocationInfo | null {
  if (!addressOrUrl) {
    if (fallbackAddress) {
      return parseLocation(fallbackAddress, businessName)
    }
    return null
  }

  let trimmed = addressOrUrl.trim()
  if (!trimmed) {
    if (fallbackAddress) {
      return parseLocation(fallbackAddress, businessName)
    }
    return null
  }

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
        host === 'maps.app.goo.gl' ||
        host === 'goo.gl' ||
        host.endsWith('.goo.gl') ||
        host === 'google.com' ||
        host === 'maps.google.com' ||
        host.endsWith('.google.com')

      if (!isGoogleMapsHost) {
        return null
      }

      // Caso A: URL de embed directo de Google Maps (https://www.google.com/maps/embed?pb=...)
      if (parsed.pathname.includes('/maps/embed')) {
        const embedUrl = trimmed
        const safeName = businessName ? businessName.trim() : (fallbackAddress || 'Barbería')
        const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeName)}`
        return {
          displayText: fallbackAddress || safeName,
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
      let displayText = fallbackAddress || ''

      if (queryParam) {
        query = queryParam
        displayText = displayText || decodeURIComponent(queryParam)
      } else if (placeMatch && placeMatch[1]) {
        query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        displayText = displayText || query
      } else if (coordsMatch) {
        query = `${coordsMatch[1]},${coordsMatch[2]}`
        displayText = displayText || (businessName ? businessName.trim() : 'Ubicación')
      } else {
        // Enlaces cortos (maps.app.goo.gl): usar dirección física o nombre del negocio para el mapa incrustado
        const querySource = fallbackAddress || businessName || ''
        query = querySource.trim()
        displayText = displayText || (businessName ? businessName.trim() : 'Ubicación en Google Maps')
      }

      const embedUrl = query
        ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
        : null

      return {
        displayText: displayText || 'Ubicación en Google Maps',
        embedUrl,
        directionsUrl: trimmed // Abre el enlace original compartido por el propietario
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
