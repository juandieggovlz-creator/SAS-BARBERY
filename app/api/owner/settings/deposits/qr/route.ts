import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  uploadImageFromBuffer,
  safeDeleteTenantImage,
  CLOUDINARY_FOLDERS,
} from '@/lib/cloudinary'
import {
  extractDepositInstructionsAndConfig,
  serializeDepositInstructionsWithConfig,
  DepositPaymentMethodsConfig,
} from '@/lib/booking/deposit-config'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (
      !session ||
      !session.businessId ||
      (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const method = String(formData.get('method') || 'nequi').toLowerCase()

    if (!file) {
      return NextResponse.json(
        { error: 'No se envió ningún archivo de imagen para el código QR' },
        { status: 400 }
      )
    }

    // 1. Validar tipo de archivo (solo imágenes raster para QR nítido)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Solo se admiten imágenes PNG, JPG o WEBP.' },
        { status: 400 }
      )
    }

    // 2. Límite de tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo del código QR no debe superar los 5MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 3. Subir a Cloudinary en carpeta aislada por barbería
    const folder = CLOUDINARY_FOLDERS.QR_CODES(session.businessId)
    const uploadResult = await uploadImageFromBuffer(buffer, folder, {
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
      ],
    })

    // 4. Actualizar la configuración del negocio con la nueva URL de QR
    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { depositInstructions: true },
    })

    const { cleanInstructions, paymentMethods } = extractDepositInstructionsAndConfig(
      business?.depositInstructions
    )

    const updatedMethods: DepositPaymentMethodsConfig = { ...paymentMethods }
    let previousQrUrl: string | undefined

    if (method === 'nequi') {
      previousQrUrl = updatedMethods.nequiQrUrl
      updatedMethods.nequiQrUrl = uploadResult.secureUrl
    } else if (method === 'daviplata') {
      previousQrUrl = updatedMethods.daviplataQrUrl
      updatedMethods.daviplataQrUrl = uploadResult.secureUrl
    } else if (method === 'breb') {
      previousQrUrl = updatedMethods.brebQrUrl
      updatedMethods.brebQrUrl = uploadResult.secureUrl
    } else if (method === 'bank') {
      previousQrUrl = updatedMethods.bankQrUrl
      updatedMethods.bankQrUrl = uploadResult.secureUrl
    } else if (Array.isArray(updatedMethods.customMethods)) {
      const idx = updatedMethods.customMethods.findIndex((c) => c.id === method)
      if (idx !== -1) {
        previousQrUrl = updatedMethods.customMethods[idx].qrUrl
        updatedMethods.customMethods[idx].qrUrl = uploadResult.secureUrl
      }
    }

    const serialized = serializeDepositInstructionsWithConfig(
      cleanInstructions,
      updatedMethods
    )

    await prisma.business.update({
      where: { id: session.businessId },
      data: { depositInstructions: serialized },
    })

    // Limpiar QR anterior si cambió
    if (previousQrUrl && previousQrUrl !== uploadResult.secureUrl) {
      await safeDeleteTenantImage(previousQrUrl, session.businessId).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      method,
      secureUrl: uploadResult.secureUrl,
      notice:
        'Código QR cargado con éxito. Recuerda realizar un escaneo de prueba desde tu aplicación bancaria para verificar el destinatario.',
    })
  } catch (error) {
    console.error('Error al subir QR de anticipos:', error)
    return NextResponse.json(
      { error: 'No se pudo subir el código QR. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (
      !session ||
      !session.businessId ||
      (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { method, qrUrl } = await request.json()
    if (!method) {
      return NextResponse.json({ error: 'Falta especificar el medio' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { depositInstructions: true },
    })

    const { cleanInstructions, paymentMethods } = extractDepositInstructionsAndConfig(
      business?.depositInstructions
    )

    const updatedMethods: DepositPaymentMethodsConfig = { ...paymentMethods }
    let removedUrl: string | undefined

    if (method === 'nequi') {
      removedUrl = updatedMethods.nequiQrUrl
      updatedMethods.nequiQrUrl = ''
    } else if (method === 'daviplata') {
      removedUrl = updatedMethods.daviplataQrUrl
      updatedMethods.daviplataQrUrl = ''
    } else if (method === 'breb') {
      removedUrl = updatedMethods.brebQrUrl
      updatedMethods.brebQrUrl = ''
    } else if (method === 'bank') {
      removedUrl = updatedMethods.bankQrUrl
      updatedMethods.bankQrUrl = ''
    } else if (Array.isArray(updatedMethods.customMethods)) {
      const idx = updatedMethods.customMethods.findIndex((c) => c.id === method)
      if (idx !== -1) {
        removedUrl = updatedMethods.customMethods[idx].qrUrl
        updatedMethods.customMethods[idx].qrUrl = ''
      }
    }

    const serialized = serializeDepositInstructionsWithConfig(
      cleanInstructions,
      updatedMethods
    )

    await prisma.business.update({
      where: { id: session.businessId },
      data: { depositInstructions: serialized },
    })

    const urlToDelete = qrUrl || removedUrl
    if (urlToDelete) {
      await safeDeleteTenantImage(urlToDelete, session.businessId).catch(() => {})
    }

    return NextResponse.json({ success: true, method })
  } catch (error) {
    console.error('Error al eliminar QR de anticipos:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar el código QR' },
      { status: 500 }
    )
  }
}
