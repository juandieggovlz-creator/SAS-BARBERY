import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SessionPayload } from '@/lib/auth'

export interface BranchContextOptions {
  /** Si true, permite retornar null cuando está seleccionado "Todas las sedes" (para lecturas consolidadas). Si false, hace fallback a la sede principal */
  allowNull?: boolean
  /** Parámetro explícito de sede enviado en query string o body */
  explicitBranchId?: string | null
}

/**
 * Resuelve de forma segura y blindada la sede (Business) en la cual opera la solicitud.
 *
 * Reglas de aislamiento:
 * 1. BRANCH_ADMIN: NUNCA puede suplantar otra sede. Siempre retorna su propio session.businessId.
 * 2. BARBER: Siempre opera en su session.businessId.
 * 3. OWNER / SUPER_ADMIN:
 *    - Prioridad 1: explicitBranchId si viene en la petición.
 *    - Prioridad 2: Cookie 'active_branch_id' establecida por el BranchSelector.
 *    - Validación: Verifica criptográficamente que la sede pertenezca a la empresa del propietario (companyId).
 *    - Fallback: Si no hay sede seleccionada y allowNull es false, retorna la sede principal de la empresa.
 */
export async function resolveBranchContext(
  session: SessionPayload,
  options: BranchContextOptions = {}
): Promise<{
  branchId: string | null
  isConsolidated: boolean
  isMainBranch?: boolean
}> {
  const { allowNull = false, explicitBranchId } = options

  // 1. Si es Administrador de Sede o Barbero: aislamiento forzado y estricto
  if (session.role === 'BRANCH_ADMIN' || session.role === 'BARBER') {
    return {
      branchId: session.businessId,
      isConsolidated: false
    }
  }

  // 2. Si es SUPER_ADMIN con explicitBranchId: acceso directo
  if (session.role === 'SUPER_ADMIN' && explicitBranchId) {
    return {
      branchId: explicitBranchId,
      isConsolidated: false
    }
  }

  // 3. Determinar el branchId solicitado (por query/body o por cookie)
  let requestedBranchId: string | null = explicitBranchId || null

  if (!requestedBranchId) {
    try {
      const cookieStore = await cookies()
      const cookieVal = cookieStore.get('active_branch_id')?.value
      if (cookieVal && cookieVal !== '__all__') {
        requestedBranchId = decodeURIComponent(cookieVal)
      }
    } catch {
      // Ignorar si no está en contexto de solicitud HTTP con cookies
    }
  }

  // Si no se solicitó una sede específica (o seleccionó "Todas las sedes")
  if (!requestedBranchId || requestedBranchId === '__all__') {
    if (allowNull) {
      return {
        branchId: null,
        isConsolidated: true
      }
    }

    // Si la operación requiere una sede concreta (ej. crear cita, agregar barbero),
    // resolver la sede principal (isMainBranch: true) de la empresa
    if (session.companyId) {
      const mainBranch = await prisma.business.findFirst({
        where: {
          companyId: session.companyId,
          isMainBranch: true
        },
        select: { id: true }
      })
      if (mainBranch) {
        return {
          branchId: mainBranch.id,
          isConsolidated: false,
          isMainBranch: true
        }
      }
    }

    return {
      branchId: session.businessId,
      isConsolidated: false
    }
  }

  // 4. Validar que la sede solicitada pertenezca a la empresa del propietario
  if (session.companyId) {
    const branch = await prisma.business.findUnique({
      where: { id: requestedBranchId },
      select: { id: true, companyId: true, isMainBranch: true }
    })

    if (branch && branch.companyId === session.companyId) {
      return {
        branchId: branch.id,
        isConsolidated: false,
        isMainBranch: branch.isMainBranch
      }
    }
  }

  // Fallback si la sede no pertenece a su empresa
  return {
    branchId: session.businessId,
    isConsolidated: false
  }
}

