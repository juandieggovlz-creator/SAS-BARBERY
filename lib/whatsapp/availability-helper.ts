/**
 * WhatsAppAvailabilityHelper
 * Wrapper de compatibilidad que delega al motor unificado de disponibilidad.
 * Todo el calculo real ocurre en lib/sync/availability-engine.ts
 */
import {
  getAvailableSlots,
  getNextDates,
  format12Hour,
  AvailableSlot,
  GetSlotsParams
} from '../sync/availability-engine'

export type { AvailableSlot, GetSlotsParams }

export class WhatsAppAvailabilityHelper {
  static format12Hour = format12Hour
  static getNextDates = getNextDates

  static async getAvailableSlots(params: {
    businessId: string
    serviceId: string
    barberId?: string | null
    dateStr: string
    slotIntervalMinutes?: number
    customDurationMinutes?: number
  }): Promise<AvailableSlot[]> {
    return getAvailableSlots(params)
  }
}
