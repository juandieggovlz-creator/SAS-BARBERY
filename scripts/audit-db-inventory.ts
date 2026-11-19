import { prisma } from '../lib/prisma'
import { URL } from 'url'

async function audit() {
  const dbUrl = process.env.DATABASE_URL || ''
  let host = 'unknown'
  let dbName = 'unknown'
  try {
    const parsed = new URL(dbUrl)
    host = parsed.host
    dbName = parsed.pathname.replace(/^\//, '')
  } catch (e) {}

  console.log('=== DATABASE ENVIRONMENT AUDIT ===')
  console.log('Host:', host)
  console.log('Database:', dbName)
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development')

  // Super Admins
  const superAdminsRaw = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ROOT_PLATFORM_OWNER'] } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      phoneNumber: true,
      businessId: true,
      password: true,
      mfaEnabled: true,
      lastLoginAt: true,
    },
  })
  const superAdmins = superAdminsRaw.map(sa => ({
    ...sa,
    hasPassword: Boolean(sa.password && sa.password.length > 0),
    passwordHashLength: sa.password ? sa.password.length : 0,
    password: '[PROTECTED_HASH_PRESERVED]',
  }))

  // All Users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // All Businesses
  const allBusinesses = await prisma.business.findMany({
    include: {
      plan: { select: { id: true, slug: true, name: true } },
      company: { select: { id: true, name: true } },
      users: { select: { id: true, email: true, name: true, role: true } },
      barbers: { select: { id: true, name: true, phone: true, status: true } },
      saasSubscriptions: { select: { id: true, status: true, planId: true, currentPeriodEnd: true } },
      _count: {
        select: {
          appointments: true,
          clients: true,
          services: true,
          barbers: true,
          users: true,
          payments: true,
          expenses: true,
          chatMessages: true,
          supportTickets: true,
          auditLogs: true,
          invitations: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Companies
  const allCompanies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          branches: true,
          users: true,
        },
      },
    },
  })

  // Plans
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      isActive: true,
      maxBarbers: true,
      allowsMultiBranch: true,
      includedBranches: true,
      features: true,
    },
    orderBy: { price: 'asc' },
  })

  // Platform settings
  const platformSettings = await prisma.platformSetting.findMany()

  // Tables metrics
  const totalAppointments = await prisma.appointment.count()
  const totalClients = await prisma.client.count()
  const totalServices = await prisma.service.count()
  const totalSubscriptions = await prisma.saaSSubscription.count()
  const totalSessions = await prisma.session.count()
  const totalAuditLogs = await prisma.auditLog.count()
  const totalBarbers = await prisma.barber.count()
  const totalPayments = await prisma.payment.count()
  const totalExpenses = await prisma.expense.count()
  const totalNotes = await prisma.note.count()
  const totalCashCloses = await prisma.cashClose.count()
  const totalChatMessages = await prisma.chatMessage.count()
  const totalTickets = await prisma.supportTicket.count()
  const totalAnnouncements = await prisma.platformAnnouncement.count()

  console.log('\n=== SUPER ADMIN ACCOUNTS (TO PRESERVE 100%) ===')
  console.log(JSON.stringify(superAdmins, null, 2))

  console.log(`\n=== ALL USERS IN DB (${allUsers.length}) ===`)
  console.log(JSON.stringify(allUsers, null, 2))

  console.log(`\n=== ALL BUSINESSES / BRANCHES IN DB (${allBusinesses.length}) ===`)
  console.log(JSON.stringify(allBusinesses, null, 2))

  console.log(`\n=== ALL COMPANIES IN DB (${allCompanies.length}) ===`)
  console.log(JSON.stringify(allCompanies, null, 2))

  console.log(`\n=== CORE PLANS (${plans.length}) (TO PRESERVE 100%) ===`)
  console.log(JSON.stringify(plans, null, 2))

  console.log('\n=== GLOBAL RECORD COUNTS ===')
  console.log({
    users: allUsers.length,
    superAdmins: superAdmins.length,
    companies: allCompanies.length,
    businesses: allBusinesses.length,
    barbers: totalBarbers,
    appointments: totalAppointments,
    clients: totalClients,
    services: totalServices,
    payments: totalPayments,
    expenses: totalExpenses,
    notes: totalNotes,
    cashCloses: totalCashCloses,
    chatMessages: totalChatMessages,
    supportTickets: totalTickets,
    subscriptions: totalSubscriptions,
    sessions: totalSessions,
    auditLogs: totalAuditLogs,
    platformAnnouncements: totalAnnouncements,
    platformSettings: platformSettings.length,
    plans: plans.length,
  })

  await prisma.$disconnect()
}

audit().catch(e => {
  console.error('Audit Error:', e)
  process.exit(1)
})
