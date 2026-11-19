import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { uploadImageFromBuffer } from '@/lib/cloudinary'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/superadmin/settings/logo
 * Permite al Super Admin subir el logo corporativo de BarberOS desde su PC a Cloudinary
 * y persistirlo en PlatformSetting (key: 'platform_logo').
 */
export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 })
    }

    // 1. Validar tipos de archivo permitidos (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Solo se admiten imágenes JPG, PNG o WEBP por seguridad.' },
        { status: 400 }
      )
    }

    // 2. Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (5MB)' },
        { status: 400 }
      )
    }

    // 3. Convertir a Buffer y subir a Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const folder = 'barberos/platform/logo'
    const uploadResult = await uploadImageFromBuffer(buffer, folder, {
      transformation: [
        { width: 512, height: 512, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    })

    const newLogoUrl = uploadResult.secureUrl

    // 4. Guardar en PlatformSetting (upsert)
    await prisma.platformSetting.upsert({
      where: { key: 'platform_logo' },
      update: { value: newLogoUrl },
      create: {
        key: 'platform_logo',
        value: newLogoUrl,
        description: 'Logo oficial de BarberOS'
      }
    })

    // 5. Registrar en auditoría
    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      action: 'PLATFORM_LOGO_UPDATED',
      entity: 'PlatformSetting',
      details: {
        logoUrl: newLogoUrl,
        sizeBytes: file.size,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Logo oficial de BarberOS actualizado con éxito.',
      logoUrl: newLogoUrl
    })
  } catch (error: any) {
    console.error('Error subiendo logo de BarberOS a Cloudinary:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar y subir el logo' },
      { status: 500 }
    )
  }
}
