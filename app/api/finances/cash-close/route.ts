import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/finances/cash-close — Historial de cierres del negocio
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const businessId = session.businessId

  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)
  const skip = parseInt(searchParams.get('skip') || '0')

  try {
    const [closures, total] = await Promise.all([
      prisma.cashClose.findMany({
        where: { businessId },
        orderBy: { closedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.cashClose.count({ where: { businessId } })
    ])

    return NextResponse.json({ closures, total, limit, skip })
  } catch (error) {
    console.error('GET CashClose Error:', error)
    return NextResponse.json({ error: 'Error al obtener historial de cierres' }, { status: 500 })
  }
}

// POST /api/finances/cash-close — Guardar un cierre de caja
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const businessId = session.businessId

  try {
    const body = await request.json()

    const {
      periodFrom,
      periodTo,
      periodLabel,
      totalCash,
      totalTransfer,
      totalCard,
      totalOther,
      totalReceived,
      expensesCash,
      expensesDigital,
      totalExpenses,
      cashExpected,
      cashCounted,
      cashDifference,
      pendingTotal,
      pendingCount,
      differenceReason,
      observations
    } = body

    if (!periodFrom || !periodTo || !periodLabel) {
      return NextResponse.json({ error: 'Faltan datos del período del cierre' }, { status: 400 })
    }

    const closure = await prisma.cashClose.create({
      data: {
        businessId,
        closedById: session.userId || 'unknown',
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
        periodLabel,
        totalCash: totalCash || 0,
        totalTransfer: totalTransfer || 0,
        totalCard: totalCard || 0,
        totalOther: totalOther || 0,
        totalReceived: totalReceived || 0,
        expensesCash: expensesCash || 0,
        expensesDigital: expensesDigital || 0,
        totalExpenses: totalExpenses || 0,
        cashExpected: cashExpected || 0,
        cashCounted: cashCounted || 0,
        cashDifference: cashDifference || 0,
        pendingTotal: pendingTotal || 0,
        pendingCount: pendingCount || 0,
        differenceReason: differenceReason || null,
        observations: observations || null
      }
    })

    return NextResponse.json({ success: true, closure })
  } catch (error) {
    console.error('POST CashClose Error:', error)
    return NextResponse.json({ error: 'Error al guardar el cierre de caja' }, { status: 500 })
  }
}
