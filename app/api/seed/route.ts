import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await prisma.payment.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.note.deleteMany()
    await prisma.appointment.deleteMany()
    await prisma.service.deleteMany()
    await prisma.user.deleteMany()
    await prisma.barber.deleteMany()
    await prisma.client.deleteMany()
    await prisma.business.deleteMany()

    const business = await prisma.business.create({
      data: { 
        name: "Barbería Elite SAS", 
        slug: "barberia-elite",
        phone: "+57 300 123 4567",
        address: "Calle 85 # 14-20, Bogotá",
        description: "Barbería clásica y moderna con atención personalizada de alto nivel.",
        email: "contacto@barberiaelite.com"
      }
    })

    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Admin Owner
    await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'OWNER',
        businessId: business.id
      }
    })

    // Barbers
    const b1 = await prisma.barber.create({ 
      data: { 
        name: "Carlos 'The Blade' Ruiz", 
        phone: "+57 311 111 2233",
        commission: 40,
        status: 'ACTIVE',
        specialty: "Degradados & Barba",
        businessId: business.id 
      } 
    })
    await prisma.user.create({
      data: {
        email: 'carlos@barberia.com',
        password: hashedPassword,
        role: 'BARBER',
        businessId: business.id,
        barberId: b1.id
      }
    })

    const b2 = await prisma.barber.create({ 
      data: { 
        name: "Mateo Estilista", 
        phone: "+57 312 222 3344",
        commission: 35,
        status: 'ACTIVE',
        specialty: "Corte Clásico & Tijera",
        businessId: business.id 
      } 
    })
    await prisma.user.create({
      data: {
        email: 'mateo@barberia.com',
        password: hashedPassword,
        role: 'BARBER',
        businessId: business.id,
        barberId: b2.id
      }
    })

    const s1 = await prisma.service.create({
      data: { name: "Corte Clásico", duration: 30, price: 35000, businessId: business.id }
    })
    const s2 = await prisma.service.create({
      data: { name: "Barba & Toalla Caliente", duration: 20, price: 25000, businessId: business.id }
    })
    const s3 = await prisma.service.create({
      data: { name: "Combo Elite (Corte + Barba)", duration: 50, price: 55000, businessId: business.id }
    })

    const c1 = await prisma.client.create({ data: { name: "Juan Perez", phone: "3001234567", email: "juan.perez@gmail.com", businessId: business.id } })
    const c2 = await prisma.client.create({ data: { name: "Andres Gomez", phone: "3109876543", email: "andres.gomez@hotmail.com", businessId: business.id } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const a1 = await prisma.appointment.create({
      data: { 
        businessId: business.id,
        clientId: c1.id, 
        barberId: b1.id, 
        serviceId: s1.id, 
        date: new Date(today.getTime() + 10 * 60 * 60 * 1000), 
        status: 'CONFIRMED',
        paymentMethod: 'CASH'
      }
    })
    await prisma.appointment.create({
      data: { 
        businessId: business.id,
        clientId: c2.id, 
        barberId: b2.id, 
        serviceId: s2.id, 
        date: new Date(today.getTime() + 11 * 60 * 60 * 1000), 
        status: 'PENDING' 
      }
    })

    await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: a1.id,
        amount: 35000,
        method: 'CASH',
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({ message: "Seeding con usuarios completado con éxito" })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al ejecutar seed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

