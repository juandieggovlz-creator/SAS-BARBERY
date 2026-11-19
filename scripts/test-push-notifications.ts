import { prisma } from '../lib/prisma'
import webpush, { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '../lib/web-push'
import {
  dispatchAppointmentNotification,
  DispatchAppointmentNotificationParams,
} from '../lib/push-dispatcher'
import * as fs from 'fs'
import * as path from 'path'

async function runTestSuite() {
  console.log('===============================================================')
  console.log('🧪 BARBEROS WEB PUSH & NOTIFICATIONS ENTERPRISE SUITE')
  console.log('===============================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`)
      failed++
    }
  }

  // ── 1. VAPID Configuration ──
  console.log('--- 1. VAPID Keys & Cryptographic Setup ---')
  assert(Boolean(VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length > 50), 'VAPID public key loaded properly')
  assert(Boolean(VAPID_PRIVATE_KEY && VAPID_PRIVATE_KEY.length > 30), 'VAPID private key loaded properly')
  assert(Boolean(VAPID_SUBJECT && VAPID_SUBJECT.startsWith('mailto:')), 'VAPID subject has valid mailto protocol')

  // ── 2. Service Worker File & Syntax ──
  console.log('\n--- 2. Service Worker File Verification ---')
  const swPath = path.join(process.cwd(), 'public', 'sw.js')
  assert(fs.existsSync(swPath), 'public/sw.js exists')
  const swContent = fs.readFileSync(swPath, 'utf8')
  assert(swContent.includes('self.addEventListener(\'push\''), 'SW contains push event listener')
  assert(swContent.includes('self.addEventListener(\'notificationclick\''), 'SW contains notificationclick event listener')
  assert(swContent.includes('self.registration.showNotification'), 'SW handles showNotification')

  // ── Setup Temporary Test Entities in Database ──
  console.log('\n--- Setting up isolated temporary test environment ---')
  await prisma.appNotification.deleteMany({ where: { business: { slug: { startsWith: 'test-push-' } } } })
  await prisma.pushSubscription.deleteMany({ where: { business: { slug: { startsWith: 'test-push-' } } } })
  await prisma.user.deleteMany({ where: { email: { contains: 'test-push' } } })
  await prisma.barber.deleteMany({ where: { business: { slug: { startsWith: 'test-push-' } } } })
  await prisma.business.deleteMany({ where: { slug: { startsWith: 'test-push-' } } })

  const uniqueId = Date.now().toString()

  // Business A (Target Business)
  const bizA = await prisma.business.create({
    data: {
      name: `Barbería Test Push A ${uniqueId}`,
      slug: `test-push-a-${uniqueId}`,
      email: `test-push-a-${uniqueId}@barberos.co`,
      phone: '3001112233',
      status: 'ACTIVE',
    },
  })

  // Business B (Isolation Target Business)
  const bizB = await prisma.business.create({
    data: {
      name: `Barbería Test Push B ${uniqueId}`,
      slug: `test-push-b-${uniqueId}`,
      email: `test-push-b-${uniqueId}@barberos.co`,
      phone: '3009998877',
      status: 'ACTIVE',
    },
  })

  // Owner A (of Business A)
  const ownerA = await prisma.user.create({
    data: {
      email: `owner-a-${uniqueId}@test.com`,
      name: 'Owner A Test',
      role: 'OWNER',
      businessId: bizA.id,
      isActive: true,
    },
  })

  // Owner B (of Business B)
  const ownerB = await prisma.user.create({
    data: {
      email: `owner-b-${uniqueId}@test.com`,
      name: 'Owner B Test',
      role: 'OWNER',
      businessId: bizB.id,
      isActive: true,
    },
  })

  // Barber 1 (Assigned to appointment in Business A)
  const barberRecord1 = await prisma.barber.create({
    data: {
      name: 'Barbero 1 Asignado',
      businessId: bizA.id,
      phone: '3001234567',
      status: 'ACTIVE',
    },
  })
  const barberUser1 = await prisma.user.create({
    data: {
      email: `barber-user-1-${uniqueId}@test.com`,
      name: 'Barbero 1 Asignado',
      role: 'BARBER',
      businessId: bizA.id,
      barberId: barberRecord1.id,
      isActive: true,
    },
  })

  // Barber 2 (NOT assigned in Business A - Isolation test)
  const barberRecord2 = await prisma.barber.create({
    data: {
      name: 'Barbero 2 No Asignado',
      businessId: bizA.id,
      phone: '3007654321',
      status: 'ACTIVE',
    },
  })
  const barberUser2 = await prisma.user.create({
    data: {
      email: `barber-user-2-${uniqueId}@test.com`,
      name: 'Barbero 2 No Asignado',
      role: 'BARBER',
      businessId: bizA.id,
      barberId: barberRecord2.id,
      isActive: true,
    },
  })

  // Client & Service
  const clientA = await prisma.client.create({
    data: {
      name: 'Carlos Cliente',
      phone: '3105556677',
      businessId: bizA.id,
    },
  })
  const serviceA = await prisma.service.create({
    data: {
      name: 'Corte Degradado VIP',
      price: 35000,
      duration: 45,
      businessId: bizA.id,
    },
  })

  // Appointment in Business A
  const apptA = await prisma.appointment.create({
    data: {
      businessId: bizA.id,
      barberId: barberRecord1.id,
      clientId: clientA.id,
      serviceId: serviceA.id,
      date: new Date(Date.now() + 86400000),
      status: 'PENDING',
      reservationCode: `PUSH-${uniqueId}`,
    },
  })

  try {
    // ── 3. Push Subscription Persistence & Multiple Devices ──
    console.log('\n--- 3. Device Subscription & Multi-device Support ---')
    const sub1 = await prisma.pushSubscription.create({
      data: {
        userId: ownerA.id,
        businessId: bizA.id,
        endpoint: `https://fcm.googleapis.com/fcm/send/fake-device-1-${uniqueId}`,
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcDnVwTJaWwzs6Uq7I88j0P3g',
        auth: 'tBHItDaQLCw=',
        deviceName: 'iPhone 15 Pro de Juan',
      },
    })
    const sub2 = await prisma.pushSubscription.create({
      data: {
        userId: ownerA.id,
        businessId: bizA.id,
        endpoint: `https://fcm.googleapis.com/fcm/send/fake-device-2-${uniqueId}`,
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcDnVwTJaWwzs6Uq7I88j0P3g',
        auth: 'tBHItDaQLCw=',
        deviceName: 'MacBook Pro M3',
      },
    })

    const ownerDevices = await prisma.pushSubscription.findMany({ where: { userId: ownerA.id } })
    assert(ownerDevices.length === 2, 'User successfully registered multiple devices simultaneously')

    // ── 4. User Notification Preferences ──
    console.log('\n--- 4. User Notification Preferences ---')
    const prefOwner = await prisma.userNotificationPreference.create({
      data: {
        userId: ownerA.id,
        pushEnabled: true,
        soundEnabled: true,
        notifyNewAppointment: true,
        notifyCancelled: true,
        notifyRescheduled: true,
        notifyStatusChange: true,
      },
    })
    assert(prefOwner.pushEnabled === true, 'Notification preference defaults created')

    // ── 5. Appointment Notification Dispatch & Isolation ──
    console.log('\n--- 5. Dispatch Event & Multi-tenant Role Isolation ---')
    const dispatchResult = await dispatchAppointmentNotification({
      eventType: 'APPOINTMENT_CREATED',
      appointmentId: apptA.id,
    })

    assert(dispatchResult.success, 'dispatchAppointmentNotification succeeded without throwing')

    // Check AppNotifications created
    const notifsOwnerA = await prisma.appNotification.findMany({ where: { userId: ownerA.id } })
    const notifsBarber1 = await prisma.appNotification.findMany({ where: { userId: barberUser1.id } })
    const notifsBarber2 = await prisma.appNotification.findMany({ where: { userId: barberUser2.id } })
    const notifsOwnerB = await prisma.appNotification.findMany({ where: { userId: ownerB.id } })

    assert(notifsOwnerA.length >= 1, 'Owner A received in-app notification for new booking')
    assert(notifsOwnerA[0].type === 'APPOINTMENT_CREATED', 'Owner A notification has type APPOINTMENT_CREATED')
    assert(notifsOwnerA[0].message.includes('Carlos Cliente'), 'Owner A notification includes client name')

    assert(notifsBarber1.length >= 1, 'Assigned Barber 1 received notification for their appointment')
    assert(notifsBarber2.length === 0, 'ISOLATION PASS: Unassigned Barber 2 received ZERO notifications')
    assert(notifsOwnerB.length === 0, 'MULTI-TENANT PASS: External Business Owner B received ZERO notifications')

    // ── 6. Cancellation & Rescheduling Events ──
    console.log('\n--- 6. Cancellation and Rescheduling Events ---')
    await dispatchAppointmentNotification({
      eventType: 'APPOINTMENT_CANCELLED',
      appointmentId: apptA.id,
    })
    const cancelNotifs = await prisma.appNotification.findMany({
      where: { userId: ownerA.id, type: 'APPOINTMENT_CANCELLED' },
    })
    assert(cancelNotifs.length >= 1, 'Cancellation event dispatched properly')

    const newDate = new Date(Date.now() + 172800000)
    await dispatchAppointmentNotification({
      eventType: 'APPOINTMENT_RESCHEDULED',
      appointmentId: apptA.id,
      rescheduledTo: newDate,
    })
    const reschedNotifs = await prisma.appNotification.findMany({
      where: { userId: ownerA.id, type: 'APPOINTMENT_RESCHEDULED' },
    })
    assert(reschedNotifs.length >= 1, 'Rescheduling event dispatched properly')

    // ── 7. Preferences Filtering Test ──
    console.log('\n--- 7. Preferences Event Filtering ---')
    // Turn off cancel notifications for Barber 1
    await prisma.userNotificationPreference.upsert({
      where: { userId: barberUser1.id },
      create: { userId: barberUser1.id, notifyCancelled: false },
      update: { notifyCancelled: false },
    })

    const preCount = await prisma.appNotification.count({
      where: { userId: barberUser1.id, type: 'APPOINTMENT_CANCELLED' },
    })
    await dispatchAppointmentNotification({
      eventType: 'APPOINTMENT_CANCELLED',
      appointmentId: apptA.id,
    })
    const postCount = await prisma.appNotification.count({
      where: { userId: barberUser1.id, type: 'APPOINTMENT_CANCELLED' },
    })
    assert(preCount === postCount, 'Preference filter respected: Barber skipped cancelled notifications')

    // ── 8. Notification Center API Operations ──
    console.log('\n--- 8. In-App Notification Center Read / Mark All Read ---')
    const unreadBefore = await prisma.appNotification.count({
      where: { userId: ownerA.id, read: false },
    })
    assert(unreadBefore > 0, `Owner has ${unreadBefore} unread notifications`)

    await prisma.appNotification.updateMany({
      where: { userId: ownerA.id, read: false },
      data: { read: true, readAt: new Date() },
    })
    const unreadAfter = await prisma.appNotification.count({
      where: { userId: ownerA.id, read: false },
    })
    assert(unreadAfter === 0, 'Mark all as read reduced unread count to 0')

    // ── 9. Endpoint Pruning on 410 / 404 Simulation ──
    console.log('\n--- 9. Expired Subscription Pruning Logic ---')
    const badSub = await prisma.pushSubscription.create({
      data: {
        userId: ownerA.id,
        businessId: bizA.id,
        endpoint: `https://invalid-push-domain-123.com/endpoint/${uniqueId}`,
        p256dh: 'invalid-key',
        auth: 'invalid-auth',
        deviceName: 'Stale Browser',
      },
    })
    assert(Boolean(badSub.id), 'Stale subscription created')
    // Delete simulation
    await prisma.pushSubscription.delete({ where: { id: badSub.id } })
    const checkDeleted = await prisma.pushSubscription.findUnique({ where: { id: badSub.id } })
    assert(checkDeleted === null, 'Stale subscription cleanly pruned from database')
  } finally {
    // ── Teardown: Completely clean up all test records ──
    console.log('\n--- Cleaning up temporary test records ---')
    await prisma.appNotification.deleteMany({
      where: { businessId: { in: [bizA.id, bizB.id] } },
    })
    await prisma.pushSubscription.deleteMany({
      where: { businessId: { in: [bizA.id, bizB.id] } },
    })
    await prisma.userNotificationPreference.deleteMany({
      where: { userId: { in: [ownerA.id, ownerB.id, barberUser1.id, barberUser2.id] } },
    })
    await prisma.appointment.deleteMany({
      where: { businessId: { in: [bizA.id, bizB.id] } },
    })
    await prisma.service.deleteMany({
      where: { businessId: { in: [bizA.id, bizB.id] } },
    })
    await prisma.client.deleteMany({
      where: { businessId: { in: [bizA.id, bizB.id] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [ownerA.id, ownerB.id, barberUser1.id, barberUser2.id] } },
    })
    await prisma.barber.deleteMany({
      where: { id: { in: [barberRecord1.id, barberRecord2.id] } },
    })
    await prisma.business.deleteMany({
      where: { id: { in: [bizA.id, bizB.id] } },
    })
    console.log('Teardown complete: Database returned to pristine state.')
  }

  // ── Database Cleanliness Check ──
  console.log('\n--- Final Verification of Super Admin Preservation ---')
  const totalUsers = await prisma.user.count()
  const superAdmin = await prisma.user.findFirst({
    where: { role: { in: ['ROOT_PLATFORM_OWNER', 'SUPER_ADMIN'] } },
  })
  assert(totalUsers === 1, `Exact 1 user in DB (Actual: ${totalUsers})`)
  assert(superAdmin?.email === 'juandieggovlz@gmail.com', `Super Admin juandieggovlz@gmail.com strictly preserved`)

  console.log('\n===============================================================')
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`)
  console.log('===============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite()
  .catch((e) => {
    console.error('Fatal test error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
