import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { verifyTotpCode } from '@/lib/totp'
import { decryptData, generateRecoveryCodes } from '@/lib/crypto'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Debes ingresar el código de 6 dígitos mostrado en tu aplicación' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: 'No hay ninguna configuración TOTP en proceso' }, { status: 400 })
    }

    const secretBase32 = decryptData(user.mfaSecret)
    const verification = verifyTotpCode(secretBase32, code.trim(), 1)

    if (!verification.valid) {
      return NextResponse.json({ error: 'Código de 6 dígitos incorrecto. Asegúrate de haber guardado la cuenta en tu autenticador.' }, { status: 400 })
    }

    // 1. Generar 8 códigos de recuperación de un solo uso
    const { plainCodes, hashedCodes } = await generateRecoveryCodes(8)

    // 2. Transacción atómica: Guardar códigos de recuperación y activar MFA
    await prisma.$transaction(async (tx) => {
      // Invalidar códigos de recuperación anteriores si existieran
      await tx.recoveryCode.deleteMany({
        where: { userId: user.id }
      })

      // Insertar nuevos códigos de recuperación
      for (const hash of hashedCodes) {
        await tx.recoveryCode.create({
          data: {
            userId: user.id,
            codeHash: hash
          }
        })
      }

      // Activar MFA en el usuario
      await tx.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaConfirmedAt: new Date(),
          lastMfaUsedAt: new Date()
        }
      })

      // Registrar auditoría inmutable
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.email,
          userRole: user.role,
          action: 'TOTP_MFA_ACTIVATED',
          entity: 'User',
          entityId: user.id,
          details: { recoveryCodesCount: plainCodes.length }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Autenticación en dos pasos (TOTP) activada exitosamente.',
      recoveryCodes: plainCodes
    })
  } catch (error: any) {
    console.error('Verify TOTP Setup Error:', error)
    return NextResponse.json({ error: 'Error al confirmar configuración TOTP' }, { status: 500 })
  }
}

