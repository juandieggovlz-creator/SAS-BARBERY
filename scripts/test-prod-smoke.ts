import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/auth'
import { createPersistentSession } from '../lib/session'

async function checkProduction() {
  const PROD = 'https://sas-barbery.vercel.app'
  console.log('Testing production deployment on:', PROD)

  // 1. Check Root & Login page
  const [rootRes, loginRes, registerRes] = await Promise.all([
    fetch(PROD + '/'),
    fetch(PROD + '/login'),
    fetch(PROD + '/register'),
  ])
  console.log('1. Root (/) Status:', rootRes.status)
  console.log('2. Login (/login) Status:', loginRes.status)
  console.log('3. Register (/register) Status:', registerRes.status)

  // 2. Super Admin verification with persistent session
  const sa = await prisma.user.findFirst({
    where: { role: { in: ['ROOT_PLATFORM_OWNER', 'SUPER_ADMIN'] }, isActive: true }
  })
  if (!sa) throw new Error('No Super Admin found in database')

  const sess = await createPersistentSession({ userId: sa.id, ipAddress: '127.0.0.1', userAgent: 'ProdSmokeCheck/2.0' })
  const token = await encrypt({
    userId: sa.id,
    role: sa.role,
    businessId: null,
    barberId: null,
    sessionId: sess.sessionId
  }, '1h')
  const cookie = `owner_session=${token}; session=${token}`

  try {
    const [saDashRes, saPlansRes] = await Promise.all([
      fetch(PROD + '/api/superadmin/dashboard', { headers: { Cookie: cookie } }),
      fetch(PROD + '/api/superadmin/plans', { headers: { Cookie: cookie } })
    ])

    const dashData = await saDashRes.json()
    const plansData = await saPlansRes.json()

    console.log('4. Super Admin API Dashboard Status:', saDashRes.status, '| Businesses in Prod:', dashData.metrics?.totalBusinesses)
    console.log('5. Super Admin API Plans Status:', saPlansRes.status, '| Core Plans:', plansData.plans?.length)
    console.log('6. Master Super Admin preserved:', sa.email, `(${sa.role})`)
  } finally {
    await prisma.session.delete({ where: { id: sess.sessionId } }).catch(() => {})
    await prisma.$disconnect()
  }
}

checkProduction().catch(e => {
  console.error('Production Smoke Test Error:', e)
  process.exit(1)
})
