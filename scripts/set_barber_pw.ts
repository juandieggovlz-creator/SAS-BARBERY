import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const hash = await bcrypt.hash('1234', 10)
  await prisma.user.updateMany({
    where: { email: 'carlos@barberia.com' },
    data: { password: hash }
  })
  console.log('SUCCESS: Password for carlos@barberia.com set to 1234')
}

main().catch(console.error).finally(() => process.exit(0))
