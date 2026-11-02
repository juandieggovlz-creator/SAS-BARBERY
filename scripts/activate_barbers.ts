import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const barbers = await prisma.barber.findMany()

  for (const b of barbers) {
    // Set status to ACTIVE
    await prisma.barber.update({
      where: { id: b.id },
      data: { status: 'ACTIVE' }
    })

    // Delete any old schedules
    await prisma.barberSchedule.deleteMany({
      where: { barberId: b.id }
    })

    // Create default working schedules for 0-6 (Sun-Sat)
    const defaultSchedules = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true }, // Sun
      { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true }, // Mon
      { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true }, // Tue
      { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true }, // Wed
      { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true }, // Thu
      { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true }, // Fri
      { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true }, // Sat
    ]

    for (const sched of defaultSchedules) {
      await prisma.barberSchedule.create({
        data: {
          barberId: b.id,
          ...sched
        }
      })
    }

    console.log(`Activated & added 7-day schedule for barber: ${b.name}`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
