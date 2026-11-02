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
