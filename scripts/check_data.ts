import { prisma } from '../lib/prisma'

async function main() {
  const barbers = await prisma.barber.findMany({
    include: { schedules: true, user: true }
  })
  console.log('EXISTING BARBERS:', JSON.stringify(barbers, null, 2))

  const services = await prisma.service.findMany()
  console.log('EXISTING SERVICES:', JSON.stringify(services, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
