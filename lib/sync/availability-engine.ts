/**
 * BarberOS Availability Engine
 * ============================
 * Motor unificado de disponibilidad - Fuente única de la verdad.
 * Usado por la API web pública, el dashboard del propietario/barbero y el bot de WhatsApp.
 * Consulta en tiempo real: BusinessPage (horarios del local) + Service + Barber +
 * BarberSchedule + BarberBlock + Appointment (incluyendo reservas temporales y multi-servicios).
 */

import { prisma } from '../prisma'
import { parseSchedule } from '../schedule'
import {
  parseAppointmentNotesAndMeta,
  serializeAppointmentNotesWithMeta,
} from '../booking/booking-metadata'

// Types
export interface AvailableSlot {
  timeStr: string
  displayTime: string
  barberId: string
  barberName: string
  dateObj: Date
}

export interface SlotForWeb {
  time: string
  barberIds: string[]
}

export interface ActiveService {
  id: string
  name: string
  description: string | null
  price: number | string
  duration: number
  category: string | null
}

export interface ActiveBarber {
  id: string
  name: string
  specialty: string | null
  avatar: string | null
}

export interface LiveBusinessData {
  id: string
  name: string
  slug: string
  services: ActiveService[]
  barbers: ActiveBarber[]
  lastFetchedAt: string
}

