import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  uploadImageFromBuffer,
  deleteImage,
  extractPublicIdFromUrl,
  safeDeleteTenantImage,
  CLOUDINARY_FOLDERS,
} from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

interface GalleryItem {
  id: string
  url: string
  publicId?: string
  caption: string
  category: 'cortes' | 'barbas' | 'instalaciones'
  createdAt?: string
}

const VALID_CATEGORIES = ['cortes', 'barbas', 'instalaciones'] as const
const MAX_PER_CATEGORY = 6
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function normalizeCat(cat: string): 'cortes' | 'barbas' | 'instalaciones' {
  const c = (cat || '').toLowerCase().trim()
  if (c === 'barba' || c === 'barbas') return 'barbas'
  if (c === 'instalacion' || c === 'instalaciones') return 'instalaciones'
  return 'cortes'
}

/**
 * GET: Obtener la lista actual de fotografías de la galería del negocio autenticado
 */
export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const page = await prisma.businessPage.findUnique({
      where: { businessId: session.businessId },
      select: { gallery: true },
    })

    const gallery: GalleryItem[] = Array.isArray(page?.gallery) ? (page.gallery as any) : []
    return NextResponse.json({ success: true, gallery })
  } catch (error) {
    console.error('[Gallery GET] Error:', error)
    return NextResponse.json({ error: 'Error al obtener la galería' }, { status: 500 })
  }
}

