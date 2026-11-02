'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AppNotification } from '@/app/api/notifications/route'
import { X, Calendar, MessageSquare, StickyNote, Bell, ArrowRight, CheckCircle2, User, Clock, Tag, Sparkles } from 'lucide-react'

interface NotificationModalProps {
  notification: AppNotification | null
  onClose: () => void
  onMarkAsRead: (id: string) => void
}

export default function NotificationModal({ notification, onClose, onMarkAsRead }: NotificationModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (notification && mounted) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [notification, mounted])

  if (!notification || !mounted) return null

  const getCategoryConfig = (category: AppNotification['category']) => {
    switch (category) {
      case 'appointment':
        return {
          label: 'Cita de Barbería',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          icon: Calendar,
          actionText: 'Ir a Gestión de Citas',
          defaultLink: '/appointments'
        }
      case 'chat':
        return {
          label: 'Mensaje del Chat',
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          icon: MessageSquare,
          actionText: 'Abrir Chat Interno',
          defaultLink: '/chat'
        }
      case 'note':
        return {
          label: 'Nota / Recordatorio',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          icon: StickyNote,
          actionText: 'Ver Notas Internas',
          defaultLink: '/notes'
        }
      case 'system':
        return {
          label: 'Membresía & Suscripción',
          bg: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
          icon: Sparkles,
          actionText: 'Ver Planes y Suscripción',
          defaultLink: '/subscription'
        }
      default:
        return {
          label: 'Aviso del Sistema',
          bg: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20',
          icon: Bell,
          actionText: 'Ir al Panel Principal',
          defaultLink: '/dashboard'
        }
    }
  }

  const config = getCategoryConfig(notification.category)
  const CategoryIcon = config.icon

  const handleAction = () => {
    onMarkAsRead(notification.id)
    onClose()
    const targetLink = notification.link || config.defaultLink
    router.push(targetLink)
  }

  // Format long reservation codes cleanly
  const rawCode = notification.metadata?.code
  const displayCode = rawCode 
    ? (rawCode.length > 10 ? `#${rawCode.slice(-8).toUpperCase()}` : `#${rawCode}`)
    : null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div 
        className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 border ${config.bg}`}>
            <CategoryIcon size={14} />
            {config.label}
          </span>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Title & Timestamp */}
          <div>
            <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-snug">
              {notification.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-1.5">
              <Clock size={13} className="text-zinc-400 dark:text-zinc-500" />
              <span>{new Date(notification.timestamp).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
          </div>

          {/* Main Message Box */}
          <div className="p-4 bg-zinc-50/90 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-sm font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {notification.message}
          </div>

          {/* Metadata Box (Appointments) */}
          {notification.metadata && (
            <div className="p-5 bg-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Detalles de la Reserva
                </span>
                {displayCode && (
                  <span 
                    className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg font-mono text-[10px] tracking-wider border border-zinc-700/60 truncate max-w-[140px]"
                    title={rawCode}
                  >
                    {displayCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {notification.metadata.clientName && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400 font-medium">Cliente</div>
                      <div className="font-semibold text-white truncate">{notification.metadata.clientName}</div>
                    </div>
                  </div>
                )}

                {notification.metadata.serviceName && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                      <Tag size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400 font-medium">Servicio</div>
                      <div className="font-semibold text-white truncate">{notification.metadata.serviceName}</div>
                    </div>
                  </div>
                )}

                {notification.metadata.date && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                      <Clock size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400 font-medium">Horario</div>
                      <div className="font-semibold text-white truncate">{notification.metadata.date}</div>
                    </div>
                  </div>
                )}

                {notification.metadata.barberName && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400 font-medium">Barbero</div>
                      <div className="font-semibold text-white truncate">{notification.metadata.barberName}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onMarkAsRead(notification.id)
              onClose()
            }}
            className="w-full sm:w-auto text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} className="text-zinc-400" />
            <span>Marcar como leída</span>
          </button>

          <button
            onClick={handleAction}
            className="w-full sm:w-auto bg-black dark:bg-amber-400 hover:bg-zinc-800 dark:hover:bg-amber-300 text-white dark:text-zinc-950 text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95"
          >
            <span>{config.actionText}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
