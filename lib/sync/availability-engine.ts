/**
 * BarberOS Availability Engine
 * ============================
 * Motor unificado de disponibilidad - Fuente única de la verdad.
 * Usado por la API web pública y el bot de WhatsApp.
 * Consulta en tiempo real: Service + Barber + BarberSchedule + BarberBlock + Appointment.
 * Ningún dato hardcodeado. Cambios del dueño se reflejan inmediatamente.
 */

import { prisma } from '../prisma'

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

export interface GetSlotsParams {
  businessId: string
  serviceId: string
  dateStr: string
  barberId?: string | null
  slotIntervalMinutes?: number
  customDurationMinutes?: number
}

// Motor principal - slot por slot - para WhatsApp (1 barbero por franja)
export async function getAvailableSlots(params: GetSlotsParams): Promise<AvailableSlot[]> {
  const { businessId, serviceId, dateStr, barberId, slotIntervalMinutes = 30, customDurationMinutes } = params

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || service.businessId !== businessId || !service.isActive) return []

  const durationToUse = (customDurationMinutes && customDurationMinutes > 0) ? customDurationMinutes : service.duration
  const serviceDurationMs = durationToUse * 60 * 1000
  const slotIntervalMs = slotIntervalMinutes * 60 * 1000
  const [year, month, day] = dateStr.split('-').map(Number)
  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
  const now = new Date()

  const barbers = await prisma.barber.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      ...(barberId ? { id: barberId } : {})
    },
    include: {
      schedules: { where: { dayOfWeek } },
      blocks: { where: { date: { gte: startOfDay, lte: endOfDay } } },
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { service: true }
      }
    }
  })

  if (barbers.length === 0) return []

  const availableMap = new Map<string, AvailableSlot>()

  for (const barber of barbers) {
    const schedule = barber.schedules[0]
    if (!schedule || !schedule.isWorking) continue

    const [startH, startM] = schedule.startTime.split(':').map(Number)
    const [endH, endM] = schedule.endTime.split(':').map(Number)
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
          const apptDuration = appt.service?.duration || 30
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
          dateObj: new Date(cursor)
        })
      }

      cursor = new Date(cursor.getTime() + slotIntervalMs)
    }
  }

  return Array.from(availableMap.values()).sort((a, b) => a.timeStr.localeCompare(b.timeStr))
}

// Variante para la web: retorna todos los barberos disponibles por franja
export async function getAvailableSlotsForWeb(params: GetSlotsParams): Promise<SlotForWeb[]> {
  const { businessId, serviceId, dateStr, barberId, slotIntervalMinutes = 30, customDurationMinutes } = params

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || service.businessId !== businessId || !service.isActive) return []

  const durationToUse = (customDurationMinutes && customDurationMinutes > 0) ? customDurationMinutes : service.duration
  const serviceDurationMs = durationToUse * 60 * 1000
  const slotIntervalMs = slotIntervalMinutes * 60 * 1000
  const [year, month, day] = dateStr.split('-').map(Number)
  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
  const now = new Date()

  const barbers = await prisma.barber.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      ...(barberId ? { id: barberId } : {})
    },
    include: {
      schedules: { where: { dayOfWeek } },
      blocks: { where: { date: { gte: startOfDay, lte: endOfDay } } },
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { service: true }
      }
    }
  })

  if (barbers.length === 0) return []

  const slotMap = new Map<string, string[]>()

  for (const barber of barbers) {
    const schedule = barber.schedules[0]
    if (!schedule || !schedule.isWorking) continue

    const [startH, startM] = schedule.startTime.split(':').map(Number)
    const [endH, endM] = schedule.endTime.split(':').map(Number)
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
          const apptDuration = appt.service?.duration || 30
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
        orderBy: { category: 'asc' }
      },
      barbers: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, specialty: true, avatar: true },
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!business) return null

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    services: business.services.map(s => ({
      ...s,
      price: Number(s.price)
    })),
    barbers: business.barbers,
    lastFetchedAt: new Date().toISOString()
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
        orderBy: { category: 'asc' }
      },
      barbers: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, specialty: true, avatar: true },
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!business) return null

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    services: business.services.map(s => ({
      ...s,
      price: Number(s.price)
    })),
    barbers: business.barbers,
    lastFetchedAt: new Date().toISOString()
  }
}