/**
 * POST: Subir una o más fotografías a Cloudinary y agregarlas o reemplazarlas en la galería
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const rawCategory = (formData.get('category') as string) || 'cortes'
    const category = normalizeCat(rawCategory)
    const caption = (formData.get('caption') as string) || ''
    const replaceId = formData.get('replaceId') as string | null

    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null
    const allFiles: File[] = files.length > 0 ? files : singleFile ? [singleFile] : []

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 })
    }

    // Obtener la página del negocio actual o crearla
    let page = await prisma.businessPage.findUnique({
      where: { businessId: session.businessId },
    })

    if (!page) {
      page = await prisma.businessPage.create({
        data: {
          businessId: session.businessId,
          gallery: [],
        },
      })
    }

    const currentGallery: GalleryItem[] = Array.isArray(page.gallery) ? (page.gallery as any) : []
    const categoryItems = currentGallery.filter(item => normalizeCat(item.category) === category)

    // Validar límite si no es reemplazo
    if (!replaceId) {
      const availableQuota = MAX_PER_CATEGORY - categoryItems.length
      if (availableQuota <= 0) {
        return NextResponse.json(
          { error: `La categoría "${category}" ya tiene el límite máximo de ${MAX_PER_CATEGORY} fotos. Elimina una para subir otra.` },
          { status: 400 }
        )
      }
      if (allFiles.length > availableQuota) {
        return NextResponse.json(
          { error: `Solo puedes subir ${availableQuota} foto(s) más en "${category}". Intentaste subir ${allFiles.length}.` },
          { status: 400 }
        )
      }
    } else {
      // Si es reemplazo, solo 1 archivo
      if (allFiles.length > 1) {
        return NextResponse.json({ error: 'Para reemplazar solo se permite un archivo' }, { status: 400 })
      }
      const exists = currentGallery.some(item => item.id === replaceId)
      if (!exists) {
        return NextResponse.json({ error: 'La fotografía a reemplazar no existe' }, { status: 404 })
      }
    }

    // Validar tipo y peso de cada archivo
    for (const f of allFiles) {
      if (!VALID_MIME_TYPES.includes(f.type)) {
        return NextResponse.json(
          { error: `El archivo "${f.name}" no tiene un formato válido. Usa JPG, PNG o WEBP.` },
          { status: 400 }
        )
      }
      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `El archivo "${f.name}" supera el tamaño máximo permitido de 5MB.` },
          { status: 400 }
        )
      }
    }

    const folder = CLOUDINARY_FOLDERS.GALLERY(session.businessId)
    const uploadedItems: GalleryItem[] = []

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadResult = await uploadImageFromBuffer(buffer, folder, {
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
        ],
      })

      const itemCaption = caption.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

      uploadedItems.push({
        id: crypto.randomUUID(),
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        caption: itemCaption,
        category,
        createdAt: new Date().toISOString(),
      })
    }

    let updatedGallery: GalleryItem[] = []
    let oldItemToClean: GalleryItem | null = null

    if (replaceId) {
      const newItem = uploadedItems[0]
      oldItemToClean = currentGallery.find(item => item.id === replaceId) || null

      updatedGallery = currentGallery.map(item => {
        if (item.id === replaceId) {
          return {
            ...newItem,
            id: replaceId, // Mantener el mismo ID para consistencia
            caption: caption.trim() || item.caption,
          }
        }
        return item
      })
    } else {
      updatedGallery = [...currentGallery, ...uploadedItems]
    }

    // 1. Guardar en Neon mediante Prisma PRIMERO
    await prisma.businessPage.update({
      where: { businessId: session.businessId },
      data: {
        gallery: updatedGallery as any,
      },
    })

    // 2. Únicamente si la base de datos se actualizó correctamente, limpiar la foto anterior de Cloudinary
    if (oldItemToClean && oldItemToClean.url) {
      const newUrl = uploadedItems[0]?.url
      if (oldItemToClean.url !== newUrl) {
        safeDeleteTenantImage(oldItemToClean.url, session.businessId).catch(err =>
          console.error('[Gallery] Error eliminando imagen antigua reemplazada:', err)
        )
      }
    }

    return NextResponse.json({
      success: true,
      gallery: updatedGallery,
      addedItems: uploadedItems,
      message: 'Foto actualizada correctamente.',
    })
  } catch (error: unknown) {
    console.error('[Gallery POST] Error subiendo fotos:', error)
    return NextResponse.json({ error: 'No se pudo actualizar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}

/**
 * DELETE: Eliminar una fotografía de la galería y de Cloudinary
 */
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      try {
        const body = await request.json()
        id = body?.id
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de la fotografía es requerido' }, { status: 400 })
    }

    const page = await prisma.businessPage.findUnique({
      where: { businessId: session.businessId },
      select: { gallery: true },
    })

    const currentGallery: GalleryItem[] = Array.isArray(page?.gallery) ? (page?.gallery as any) : []
    const itemToDelete = currentGallery.find(item => item.id === id)

    if (!itemToDelete) {
      return NextResponse.json({ error: 'La fotografía no existe o ya fue eliminada' }, { status: 404 })
    }

    // Filtrar la lista
    const updatedGallery = currentGallery.filter(item => item.id !== id)

    // 1. Actualizar Neon DB primero para que la referencia nunca quede rota
    await prisma.businessPage.update({
      where: { businessId: session.businessId },
      data: {
        gallery: updatedGallery as any,
      },
    })

    // 2. Eliminar de Cloudinary si correspondía al tenant y no es preset
    if (itemToDelete.url) {
      await safeDeleteTenantImage(itemToDelete.url, session.businessId)
    }

    return NextResponse.json({
      success: true,
      gallery: updatedGallery,
      deletedId: id,
      message: 'Foto eliminada correctamente.',
    })
  } catch (error: unknown) {
    console.error('[Gallery DELETE] Error:', error)
    return NextResponse.json({ error: 'No se pudo eliminar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}

/**
 * PATCH: Actualizar el título o categoría de una foto existente
 */
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, caption, category } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de la foto es requerido' }, { status: 400 })
    }

    const page = await prisma.businessPage.findUnique({
      where: { businessId: session.businessId },
      select: { gallery: true },
    })

    const currentGallery: GalleryItem[] = Array.isArray(page?.gallery) ? (page?.gallery as any) : []
    let found = false

    const updatedGallery = currentGallery.map(item => {
      if (item.id === id) {
        found = true
        return {
          ...item,
          ...(caption !== undefined ? { caption: String(caption).trim() } : {}),
          ...(category ? { category: normalizeCat(category) } : {}),
        }
      }
      return item
    })

    if (!found) {
      return NextResponse.json({ error: 'Fotografía no encontrada' }, { status: 404 })
    }

    await prisma.businessPage.update({
      where: { businessId: session.businessId },
      data: { gallery: updatedGallery as any },
    })

    return NextResponse.json({ success: true, gallery: updatedGallery })
  } catch (error) {
    console.error('[Gallery PATCH] Error:', error)
    return NextResponse.json({ error: 'Error al actualizar información de la foto' }, { status: 500 })
  }
}
