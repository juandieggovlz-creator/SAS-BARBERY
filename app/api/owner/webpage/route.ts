import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: {
        page: true,
        barbers: { where: { status: 'ACTIVE' } },
        services: { where: { isActive: true }, orderBy: { category: 'asc' } }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Error fetching webpage config:', error)
    return NextResponse.json({ error: 'Error al obtener configuración de la página' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone, address, description, email, logo, page } = body

    // Update Business fields if provided
    const hasBusinessUpdates =
      name !== undefined ||
      phone !== undefined ||
      address !== undefined ||
      description !== undefined ||
      email !== undefined ||
      logo !== undefined

    if (hasBusinessUpdates) {
      await prisma.business.update({
        where: { id: session.businessId },
        data: {
          ...(name ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(logo !== undefined ? { logo } : {}),
        }
      })
    }

    // Update Page Configuration
    if (page) {
      // Helper to get string or null
      const strOrNull = (v: any) => (v !== undefined ? (v ? String(v) : null) : undefined)

      // Sanitize gallery and testimonials as proper JSON arrays
      const galleryVal = page.gallery !== undefined
        ? (Array.isArray(page.gallery) ? page.gallery : [])
        : undefined
      const testimonialsVal = page.testimonials !== undefined
        ? (Array.isArray(page.testimonials) ? page.testimonials : [])
        : undefined

      // Build the update data — only include fields that are defined
      const updateData: Record<string, any> = {}

      if (page.theme !== undefined)         updateData.theme = String(page.theme)
      if (page.primaryColor !== undefined)  updateData.primaryColor = String(page.primaryColor)
      if (page.secondaryColor !== undefined) updateData.secondaryColor = String(page.secondaryColor)
      if (page.accentColor !== undefined)   updateData.accentColor = String(page.accentColor)
      if (page.fontFamily !== undefined)    updateData.fontFamily = String(page.fontFamily)

      if (page.whatsapp !== undefined)      updateData.whatsapp = strOrNull(page.whatsapp)
      if (page.showWhatsapp !== undefined)  updateData.showWhatsapp = Boolean(page.showWhatsapp)
      if (page.instagram !== undefined)     updateData.instagram = strOrNull(page.instagram)
      if (page.showInstagram !== undefined) updateData.showInstagram = Boolean(page.showInstagram)
      if (page.facebook !== undefined)      updateData.facebook = strOrNull(page.facebook)
      if (page.showFacebook !== undefined)  updateData.showFacebook = Boolean(page.showFacebook)
      if (page.tiktok !== undefined)        updateData.tiktok = strOrNull(page.tiktok)
      if (page.showTiktok !== undefined)    updateData.showTiktok = Boolean(page.showTiktok)
      if (page.youtube !== undefined)       updateData.youtube = strOrNull(page.youtube)
      if (page.showYoutube !== undefined)   updateData.showYoutube = Boolean(page.showYoutube)
      if (page.twitter !== undefined)       updateData.twitter = strOrNull(page.twitter)
      if (page.showTwitter !== undefined)   updateData.showTwitter = Boolean(page.showTwitter)

      if (page.showPrices !== undefined)    updateData.showPrices = Boolean(page.showPrices)
      if (page.showTeam !== undefined)      updateData.showTeam = Boolean(page.showTeam)
      if (page.showServices !== undefined)  updateData.showServices = Boolean(page.showServices)
      if (page.requireBarber !== undefined) updateData.requireBarber = Boolean(page.requireBarber)

      if (page.coverTitle !== undefined)    updateData.coverTitle = strOrNull(page.coverTitle)
      if (page.coverSubtitle !== undefined) updateData.coverSubtitle = strOrNull(page.coverSubtitle)
      if (page.bannerUrl !== undefined)     updateData.bannerUrl = strOrNull(page.bannerUrl)
      if (page.slogan !== undefined)        updateData.slogan = strOrNull(page.slogan)
      if (page.businessHours !== undefined) {
        updateData.businessHours = typeof page.businessHours === 'string'
          ? page.businessHours
          : JSON.stringify(page.businessHours)
      } else if (page.scheduleJson !== undefined) {
        updateData.businessHours = JSON.stringify(page.scheduleJson)
      }

      // Json fields: pass array directly (never null, default to [])
      if (galleryVal !== undefined)         updateData.gallery = galleryVal
      if (testimonialsVal !== undefined)    updateData.testimonials = testimonialsVal

      // Check if a page record already exists for this business
      const existingPage = await prisma.businessPage.findUnique({
        where: { businessId: session.businessId },
        select: { id: true }
      })

      if (existingPage) {
        // UPDATE existing record
        await prisma.businessPage.update({
          where: { businessId: session.businessId },
          data: updateData,
        })
      } else {
        // CREATE new record — exclude null values so DB defaults apply
        const createData: Record<string, any> = { businessId: session.businessId }
        for (const [k, v] of Object.entries(updateData)) {
          if (v !== null) createData[k] = v
        }
        await prisma.businessPage.create({ data: createData as any })
      }
    }

    const finalResult = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: { page: true }
    })

    return NextResponse.json(finalResult)
  } catch (error) {
    console.error('[webpage PATCH] Error:', error instanceof Error ? error.message : String(error))
    console.error('[webpage PATCH] Stack:', error instanceof Error ? error.stack : '')
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al actualizar la configuración'
    }, { status: 500 })
  }
}
