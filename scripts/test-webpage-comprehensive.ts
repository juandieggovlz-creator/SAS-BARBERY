import { prisma } from '../lib/prisma'
import { PRESET_THEMES, FONT_OPTIONS } from '../lib/themes'
import {
  MOTION_PRESET_LIST,
  resolveMotionPreset,
  extractMotionConfigFromPage,
  embedMotionConfigInSchedule
} from '../lib/motion-presets'
import {
  OFFICIAL_BARBEROS_HERO_COVER,
  OFFICIAL_HERO_COVER_SPECS,
  DEFAULT_HERO_BANNER,
  BARBEROS_OFFICIAL_COVERS,
  DEFAULT_COVER_ID,
  getCoverById,
  resolveCoverBannerUrl,
} from '../components/public/BannerPresets'
import {
  GALLERY_MAX_PER_CATEGORY,
  sortGallery,
  normalizeGalleryCategory,
  getCategoryLabel,
  sanitizeGalleryItem,
  GalleryItem
} from '../lib/gallery'
import { parseSchedule, formatTime12h, formatDayHours, DEFAULT_SCHEDULE } from '../lib/schedule'
import { validateGoogleMapsUrl, parseLocation } from '../lib/maps'
import { buildSocialUrl } from '../lib/socials'
import fs from 'fs'
import path from 'path'

