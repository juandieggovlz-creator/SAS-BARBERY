import { prisma } from '../lib/prisma'

async function main() {
  const updated = await prisma.appointment.updateMany({
    where: { status: 'CONFIRMED' },
    data: { status: 'PENDING' }
  })
  console.log(`Updated ${updated.count} appointments from CONFIRMED to PENDING`)
}

main().catch(console.error).finally(() => process.exit(0))
