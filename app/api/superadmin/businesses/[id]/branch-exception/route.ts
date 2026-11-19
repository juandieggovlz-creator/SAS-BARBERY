import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const key = `branch_exception_${id}`
    const setting = await prisma.platformSetting.findUnique({ where: { key } })

    if (!setting) {
      return NextResponse.json({ hasException: false })
    }

    const data = JSON.parse(setting.value)
    return NextResponse.json({ hasException: data.enabled === true, ...data })
  } catch (error) {
    console.error('branch-exception GET error:', error)
    return NextResponse.json({ hasException: false })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const notes = typeof body.notes === 'string' ? body.notes.trim() : 'Excepción temporal para pruebas'

    const key = `branch_exception_${id}`
    const value = JSON.stringify({
      enabled: true,
      grantedAt: new Date().toISOString(),
      grantedBy: session.userId,
      notes,
      businessId: id
    })

    await prisma.platformSetting.upsert({
      where: { key },
      update: { value, description: `Excepción de módulo Sedes para negocio ${id}` },
      create: { key, value, description: `Excepción de módulo Sedes para negocio ${id}` }
    })

    const business = await prisma.business.findUnique({ where: { id }, select: { name: true } })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: 'BRANCH_EXCEPTION_GRANTED',
      entity: 'Business',
      entityId: id,
      details: { businessName: business?.name || id, notes }
    })

    return NextResponse.json({
      success: true,
      message: `Excepción de Sedes concedida para ${business?.name || id}`,
      hasException: true
    })
  } catch (error) {
    console.error('branch-exception POST error:', error)
    return NextResponse.json({ error: 'Error al conceder la excepción' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const key = `branch_exception_${id}`

    const existing = await prisma.platformSetting.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ success: true, message: 'No había excepción activa', hasException: false })
    }

    const data = JSON.parse(existing.value)
    data.enabled = false
    data.revokedAt = new Date().toISOString()
    data.revokedBy = session.userId

    await prisma.platformSetting.update({
      where: { key },
      data: { value: JSON.stringify(data) }
    })

    const business = await prisma.business.findUnique({ where: { id }, select: { name: true } })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: 'BRANCH_EXCEPTION_REVOKED',
      entity: 'Business',
      entityId: id,
      details: { businessName: business?.name || id }
    })

    return NextResponse.json({
      success: true,
      message: `Excepción revocada para ${business?.name || id}`,
      hasException: false
    })
  } catch (error) {
    console.error('branch-exception DELETE error:', error)
    return NextResponse.json({ error: 'Error al revocar la excepción' }, { status: 500 })
  }
}
