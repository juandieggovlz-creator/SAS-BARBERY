import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateTotpSecret, getTotpUri, generateTotpQrCodeDataUrl } from '@/lib/totp'
import { encryptData } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generar secreto Base32 de 20 bytes (160 bits)
    const secretBase32 = generateTotpSecret()
    const encryptedSecret = encryptData(secretBase32)

    // Guardar temporalmente el secreto cifrado con mfaEnabled = false hasta confirmación del primer código
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: encryptedSecret,
      }
    })

    const otpauthUrl = getTotpUri('BarberOS Platform', user.email, secretBase32)
    const qrCodeDataUrl = await generateTotpQrCodeDataUrl(otpauthUrl)

    return NextResponse.json({
      success: true,
      qrCodeDataUrl,
      secretBase32,
      otpauthUrl
    })
  } catch (error: any) {
    console.error('TOTP Setup Error:', error)
    return NextResponse.json({ error: 'Error al iniciar configuración TOTP' }, { status: 500 })
  }
}

