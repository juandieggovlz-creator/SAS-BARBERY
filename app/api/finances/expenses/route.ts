import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { businessId: session.businessId },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { concept, category, amount, date, paymentMethod, description } = body

    if (!concept || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Concepto y monto positivo son requeridos' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        businessId: session.businessId,
        concept,
        category: category || 'OTHER',
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'CASH',
        description
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Create Expense Error:", error)
    return NextResponse.json({ error: 'Error al registrar el gasto' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // Verify ownership
    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense || expense.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el gasto' }, { status: 500 })
  }
}