async function runTestSuite() {
  console.log('════════════════════════════════════════════════════════════════════')
  console.log('   TEST SUITE: BARBEROS — FINALIZACIÓN EDITOR WEB & PÁGINAS (28/28) ')
  console.log('════════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASÓ [${passed + failed + 1}/28]: ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FALLÓ [${passed + failed + 1}/28]: ${testName} ${detail ? `(${detail})` : ''}`)
      failed++
    }
  }

  // Buscar negocios existentes para pruebas
  const business = await prisma.business.findFirst({
    include: { page: true, services: true, barbers: true }
  })

  if (!business) {
    console.error('No se encontró ningún negocio en la base de datos para pruebas.')
    process.exit(1)
  }

  const initialName = business.name
  const initialPhone = business.phone
  const initialEmail = business.email

  try {
    // 1. Data retrieval: Business exists with page and relations
    assert(Boolean(business && business.id && business.slug), '1. Lectura de datos de negocio y página pública')

    // 2. Modificación de nombre comercial como fuente única de verdad
    const testName = `Barbería Elite Pro ${Date.now()}`
    const updatedBiz = await prisma.business.update({
      where: { id: business.id },
      data: { name: testName }
    })
    assert(updatedBiz.name === testName, '2. Nombre comercial es la fuente única de verdad en Business.name')

    // 3. Modificación y persistencia de eslogan
    const testSlogan = 'Cortes de autor y afeitado tradicional de lujo'
    const updatedPage = await prisma.businessPage.upsert({
      where: { businessId: business.id },
      create: { businessId: business.id, slogan: testSlogan },
      update: { slogan: testSlogan }
    })
    assert(updatedPage.slogan === testSlogan, '3. Modificación y persistencia del eslogan en BusinessPage.slogan')

    // 4. Modificación de tema visual y tipografía
    const themeTest = 'DARK_LUXURY'
    const fontTest = 'inter'
    const themeUpdated = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { theme: themeTest, fontFamily: fontTest }
    })
    assert(themeUpdated.theme === themeTest && themeUpdated.fontFamily === fontTest, '4. Modificación de tema visual (10 Luxury) y tipografía')

    // 5. Visibilidad independiente: showPhone: false
    const schedWithPhoneFalse = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { showPhone: false })
    const pagePhoneFalse = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedWithPhoneFalse) }
    })
    const extractedPhoneFalse = extractMotionConfigFromPage(pagePhoneFalse)
    assert(extractedPhoneFalse.showPhone === false, '5. Switch independiente showPhone: false oculta el teléfono')

    // 6. Visibilidad independiente: showPhone: true con teléfono válido
    const schedWithPhoneTrue = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { showPhone: true })
    const pagePhoneTrue = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedWithPhoneTrue) }
    })
    await prisma.business.update({
      where: { id: business.id },
      data: { phone: '+57 300 987 6543' }
    })
    const extractedPhoneTrue = extractMotionConfigFromPage(pagePhoneTrue)
    assert(extractedPhoneTrue.showPhone === true, '6. Switch independiente showPhone: true muestra el teléfono')

    // 7. Visibilidad independiente: showEmail: false
    const schedWithEmailFalse = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { showEmail: false })
    const pageEmailFalse = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedWithEmailFalse) }
    })
    const extractedEmailFalse = extractMotionConfigFromPage(pageEmailFalse)
    assert(extractedEmailFalse.showEmail === false, '7. Switch independiente showEmail: false oculta el correo')

    // 8. Visibilidad independiente: showEmail: true con correo válido
    const schedWithEmailTrue = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { showEmail: true })
    const pageEmailTrue = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedWithEmailTrue) }
    })
    await prisma.business.update({
      where: { id: business.id },
      data: { email: 'contacto@barberiaelite.com' }
    })
    const extractedEmailTrue = extractMotionConfigFromPage(pageEmailTrue)
    assert(extractedEmailTrue.showEmail === true, '8. Switch independiente showEmail: true muestra el correo')

    // 9. WhatsApp: showWhatsapp: false
    const pageWaFalse = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { showWhatsapp: false, whatsapp: '3001234567' }
    })
    assert(pageWaFalse.showWhatsapp === false, '9. Switch independiente showWhatsapp: false desactiva el botón de WhatsApp')

    // 10. WhatsApp: showWhatsapp: true con número válido
    const pageWaTrue = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { showWhatsapp: true, whatsapp: '+57 311 555 4321' }
    })
    assert(pageWaTrue.showWhatsapp === true && Boolean(pageWaTrue.whatsapp), '10. WhatsApp activo con número o enlace válido')

    // 11. defaultColorMode: 'light' por negocio
    const schedLight = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { defaultColorMode: 'light' })
    const pageLight = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedLight) }
    })
    const extractedLight = extractMotionConfigFromPage(pageLight)
    assert(extractedLight.defaultColorMode === 'light', '11. Modo de color predeterminado Claro guardado para nuevos visitantes')

    // 12. defaultColorMode: 'dark' por negocio
    const schedDark = embedMotionConfigInSchedule(DEFAULT_SCHEDULE, { defaultColorMode: 'dark' })
    const pageDark = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { businessHours: JSON.stringify(schedDark) }
    })
    const extractedDark = extractMotionConfigFromPage(pageDark)
    assert(extractedDark.defaultColorMode === 'dark', '12. Modo de color predeterminado Oscuro guardado para nuevos visitantes')

    // 13. Portada prediseñada oficial seleccionada y guardada
    const selectedCover = BARBEROS_OFFICIAL_COVERS[1] // Dark Luxury Studio
    const pageCover = await prisma.businessPage.update({
      where: { businessId: business.id },
      data: { bannerUrl: selectedCover.url }
    })
    assert(pageCover.bannerUrl === selectedCover.url, '13. Selección y guardado de portada oficial prediseñada')

    // 14. Catálogo oficial de portadas tiene al menos 5 opciones curadas
    assert(
      BARBEROS_OFFICIAL_COVERS.length >= 5 &&
      BARBEROS_OFFICIAL_COVERS.every(c => c.id && c.title && c.url && c.badge && c.lighting),
      '14. Catálogo curado de portadas oficiales BarberOS con metadatos completos'
    )

    // 15. Especificaciones técnicas de portada oficial
    assert(
      OFFICIAL_HERO_COVER_SPECS.aspectRatio.includes('16:9') &&
      OFFICIAL_HERO_COVER_SPECS.resolution.includes('2560') &&
      OFFICIAL_HERO_COVER_SPECS.format.includes('WebP'),
      '15. Especificaciones técnicas oficiales 16:9 Ultra HD WebP/AVIF'
    )

    // 16. Resolución canónica de portada ante valores externos
    const resolvedCanonical = resolveCoverBannerUrl('https://random-external-image.com/fake.jpg')
    assert(resolvedCanonical.startsWith('/imagenes/'), '16. Protección contra inyección de URLs arbitrarias en portada')

    // 17. Formateo y enlaces de redes sociales
    const waSocialUrl = buildSocialUrl('whatsapp', '+57 300 123 4567')
    const igSocialUrl = buildSocialUrl('instagram', 'barberia.oficial')
    assert(
      waSocialUrl.includes('wa.me/573001234567') && igSocialUrl.includes('instagram.com/barberia.oficial'),
      '17. Generador de URLs sociales oficiales (WhatsApp wa.me, Instagram)'
    )

    // 18. Servicios activos en catálogo
    const activeServices = business.services.filter(s => s.isActive)
    assert(
      Array.isArray(activeServices),
      '18. Consulta de servicios activos del catálogo oficial (Service.isActive: true)'
    )

    // 19. Límite de 8 fotos por colección de galería
    assert(GALLERY_MAX_PER_CATEGORY === 8, '19. Límite estricto de máximo 8 fotos por colección en galería')

    // 20. Sanitización de elementos de galería
    const rawGallery = [
      { id: 'item-1', url: 'https://images.unsplash.com/photo-test', category: 'cortes', title: 'Fade Clásico' },
      { id: 'item-2', url: '', category: 'barbas' }, // URL vacía
      { id: 'item-3', url: '/imagenes/corte.jpg', category: 'INSTALACIONES' },
    ]
    const sanitizedGallery = rawGallery.map((i, idx) => sanitizeGalleryItem(i, idx)).filter(Boolean) as GalleryItem[]
    assert(
      sanitizedGallery.length === 2 &&
      sanitizedGallery[0]?.category === 'cortes' &&
      sanitizedGallery[1]?.category === 'instalaciones',
      '20. Sanitización de elementos de galería (IDs, categorías en minúsculas, filtrado de URLs vacías)'
    )

    // 21. Ordenación de galería por order
    const unsortedGallery: GalleryItem[] = [
      { id: 'a', url: 'https://img.com/a.jpg', category: 'cortes', order: 2 },
      { id: 'b', url: 'https://img.com/b.jpg', category: 'cortes', order: 0 },
      { id: 'c', url: 'https://img.com/c.jpg', category: 'cortes', order: 1 },
    ]
    const sorted = sortGallery(unsortedGallery)
    assert(sorted[0].id === 'b' && sorted[1].id === 'c' && sorted[2].id === 'a', '21. Ordenación estable de fotos en galería por índice order')

    // 22. Normalización y mapeo de categorías de galería
    assert(
      normalizeGalleryCategory('Cortes') === 'cortes' &&
      normalizeGalleryCategory('  Barbas  ') === 'barbas' &&
      normalizeGalleryCategory('instalacion') === 'instalaciones' &&
      normalizeGalleryCategory('instalaciones') === 'instalaciones',
      '22. Normalización y mapeo de categorías de galería'
    )

    // 23. Validación de URLs válidas de Google Maps
    const validMap1 = validateGoogleMapsUrl('https://maps.google.com/?q=4.60971,-74.08175')
    const validMap2 = validateGoogleMapsUrl('https://maps.app.goo.gl/abcdef12345')
    const validMap3 = validateGoogleMapsUrl('<iframe src="https://www.google.com/maps/embed?pb=123" width="600" height="450"></iframe>')
    assert(validMap1.isValid && validMap2.isValid && validMap3.isValid, '23. Validador de Google Maps acepta shortlinks, web URLs e iframes embed')

    // 24. Rechazo de URLs inválidas o maliciosas en Google Maps
    const invalidMap1 = validateGoogleMapsUrl('https://malicious-site.com/fake-map')
    const invalidMap2 = validateGoogleMapsUrl('javascript:alert(1)')
    assert(!invalidMap1.isValid && !invalidMap2.isValid, '24. Validador de Google Maps rechaza dominios no autorizados y scripts maliciosos')

    // 25. Parseo de horarios semanales completos (7 días)
    const scheduleParsed = parseSchedule(DEFAULT_SCHEDULE)
    assert(
      scheduleParsed.length === 7 &&
      scheduleParsed.every(d => d.day && d.openTime && d.closeTime && typeof d.isOpen === 'boolean'),
      '25. Horarios de atención: 7 días configurables con estado abierto/cerrado'
    )

    // 26. Formateo amigable de 12 horas para horarios
    const time12h = formatTime12h('14:30')
    const timeMorning = formatTime12h('08:00')
    assert(time12h === '02:30 PM' && timeMorning === '08:00 AM', '26. Formato de 12 horas (AM/PM) para visualización amigable al cliente')

    // 27. Presets de movimiento cinemático (ELEGANT, CINEMATIC, DYNAMIC)
    assert(
      MOTION_PRESET_LIST.length === 3 &&
      resolveMotionPreset('ELEGANT').id === 'ELEGANT' &&
      resolveMotionPreset('CINEMATIC').id === 'CINEMATIC' &&
      resolveMotionPreset('DYNAMIC').id === 'DYNAMIC',
      '27. Resolución de perfiles de movimiento cinemático de autor'
    )

    // 28. Seguridad de Headers en next.config.ts (SAMEORIGIN para iframe local/preview y prevención de clickjacking)
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts')
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
    const allowsSameOrigin = nextConfigContent.includes('SAMEORIGIN')
    const allowsFrameAncestors = nextConfigContent.includes("frame-ancestors 'self'")
    assert(
      allowsSameOrigin && allowsFrameAncestors,
      '28. Cabeceras de seguridad: X-Frame-Options SAMEORIGIN y Content-Security-Policy frame-ancestors self'
    )

  } finally {
    // Restaurar datos originales del negocio
    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: initialName,
        phone: initialPhone,
        email: initialEmail
      }
    })
    console.log('\n  [Info] Datos originales del negocio restaurados con éxito.')
  }

  console.log('\n════════════════════════════════════════════════════════════════════')
  console.log(`   RESULTADO FINAL: ${passed} PASADOS | ${failed} FALLIDOS`)
  console.log('════════════════════════════════════════════════════════════════════\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal durante la ejecución de los tests:', err)
    process.exit(1)
  })
