export type DayScheduleItem = {
  day: string
  dayIndex: number // 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado, 0: Domingo
  isOpen: boolean
  openTime: string // Formato 24h "08:00"
  closeTime: string // Formato 24h "20:00"
  customMessage?: string
}

export const DEFAULT_SCHEDULE: DayScheduleItem[] = [
  { day: 'Lunes', dayIndex: 1, isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Martes', dayIndex: 2, isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Miércoles', dayIndex: 3, isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Jueves', dayIndex: 4, isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Viernes', dayIndex: 5, isOpen: true, openTime: '08:00', closeTime: '21:00' },
  { day: 'Sábado', dayIndex: 6, isOpen: true, openTime: '08:00', closeTime: '21:00' },
  { day: 'Domingo', dayIndex: 0, isOpen: true, openTime: '10:00', closeTime: '16:00' },
]

export function parseSchedule(raw: unknown): DayScheduleItem[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return normalizeSchedule(raw)
  }
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeSchedule(parsed)
      }
    } catch {
      // Fallback
    }
  }
  return DEFAULT_SCHEDULE
}

export function normalizeSchedule(items: any[]): DayScheduleItem[] {
  return DEFAULT_SCHEDULE.map(defaultItem => {
    const existing = items.find(
      i => i.dayIndex === defaultItem.dayIndex || i.day?.toLowerCase() === defaultItem.day.toLowerCase()
    )
    if (!existing) return { ...defaultItem }
    return {
      day: defaultItem.day,
      dayIndex: defaultItem.dayIndex,
      isOpen: existing.isOpen !== false,
      openTime: existing.openTime || defaultItem.openTime,
      closeTime: existing.closeTime || defaultItem.closeTime,
      customMessage: existing.customMessage || '',
    }
  })
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  let h = parseInt(parts[0], 10)
  if (isNaN(h)) return timeStr
  const m = parts[1] || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const paddedH = h < 10 ? `0${h}` : `${h}`
  return `${paddedH}:${m} ${ampm}`
}

export function formatDayHours(item: DayScheduleItem): { text: string; isOpen: boolean; isClosed: boolean } {
  if (!item.isOpen) {
    return {
      text: item.customMessage?.trim() || 'Cerrado',
      isOpen: false,
      isClosed: true,
    }
  }
  const formattedOpen = formatTime12h(item.openTime)
  const formattedClose = formatTime12h(item.closeTime)
  return {
    text: `${formattedOpen} - ${formattedClose}`,
    isOpen: true,
    isClosed: false,
  }
}

function parseMinutes24h(timeStr?: string | null): number | null {
  if (!timeStr) return null
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/**
 * Determina si la barbería está abierta en este instante según el horario real del día
 * y la zona horaria del negocio (por defecto America/Bogota).
 */
export function isBusinessOpenNow(
  item?: DayScheduleItem | null,
  timeZone = 'America/Bogota'
): boolean {
  if (!item || !item.isOpen) return false
  const openMins = parseMinutes24h(item.openTime)
  const closeMins = parseMinutes24h(item.closeTime)
  if (openMins === null || closeMins === null) return true

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).formatToParts(new Date())

    const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0'
    const minPart = parts.find((p) => p.type === 'minute')?.value ?? '0'
    const hour = parseInt(hourPart, 10) % 24
    const minute = parseInt(minPart, 10)
    const nowMins = hour * 60 + minute

    if (closeMins >= openMins) {
      return nowMins >= openMins && nowMins < closeMins
    }
    // Horario nocturno que cruza medianoche
    return nowMins >= openMins || nowMins < closeMins
  } catch {
    return item.isOpen
  }
}
