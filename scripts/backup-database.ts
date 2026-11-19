import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function makeBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const backupFilePath = path.join(backupDir, `backup_barberos_${timestamp}.json`)

  console.log('--- INITIATING SECURE DATABASE BACKUP ---')
  console.log('Target file:', backupFilePath)

  // Export each table's data safely
  const [
    plans,
    companies,
    businesses,
    businessPages,
    users,
    barbers,
    barberSchedules,
    barberBlocks,
    services,
    clients,
    appointments,
    payments,
    expenses,
    notes,
    cashCloses,
    chatMessages,
    branchInvitations,
    saasSubscriptions,
    planRequests,
    supportTickets,
    ticketMessages,
    platformAnnouncements,
    auditLogs,
    platformSettings,
    whatsAppIntegrations,
    whatsAppMessageLogs,
    whatsAppConversations,
    sessions,
    passkeyCredentials,
    recoveryCodes,
  ] = await Promise.all([
    prisma.plan.findMany(),
    prisma.company.findMany(),
    prisma.business.findMany(),
    prisma.businessPage.findMany(),
    prisma.user.findMany(),
    prisma.barber.findMany(),
    prisma.barberSchedule.findMany(),
    prisma.barberBlock.findMany(),
    prisma.service.findMany(),
    prisma.client.findMany(),
    prisma.appointment.findMany(),
    prisma.payment.findMany(),
    prisma.expense.findMany(),
    prisma.note.findMany(),
    prisma.cashClose.findMany(),
    prisma.chatMessage.findMany(),
    prisma.branchInvitation.findMany(),
    prisma.saaSSubscription.findMany(),
    prisma.planRequest.findMany(),
    prisma.supportTicket.findMany(),
    prisma.ticketMessage.findMany(),
    prisma.platformAnnouncement.findMany(),
    prisma.auditLog.findMany(),
    prisma.platformSetting.findMany(),
    prisma.whatsAppIntegration.findMany(),
    prisma.whatsAppMessageLog.findMany(),
    prisma.whatsAppConversation.findMany(),
    prisma.session.findMany(),
    prisma.passkeyCredential.findMany(),
    prisma.recoveryCode.findMany(),
  ])

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'Neon PostgreSQL (Production / Staging)',
      totalRecords:
        plans.length +
        companies.length +
        businesses.length +
        businessPages.length +
        users.length +
        barbers.length +
        barberSchedules.length +
        barberBlocks.length +
        services.length +
        clients.length +
        appointments.length +
        payments.length +
        expenses.length +
        notes.length +
        cashCloses.length +
        chatMessages.length +
        branchInvitations.length +
        saasSubscriptions.length +
        planRequests.length +
        supportTickets.length +
        ticketMessages.length +
        platformAnnouncements.length +
        auditLogs.length +
        platformSettings.length +
        whatsAppIntegrations.length +
        whatsAppMessageLogs.length +
        whatsAppConversations.length +
        sessions.length +
        passkeyCredentials.length +
        recoveryCodes.length,
    },
    tables: {
      Plan: plans,
      Company: companies,
      Business: businesses,
      BusinessPage: businessPages,
      User: users,
      Barber: barbers,
      BarberSchedule: barberSchedules,
      BarberBlock: barberBlocks,
      Service: services,
      Client: clients,
      Appointment: appointments,
      Payment: payments,
      Expense: expenses,
      Note: notes,
      CashClose: cashCloses,
      ChatMessage: chatMessages,
      BranchInvitation: branchInvitations,
      SaaSSubscription: saasSubscriptions,
      PlanRequest: planRequests,
      SupportTicket: supportTickets,
      TicketMessage: ticketMessages,
      PlatformAnnouncement: platformAnnouncements,
      AuditLog: auditLogs,
      PlatformSetting: platformSettings,
      WhatsAppIntegration: whatsAppIntegrations,
      WhatsAppMessageLog: whatsAppMessageLogs,
      WhatsAppConversation: whatsAppConversations,
      Session: sessions,
      PasskeyCredential: passkeyCredentials,
      RecoveryCode: recoveryCodes,
    },
  }

  const rawJson = JSON.stringify(backupData, null, 2)
  fs.writeFileSync(backupFilePath, rawJson, 'utf8')

  const stat = fs.statSync(backupFilePath)

  console.log('✅ BACKUP GENERATED SUCCESSFULLY')
  console.log('File size:', (stat.size / 1024).toFixed(2), 'KB')
  console.log('Total records backed up:', backupData.metadata.totalRecords)
  console.log('Table breakdowns:', {
    plans: plans.length,
    companies: companies.length,
    businesses: businesses.length,
    businessPages: businessPages.length,
    users: users.length,
    barbers: barbers.length,
    appointments: appointments.length,
    clients: clients.length,
    services: services.length,
    payments: payments.length,
    auditLogs: auditLogs.length,
    sessions: sessions.length,
  })

  // Self-verification: read and parse back
  const verified = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
  if (verified.metadata.totalRecords !== backupData.metadata.totalRecords) {
    throw new Error('BACKUP INTEGRITY VERIFICATION FAILED: Record count mismatch')
  }
  console.log('✅ BACKUP INTEGRITY VERIFIED (Parse test passed 100%)')

  await prisma.$disconnect()
  return backupFilePath
}

makeBackup().catch(e => {
  console.error('BACKUP FAILED:', e)
  process.exit(1)
})
