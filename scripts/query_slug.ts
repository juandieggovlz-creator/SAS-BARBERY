import { prisma } from '../lib/prisma'

async function main() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, slug: true, phone: true }
  })
  console.log('BUSINESSES:', JSON.stringify(businesses, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
