import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateRecoveryCodes } from '@/lib/crypto'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { plainCodes, hashedCodes } = await generateRecoveryCodes(8)

    await prisma.$transaction(async (tx) => {
      // Eliminar códigos anteriores
      await tx.recoveryCode.deleteMany({
        where: { userId: session.userId }
      })

      // Guardar nuevos hashes
      for (const hash of hashedCodes) {
        await tx.recoveryCode.create({
          data: {
            userId: session.userId,
            codeHash: hash
          }
        })
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          userRole: session.role,
          action: 'RECOVERY_CODES_REGENERATED',
          entity: 'User',
          entityId: session.userId,
          details: { codesCount: plainCodes.length }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Nuevos códigos de recuperación generados exitosamente. Guarda estos códigos en un lugar seguro.',
      recoveryCodes: plainCodes
    })
  } catch (error: any) {
    console.error('Generate Recovery Codes Error:', error)
    return NextResponse.json({ error: 'Error al generar códigos de recuperación' }, { status: 500 })
  }
}

