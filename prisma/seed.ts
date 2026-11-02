import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  // Limpiar base de datos
  await prisma.payment.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.note.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
  await prisma.barber.deleteMany()
  await prisma.client.deleteMany()
  await prisma.business.deleteMany()

  // 1. Crear Business (Barbería)
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

  // 1.1 Crear Usuario OWNER para el negocio
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'OWNER',
      businessId: business.id
    }
  })

  // 1.2 Crear Usuario SUPER_ADMIN de la plataforma
  const superAdminHash = await bcrypt.hash('superadmin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@barberos.co',
      password: superAdminHash,
      role: 'SUPER_ADMIN',
      businessId: null
    }
  })


  // 2. Crear Barberos con sus respectivos Usuarios y Comisiones
  const b1_email = "carlos@barberia.com"
  const barber1 = await prisma.barber.create({
    data: { 
      name: "Carlos 'The Blade' Ruiz", 
      phone: "+57 311 111 2233",
      commission: 40, // 40% comisión
      specialty: "Degradados & Barba",
      businessId: business.id,
    }
  })
  await prisma.user.create({
    data: {
      email: b1_email,
      password: hashedPassword,
      role: 'BARBER',
      businessId: business.id,
      barberId: barber1.id
    }
  })

  const b2_email = "mateo@barberia.com"
  const barber2 = await prisma.barber.create({
    data: { 
      name: "Mateo Estilista", 
      phone: "+57 312 222 3344",
      commission: 35,
      specialty: "Corte Clásico & Tijera",
      businessId: business.id,
    }
  })
  await prisma.user.create({
    data: {
      email: b2_email,
      password: hashedPassword,
      role: 'BARBER',
      businessId: business.id,
      barberId: barber2.id
    }
  })

  const b3_email = "julian@barberia.com"
  const barber3 = await prisma.barber.create({
    data: { 
      name: "Julian Fade Master", 
      phone: "+57 313 333 4455",
      commission: 40,
      specialty: "Diseños & Fade",
      businessId: business.id,
    }
  })
  await prisma.user.create({
    data: {
      email: b3_email,
      password: hashedPassword,
      role: 'BARBER',
      businessId: business.id,
      barberId: barber3.id
    }
  })

  // 3. Crear Servicios
  const s1 = await prisma.service.create({
    data: { name: "Corte Clásico", category: "Cortes", description: "Corte de cabello tradicional con terminado a navaja.", duration: 30, price: 35000, businessId: business.id }
  })
  const s2 = await prisma.service.create({
    data: { name: "Barba & Toalla Caliente", category: "Barba", description: "Ritual completo de perfilado y tratamiento de barba con toalla vaporizada.", duration: 20, price: 25000, businessId: business.id }
  })
  const s3 = await prisma.service.create({
    data: { name: "Combo Elite (Corte + Barba)", category: "Combos", description: "Experiencia completa de corte premium y arreglo de barba.", duration: 50, price: 55000, businessId: business.id }
  })
  const s4 = await prisma.service.create({
    data: { name: "Diseño & Hair Tattoo", category: "Especiales", description: "Diseños personalizados trazados a navaja.", duration: 30, price: 30000, businessId: business.id }
  })

  // 4. Crear Clientes
  const c1 = await prisma.client.create({ data: { name: "Juan Perez", phone: "3001234567", email: "juan.perez@gmail.com", internalNotes: "Prefiere degradado bajo y café sin azúcar.", businessId: business.id } })
  const c2 = await prisma.client.create({ data: { name: "Andres Gomez", phone: "3109876543", email: "andres.gomez@hotmail.com", internalNotes: "Suele llegar 5 min antes.", businessId: business.id } })
  const c3 = await prisma.client.create({ data: { name: "Ricardo Sossa", phone: "3201112233", email: "ricardo.sossa@yahoo.com", businessId: business.id } })
  const c4 = await prisma.client.create({ data: { name: "Luis Martinez", phone: "3005556677", email: "luis.martinez@outlook.com", businessId: business.id } })

  // 5. Crear Citas y Pagos para HOY
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const appointmentsData = [
    { 
      businessId: business.id,
      clientId: c1.id, barberId: barber1.id, serviceId: s1.id, 
      date: new Date(today.getTime() + 10 * 60 * 60 * 1000),
      status: 'CONFIRMED' as const,
      paymentMethod: 'CASH' as const
    },
    { 
      businessId: business.id,
      clientId: c2.id, barberId: barber2.id, serviceId: s2.id, 
      date: new Date(today.getTime() + 11 * 60 * 60 * 1000),
      status: 'PENDING' as const
    },
    { 
      businessId: business.id,
      clientId: c3.id, barberId: barber3.id, serviceId: s3.id, 
      date: new Date(today.getTime() + 12 * 60 * 60 * 1000),
      status: 'COMPLETED' as const,
      paymentMethod: 'TRANSFER' as const,
      paidAt: new Date(today.getTime() + 12 * 50 * 60 * 1000)
    },
    { 
      businessId: business.id,
      clientId: c4.id, barberId: barber1.id, serviceId: s4.id, 
      date: new Date(today.getTime() + 15 * 60 * 60 * 1000),
      status: 'PENDING' as const
    }
  ]

  for (const apptData of appointmentsData) {
    const appt = await prisma.appointment.create({ data: apptData })
    if (apptData.status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          businessId: business.id,
          appointmentId: appt.id,
          amount: 55000,
          method: 'TRANSFER',
          status: 'COMPLETED'
        }
      })
    }
  }

  // 6. Crear Gastos de Prueba
  await prisma.expense.createMany({
    data: [
      { businessId: business.id, concept: "Arriendo local local 101", category: "RENT", amount: 1500000, date: today, paymentMethod: "TRANSFER", description: "Pago mensual de arriendo." },
      { businessId: business.id, concept: "Productos capilares & ceras", category: "SUPPLIES", amount: 280000, date: today, paymentMethod: "CASH", description: "Reposición de ceras y pomadas." },
      { businessId: business.id, concept: "Servicios públicos (Energía + Agua)", category: "UTILITIES", amount: 190000, date: today, paymentMethod: "TRANSFER", description: "Factura de servicios." }
    ]
  })

  // 7. Crear Notas de Prueba
  await prisma.note.createMany({
    data: [
      { businessId: business.id, title: "Comprar máquinas de afeitar nuevas", content: "Cotizar Wahl Detailer y Wahl Magic Clip con el proveedor principal.", isPinned: true },
      { businessId: business.id, title: "Mantenimiento aire acondicionado", content: "Programar cita con el técnico para la próxima semana.", isPinned: false }
    ]
  })

  console.log("Seeding con datos financieros completado con éxito.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
