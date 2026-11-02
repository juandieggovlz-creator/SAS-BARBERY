import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export interface BusinessPermissions {
  webpage: boolean
  reports: boolean
  finances: boolean
  chat: boolean
  analytics: boolean
}

const DEFAULT_PERMISSIONS: BusinessPermissions = {
  webpage: true,
  reports: true,
  finances: true,
  chat: true,
  analytics: true
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const settingKey = `permissions_${id}`

    const setting = await prisma.platformSetting.findUnique({
      where: { key: settingKey }
    })

    if (!setting) {
      return NextResponse.json({ permissions: DEFAULT_PERMISSIONS })
    }

    const permissions = JSON.parse(setting.value)
    return NextResponse.json({ permissions: { ...DEFAULT_PERMISSIONS, ...permissions } })
  } catch (error) {
    console.error('Error fetching business permissions:', error)
    return NextResponse.json({ permissions: DEFAULT_PERMISSIONS })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { permissions } = body

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Permisos no válidos' }, { status: 400 })
    }

    const settingKey = `permissions_${id}`
    const merged = { ...DEFAULT_PERMISSIONS, ...permissions }

    await prisma.platformSetting.upsert({
      where: { key: settingKey },
      update: {
        value: JSON.stringify(merged),
        description: `Permisos de módulos para la barbería ${id}`
      },
      create: {
        key: settingKey,
        value: JSON.stringify(merged),
        description: `Permisos de módulos para la barbería ${id}`
      }
    })

    const business = await prisma.business.findUnique({ where: { id }, select: { name: true } })

    // Record audit log
    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: 'PERMISSIONS_UPDATED',
      entity: 'Business',
      entityId: id,
      details: {
        businessName: business?.name || id,
        newPermissions: merged
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Permisos actualizados correctamente',
      permissions: merged
    })
  } catch (error) {
    console.error('Error updating business permissions:', error)
    return NextResponse.json({ error: 'Error al guardar permisos' }, { status: 500 })
  }
}
