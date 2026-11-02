'use client'

import { useState } from 'react'
import { Bell, Calendar, XCircle, Clock, DollarSign, CheckCircle2, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface BarberNotification {
  id: string
  type: 'NEW_BOOKING' | 'CANCELLATION' | 'SCHEDULE_CHANGE' | 'COMMISSION_PAID'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function BarberNotificationsPage() {
  const [notifications, setNotifications] = useState<BarberNotification[]>([
    {
      id: '1',
      type: 'NEW_BOOKING',
      title: 'Nueva cita reservada',
      message: 'Juan Pérez reservó Corte Degradado para hoy a las 3:30 PM.',
      timestamp: 'Hace 15 min',
      read: false
    },
    {
      id: '2',
      type: 'COMMISSION_PAID',
      title: 'Pago de Comisión Procesado',
      message: 'Se ha registrado la transferencia de $168.000 de la semana pasada.',
      timestamp: 'Hace 2 horas',
      read: false
    },
    {
      id: '3',
      type: 'SCHEDULE_CHANGE',
      title: 'Cambio de horario en cita',
      message: 'Carlos Ruiz reprogramó su servicio de 4:00 PM a 5:00 PM.',
      timestamp: 'Ayer, 6:00 PM',
      read: true
    },
    {
      id: '4',
      type: 'CANCELLATION',
      title: 'Cita cancelada por cliente',
      message: 'Andrés Gómez canceló su reserva de Barba Completa.',
      timestamp: 'Ayer, 2:15 PM',
      read: true
    }
  ])

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast.success('Todas las notificaciones marcadas como leídas')
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const filtered = notifications.filter(n => activeFilter === 'ALL' || !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: BarberNotification['type']) => {
    switch (type) {
      case 'NEW_BOOKING':
        return <Calendar className="text-emerald-600" size={20} />
      case 'CANCELLATION':
        return <XCircle className="text-red-500" size={20} />
      case 'SCHEDULE_CHANGE':
        return <Clock className="text-amber-500" size={20} />
      case 'COMMISSION_PAID':
        return <DollarSign className="text-blue-600" size={20} />
    }
  }

  const getBadgeColor = (type: BarberNotification['type']) => {
    switch (type) {
      case 'NEW_BOOKING':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
      case 'CANCELLATION':
        return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60'
      case 'SCHEDULE_CHANGE':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
      case 'COMMISSION_PAID':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Notificaciones</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2 ml-1">
            Nuevas Citas, Cancelaciones, Cambios y Pagos
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-black hover:bg-zinc-800 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md"
          >
            <CheckCircle2 size={16} />
            Marcar todo leído
          </button>
        )}
      </header>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeFilter === 'ALL'
                ? 'bg-black text-white dark:bg-amber-400 dark:text-zinc-950 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeFilter === 'UNREAD'
                ? 'bg-black text-white dark:bg-amber-400 dark:text-zinc-950 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Sin leer
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Bell className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" size={32} />
          <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">No hay notificaciones en esta sección</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-start gap-5 ${
                n.read
                  ? 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800/80 opacity-80 hover:opacity-100'
                  : 'bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900/90 dark:to-[#18181b] border-black dark:border-amber-400/40 shadow-md'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border tracking-widest ${getBadgeColor(n.type)}`}>
                    {n.type === 'NEW_BOOKING' && 'Nueva Cita'}
                    {n.type === 'CANCELLATION' && 'Cancelación'}
                    {n.type === 'SCHEDULE_CHANGE' && 'Cambio de Horario'}
                    {n.type === 'COMMISSION_PAID' && 'Pago de Comisión'}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{n.timestamp}</span>
                </div>
                <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-tight">{n.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-1">{n.message}</p>
              </div>

              {!n.read && (
                <div className="w-3 h-3 bg-black dark:bg-amber-400 rounded-full shrink-0 mt-2 shadow-xs"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
