import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.barberBlock.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error deleting block' }, { status: 500 })
  }
}