// Helpers
function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function format12Hour(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${pad(m)} ${period}`
}

export function getNextDates(daysAhead = 7) {
  const dates = []
  const now = new Date()
  const weekdayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const dateStr = `${year}-${month}-${day}`

    let prefix = ''
    if (i === 0) prefix = 'Hoy - '
    else if (i === 1) prefix = 'Mañana - '

    const displayDate = `${prefix}${weekdayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`
    dates.push({ dateStr, displayDate, dayOfWeek: d.getDay() })
  }

  return dates
}

/**
 * Libera de forma perezosa (sin depender de cron jobs frecuentes en Vercel Hobby)
 * las reservas temporales cuyo plazo para adjuntar comprobante (`holdExpiresAt`)
 * ya venció, SIEMPRE Y CUANDO:
 *  - No tengan anticipo pagado (`depositPaid === false`)
 *  - No hayan enviado ya un comprobante (`depositStatus !== 'PROOF_SUBMITTED'` y `!proofUrl`)
 *  - No estén aprobadas (`depositStatus !== 'APPROVED'`)
 */
export async function expireStaleHoldsForBusiness(businessId: string): Promise<number> {
  try {
    const now = new Date()
    const pendingWithDeposit = await prisma.appointment.findMany({
      where: {
        businessId,
        status: 'PENDING',
        depositPaid: false,
        depositRequired: { gt: 0 },
      },
      select: {
        id: true,
        notes: true,
      },
    })

    if (pendingWithDeposit.length === 0) return 0

    let expiredCount = 0
    for (const appt of pendingWithDeposit) {
      const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appt.notes)
      if (
        meta.depositStatus === 'TEMP_HOLD' &&
        !meta.proofUrl &&
        meta.holdExpiresAt
      ) {
        const expDate = new Date(meta.holdExpiresAt)
        if (!isNaN(expDate.getTime()) && expDate.getTime() < now.getTime()) {
          const updatedMeta = {
            ...meta,
            depositStatus: 'EXPIRED' as const,
          }
          await prisma.appointment.update({
            where: { id: appt.id },
            data: {
              status: 'CANCELLED',
              notes: serializeAppointmentNotesWithMeta(
                cleanNotes || 'Reserva temporal liberada automáticamente por vencimiento de plazo de anticipo.',
                updatedMeta
              ),
            },
          })
          expiredCount++
        }
      }
    }

    return expiredCount
  } catch (err) {
    console.warn('[AvailabilityEngine] Non-fatal error expiring stale holds:', err)
    return 0
  }
}

export interface GetSlotsParams {
  businessId: string
  serviceId: string
  dateStr: string
  barberId?: string | null
  slotIntervalMinutes?: number
  customDurationMinutes?: number
  excludeAppointmentId?: string | null
}

/**
 * Obtiene la duración efectiva de una cita (incluyendo multi-servicios en metadata)
 */
export function getEffectiveAppointmentDuration(appt: {
  notes?: string | null
  service?: { duration?: number | null } | null
}): number {
  const { meta } = parseAppointmentNotesAndMeta(appt.notes)
  if (typeof meta.totalDuration === 'number' && meta.totalDuration > 0) {
    return meta.totalDuration
  }
  return Number(appt.service?.duration || 30)
}

/**
 * Resuelve el horario laboral efectivo de un barbero en un día de la semana,
 * respetando primero el cierre general de la barbería (`BusinessPage.businessHours`)
 * y usando el horario del negocio como respaldo si el barbero aún no tiene fila en `BarberSchedule`.
 */
export function resolveEffectiveShiftForBarber(
  barberSchedules: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }[],
  dayOfWeek: number,
  businessDaySchedule?: { isOpen: boolean; openTime: string; closeTime: string } | null
): { isWorking: boolean; startTime: string; endTime: string } {
  // Si la barbería tiene configurado ese día como CERRADO a nivel negocio, no hay atención
  if (businessDaySchedule && !businessDaySchedule.isOpen) {
    return { isWorking: false, startTime: '08:00', endTime: '20:00' }
  }

  const barberSched = barberSchedules.find((s) => s.dayOfWeek === dayOfWeek)
  if (barberSched) {
    if (!barberSched.isWorking) {
      return { isWorking: false, startTime: barberSched.startTime, endTime: barberSched.endTime }
    }
    // Intersectar con horario de apertura de la barbería si existe
    let startTime = barberSched.startTime
    let endTime = barberSched.endTime
    if (businessDaySchedule && businessDaySchedule.isOpen) {
      if (businessDaySchedule.openTime > startTime) startTime = businessDaySchedule.openTime
      if (businessDaySchedule.closeTime < endTime) endTime = businessDaySchedule.closeTime
    }
    return { isWorking: startTime < endTime, startTime, endTime }
  }

  // Fallback: si el barbero no tiene BarberSchedule explícito para este día, hereda el horario del local
  if (businessDaySchedule) {
    return {
      isWorking: businessDaySchedule.isOpen,
      startTime: businessDaySchedule.openTime || '08:00',
      endTime: businessDaySchedule.closeTime || '20:00',
    }
  }

  return { isWorking: true, startTime: '08:00', endTime: '20:00' }
}

// Motor principal - slot por slot - para WhatsApp (1 barbero por franja)
export async function getAvailableSlots(params: GetSlotsParams): Promise<AvailableSlot[]> {
  const {
    businessId,
    serviceId,
    dateStr,
    barberId,
    slotIntervalMinutes = 30,
    customDurationMinutes,
    excludeAppointmentId,
  } = params

  await expireStaleHoldsForBusiness(businessId)

  const [service, businessPage] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.businessPage.findUnique({
      where: { businessId },
      select: { businessHours: true },
    }),
  ])

  if (!service || service.businessId !== businessId || !service.isActive) return []

  const durationToUse =
    customDurationMinutes && customDurationMinutes > 0 ? customDurationMinutes : service.duration
  const serviceDurationMs = durationToUse * 60 * 1000
  const slotIntervalMs = slotIntervalMinutes * 60 * 1000
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return []

  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
  const now = new Date()

  // Verificar horario general de la barbería si está configurado
  const parsedBusinessSchedule = businessPage?.businessHours
    ? parseSchedule(businessPage.businessHours)
    : null
  const businessDaySchedule = parsedBusinessSchedule
    ? parsedBusinessSchedule.find((d) => d.dayIndex === dayOfWeek) || null
    : null

  if (businessDaySchedule && !businessDaySchedule.isOpen) {
    return []
  }

  // Si la sede tiene un cierre programado para este día/rango, retornar 0 slots
  const branchClosure = await prisma.branchClosure.findFirst({
    where: {
      businessId,
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
  })
  if (branchClosure) {
    return []
  }

  const barbers = await prisma.barber.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      ...(barberId ? { id: barberId } : {}),
    },
    include: {
      schedules: { where: { dayOfWeek } },
      blocks: { where: { date: { gte: startOfDay, lte: endOfDay } } },
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          date: { gte: startOfDay, lte: endOfDay },
          ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        },
        include: { service: true },
      },
    },
  })

  if (barbers.length === 0) return []

  const availableMap = new Map<string, AvailableSlot>()

  for (const barber of barbers) {
    const effectiveShift = resolveEffectiveShiftForBarber(
      barber.schedules,
      dayOfWeek,
      businessDaySchedule
    )
    if (!effectiveShift.isWorking) continue

    const [startH, startM] = effectiveShift.startTime.split(':').map(Number)
    const [endH, endM] = effectiveShift.endTime.split(':').map(Number)
    const shiftStart = new Date(year, month - 1, day, startH, startM, 0)
    const shiftEnd = new Date(year, month - 1, day, endH, endM, 0)
    let cursor = new Date(shiftStart)

    while (cursor.getTime() + serviceDurationMs <= shiftEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + serviceDurationMs)
      const timeStr = `${pad(cursor.getHours())}:${pad(cursor.getMinutes())}`
      let ok = cursor >= now

      if (ok) {
        for (const block of barber.blocks) {
          const [bH, bM] = block.startTime.split(':').map(Number)
          const [eH, eM] = block.endTime.split(':').map(Number)
          const blockStart = new Date(year, month - 1, day, bH, bM)
          const blockEnd = new Date(year, month - 1, day, eH, eM)
          if (cursor < blockEnd && slotEnd > blockStart) {
            ok = false
            break
          }
        }
      }

      if (ok) {
        for (const appt of barber.appointments) {
          const apptStart = new Date(appt.date)
          const apptDuration = getEffectiveAppointmentDuration(appt)
          const apptEnd = new Date(apptStart.getTime() + apptDuration * 60 * 1000)
          if (cursor < apptEnd && slotEnd > apptStart) {
            ok = false
            break
          }
        }
      }

      if (ok && !availableMap.has(timeStr)) {
        availableMap.set(timeStr, {
          timeStr,
          displayTime: format12Hour(timeStr),
          barberId: barber.id,
          barberName: barber.name,
          dateObj: new Date(cursor),
        })
      }

      cursor = new Date(cursor.getTime() + slotIntervalMs)
    }
  }

  return Array.from(availableMap.values()).sort((a, b) => a.timeStr.localeCompare(b.timeStr))
}

// Variante para la web: retorna todos los barberos disponibles por franja
export async function getAvailableSlotsForWeb(params: GetSlotsParams): Promise<SlotForWeb[]> {
  const {
    businessId,
    serviceId,
    dateStr,
    barberId,
    slotIntervalMinutes = 30,
    customDurationMinutes,
    excludeAppointmentId,
  } = params

  await expireStaleHoldsForBusiness(businessId)

  const [service, businessPage] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.businessPage.findUnique({
      where: { businessId },
      select: { businessHours: true },
    }),
  ])

  if (!service || service.businessId !== businessId || !service.isActive) return []

  const durationToUse =
    customDurationMinutes && customDurationMinutes > 0 ? customDurationMinutes : service.duration
  const serviceDurationMs = durationToUse * 60 * 1000
  const slotIntervalMs = slotIntervalMinutes * 60 * 1000
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return []

  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
  const now = new Date()

  const parsedBusinessSchedule = businessPage?.businessHours
    ? parseSchedule(businessPage.businessHours)
    : null
  const businessDaySchedule = parsedBusinessSchedule
    ? parsedBusinessSchedule.find((d) => d.dayIndex === dayOfWeek) || null
    : null

  if (businessDaySchedule && !businessDaySchedule.isOpen) {
    return []
  }

  // Si la sede tiene un cierre programado para este día/rango, retornar 0 slots
  const branchClosure = await prisma.branchClosure.findFirst({
    where: {
      businessId,
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
  })
  if (branchClosure) {
    return []
  }

  const barbers = await prisma.barber.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      ...(barberId ? { id: barberId } : {}),
    },
    include: {
      schedules: { where: { dayOfWeek } },
      blocks: { where: { date: { gte: startOfDay, lte: endOfDay } } },
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          date: { gte: startOfDay, lte: endOfDay },
          ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        },
        include: { service: true },
      },
    },
  })

  if (barbers.length === 0) return []

  const slotMap = new Map<string, string[]>()

  for (const barber of barbers) {
    const effectiveShift = resolveEffectiveShiftForBarber(
      barber.schedules,
      dayOfWeek,
      businessDaySchedule
    )
    if (!effectiveShift.isWorking) continue

    const [startH, startM] = effectiveShift.startTime.split(':').map(Number)
    const [endH, endM] = effectiveShift.endTime.split(':').map(Number)
    const shiftStart = new Date(year, month - 1, day, startH, startM, 0)
    const shiftEnd = new Date(year, month - 1, day, endH, endM, 0)
    let cursor = new Date(shiftStart)

    while (cursor.getTime() + serviceDurationMs <= shiftEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + serviceDurationMs)
      const timeStr = `${pad(cursor.getHours())}:${pad(cursor.getMinutes())}`
      let ok = cursor >= now

      if (ok) {
        for (const block of barber.blocks) {
          const [bH, bM] = block.startTime.split(':').map(Number)
          const [eH, eM] = block.endTime.split(':').map(Number)
          const blockStart = new Date(year, month - 1, day, bH, bM)
          const blockEnd = new Date(year, month - 1, day, eH, eM)
          if (cursor < blockEnd && slotEnd > blockStart) {
            ok = false
            break
          }
        }
      }

      if (ok) {
        for (const appt of barber.appointments) {
          const apptStart = new Date(appt.date)
          const apptDuration = getEffectiveAppointmentDuration(appt)
          const apptEnd = new Date(apptStart.getTime() + apptDuration * 60 * 1000)
          if (cursor < apptEnd && slotEnd > apptStart) {
            ok = false
            break
          }
        }
      }

      if (ok) {
        const existing = slotMap.get(timeStr) || []
        slotMap.set(timeStr, [...existing, barber.id])
      }

      cursor = new Date(cursor.getTime() + slotIntervalMs)
    }
  }

  return Array.from(slotMap.entries())
    .map(([time, barberIds]) => ({ time, barberIds }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

// Datos vivos: servicios + barberos activos del negocio
export async function getLiveBusinessData(businessId: string): Promise<LiveBusinessData | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      services: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true, category: true },
        orderBy: { category: 'asc' },
      },
      barbers: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, specialty: true, avatar: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!business) return null

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    services: business.services.map((s) => ({
      ...s,
      price: Number(s.price),
    })),
    barbers: business.barbers,
    lastFetchedAt: new Date().toISOString(),
  }
}

// Datos vivos por slug
export async function getLiveBusinessBySlug(slug: string): Promise<LiveBusinessData | null> {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      services: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true, category: true },
        orderBy: { category: 'asc' },
      },
      barbers: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, specialty: true, avatar: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!business) return null

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    services: business.services.map((s) => ({
      ...s,
      price: Number(s.price),
    })),
    barbers: business.barbers,
    lastFetchedAt: new Date().toISOString(),
  }
}
