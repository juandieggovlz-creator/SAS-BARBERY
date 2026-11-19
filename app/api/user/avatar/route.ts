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
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Solo se admiten imágenes JPG, PNG o WEBP por seguridad.' },
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

    // Obtener usuario actual para conocer su avatar previo
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatar: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Convertir archivo a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Cloudinary en carpeta de avatares de usuario
    const folder = CLOUDINARY_FOLDERS.AVATARS(session.userId)
    const uploadResult = await uploadImageFromBuffer(buffer, folder, {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      ],
    })

    // Actualizar avatar en BD
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: uploadResult.secureUrl },
      select: { id: true, name: true, avatar: true },
    })

    // Eliminar avatar anterior de Cloudinary si existía y es diferente
    if (currentUser.avatar && currentUser.avatar !== uploadResult.secureUrl) {
      safeDeleteTenantImage(currentUser.avatar, session.userId).catch((err) =>
        console.error('[Cloudinary] Error eliminando avatar anterior:', err)
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil actualizada correctamente.',
      avatarUrl: updatedUser.avatar,
    })
  } catch (error: unknown) {
    console.error('Error actualizando foto de perfil:', error)
    return NextResponse.json(
      { error: 'No se pudo actualizar la foto de perfil. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatar: true },
    })

    if (!currentUser || !currentUser.avatar) {
      return NextResponse.json({ error: 'El usuario no tiene foto de perfil para eliminar' }, { status: 400 })
    }

    const oldAvatar = currentUser.avatar

    // Eliminar de BD
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    })

    // Limpiar de Cloudinary
    safeDeleteTenantImage(oldAvatar, session.userId).catch((err) =>
      console.error('[Cloudinary] Error eliminando avatar:', err)
    )

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil eliminada correctamente.',
    })
  } catch (error: unknown) {
    console.error('Error eliminando foto de perfil:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la foto de perfil. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
