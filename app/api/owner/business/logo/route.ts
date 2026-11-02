import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  uploadImageFromBuffer,
  safeDeleteTenantImage,
  CLOUDINARY_FOLDERS,
} from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Usa JPG, PNG, WEBP o SVG.' },
        { status: 400 }
      )
    }

    // Límite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (5MB)' },
        { status: 400 }
      )
    }

    // Obtener negocio actual para verificar si ya tiene un logo previo
    const currentBusiness = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { logo: true },
    })

    // Convertir archivo a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Cloudinary con carpeta organizada del negocio
    const folder = CLOUDINARY_FOLDERS.LOGOS(session.businessId)
    const uploadResult = await uploadImageFromBuffer(buffer, folder, {
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
      ],
    })

    // 1. Guardar la URL nueva en Neon mediante Prisma PRIMERO
    const updatedBusiness = await prisma.business.update({
      where: { id: session.businessId },
      data: { logo: uploadResult.secureUrl },
      select: { id: true, name: true, logo: true },
    })

    // 2. Únicamente si la base de datos se actualizó correctamente, limpiar logo anterior de Cloudinary
    if (currentBusiness?.logo && currentBusiness.logo !== uploadResult.secureUrl) {
      // Verificar que otro negocio no esté usando la misma URL
      const otherBusinessUsingLogo = await prisma.business.findFirst({
        where: { logo: currentBusiness.logo, id: { not: session.businessId } },
        select: { id: true },
      })

      if (!otherBusinessUsingLogo) {
        safeDeleteTenantImage(currentBusiness.logo, session.businessId).catch((err) =>
          console.error('[Cloudinary] Error eliminando logo anterior del tenant:', err)
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Foto actualizada correctamente.',
      logoUrl: updatedBusiness.logo,
      business: updatedBusiness,
    })
  } catch (error: unknown) {
    console.error('Error actualizando logo:', error)
    return NextResponse.json({ error: 'No se pudo actualizar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentBusiness = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { logo: true },
    })

    if (!currentBusiness?.logo) {
      return NextResponse.json({ success: true, message: 'Foto eliminada correctamente.' })
    }

    const logoToDelete = currentBusiness.logo

    // 1. Actualizar en Neon primero para desvincular
    await prisma.business.update({
      where: { id: session.businessId },
      data: { logo: null },
    })

    // 2. Verificar que ningún otro negocio tenga esa misma referencia antes de borrar en Cloudinary
    const otherBusinessUsingLogo = await prisma.business.findFirst({
      where: { logo: logoToDelete, id: { not: session.businessId } },
      select: { id: true },
    })

    if (!otherBusinessUsingLogo) {
      await safeDeleteTenantImage(logoToDelete, session.businessId)
    }

    return NextResponse.json({ success: true, message: 'Foto eliminada correctamente.' })
  } catch (error: unknown) {
    console.error('Error eliminando logo:', error)
    return NextResponse.json({ error: 'No se pudo eliminar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}
