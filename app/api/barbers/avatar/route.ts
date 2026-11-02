import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  uploadImageFromBuffer,
  safeDeleteTenantImage,
  CLOUDINARY_FOLDERS,
} from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const barberId = (formData.get('barberId') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 })
    }

    if (!VALID_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usa JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB.' },
        { status: 400 }
      )
    }

    // Si viene barberId, verificar permisos y propiedad del tenant
    let barberToUpdate = null
    if (barberId) {
      barberToUpdate = await prisma.barber.findUnique({
        where: { id: barberId },
        select: { id: true, businessId: true, avatar: true },
      })

      if (!barberToUpdate || barberToUpdate.businessId !== session.businessId) {
        if (session.role === 'BARBER' && session.barberId === barberId) {
          // Permitido si es su propio perfil
        } else if (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'No autorizado para modificar este barbero' }, { status: 403 })
        }
      }
    }

    // Convertir a buffer y subir a Cloudinary con namespace del negocio
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const folder = CLOUDINARY_FOLDERS.BARBERS(session.businessId)

    const uploadResult = await uploadImageFromBuffer(buffer, folder, {
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      ],
    })

    // Si hay barberId, actualizar directamente en Neon primero
    if (barberId) {
      await prisma.barber.update({
        where: { id: barberId },
        data: { avatar: uploadResult.secureUrl },
      })

      // Únicamente si la base de datos se actualizó, limpiar avatar anterior de forma segura
      if (barberToUpdate?.avatar && barberToUpdate.avatar !== uploadResult.secureUrl) {
        // Verificar que otro barbero no esté usando la misma URL
        const otherBarberUsingAvatar = await prisma.barber.findFirst({
          where: { avatar: barberToUpdate.avatar, id: { not: barberId } },
          select: { id: true },
        })

        if (!otherBarberUsingAvatar) {
          safeDeleteTenantImage(barberToUpdate.avatar, session.businessId).catch((err) =>
            console.error('[Cloudinary] Error eliminando avatar antiguo de barbero:', err)
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Foto actualizada correctamente.',
      avatarUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
    })
  } catch (error: unknown) {
    console.error('[Barber Avatar POST] Error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')

    if (!barberId) {
      return NextResponse.json({ error: 'ID del barbero es requerido' }, { status: 400 })
    }

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true, businessId: true, avatar: true },
    })

    if (!barber || barber.businessId !== session.businessId) {
      if (!(session.role === 'BARBER' && session.barberId === barberId) && session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    if (barber?.avatar) {
      const avatarToDelete = barber.avatar

      // 1. Actualizar en Neon primero para desvincular
      await prisma.barber.update({
        where: { id: barberId },
        data: { avatar: null },
      })

      // 2. Verificar que ningún otro barbero comparta esta foto antes de eliminar
      const otherBarberUsingAvatar = await prisma.barber.findFirst({
        where: { avatar: avatarToDelete, id: { not: barberId } },
        select: { id: true },
      })

      if (!otherBarberUsingAvatar) {
        await safeDeleteTenantImage(avatarToDelete, session.businessId)
      }
    }

    return NextResponse.json({ success: true, message: 'Foto eliminada correctamente.' })
  } catch (error) {
    console.error('[Barber Avatar DELETE] Error:', error)
    return NextResponse.json({ error: 'No se pudo eliminar la foto. Inténtalo de nuevo.' }, { status: 500 })
  }
}
