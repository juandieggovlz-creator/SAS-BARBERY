'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Bell, Calendar, MessageSquare, StickyNote, CheckCheck, Trash2, ChevronRight, Sparkles } from 'lucide-react'
import { AppNotification } from '@/app/api/notifications/route'
import NotificationModal from './NotificationModal'

function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    
    // Note 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime)
    gain1.gain.setValueAtTime(0.15, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.5)

    // Note 2: B5 (987.77Hz) after 150ms
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.7)
  } catch {
    // AudioContext blocked or not supported
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'appointment' | 'chat' | 'note'>('all')
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Persist known (already-toasted) notification IDs in localStorage so toasts never re-fire on remount/navigation
  const knownNotifIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)

  // Load read notifications AND known toasted IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('barber_read_notifications')
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)))
      }
    } catch {
      // ignore
    }
    // Load previously-toasted notification IDs so they never toast again
    try {
      const storedToasted = localStorage.getItem('barber_toasted_notif_ids')
      if (storedToasted) {
        const parsed: string[] = JSON.parse(storedToasted)
        parsed.forEach(id => knownNotifIds.current.add(id))
      }
    } catch {
      // ignore
    }
  }, [])

  // Fetch notifications from API
  const fetchNotifications = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/notifications', { signal })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications && Array.isArray(data.notifications)) {
          const list: AppNotification[] = data.notifications
          setNotifications(list)

          let hasNewAppointment = false
          const now = Date.now()
          list.forEach(n => {
            if (!knownNotifIds.current.has(n.id)) {
              // Only fire toast for genuinely NEW appointments:
              // - Not the first load (initial page visit silently learns existing IDs)
              // - Category is appointment
              // - Status is PENDING (not COMPLETED, CANCELLED, etc.)
              // - Created within the last 2 minutes (prevents old appointments from toasting)
              const ageMs = now - new Date(n.timestamp).getTime()
              const isRecent = ageMs < 2 * 60 * 1000 // 2 minutes
              const isPending = n.metadata?.status === 'PENDING' || n.metadata?.status === 'CONFIRMED'

              if (!isFirstLoad.current && n.category === 'appointment' && isRecent && isPending) {
                hasNewAppointment = true
                toast.info(`🔔 ${n.title}`, {
                  id: `toast-${n.id}`, // Prevent duplicate toasts for the same notification
                  description: n.message,
                  duration: 4000
                })
              }
              knownNotifIds.current.add(n.id)
            }
          })

          // Persist known IDs to localStorage so they survive component remounts
          try {
            // Keep only the last 200 IDs to avoid unbounded growth
            const idsArray = Array.from(knownNotifIds.current).slice(-200)
            localStorage.setItem('barber_toasted_notif_ids', JSON.stringify(idsArray))
          } catch {
            // ignore storage errors
          }

          if (hasNewAppointment) {
            playChimeSound()
            window.dispatchEvent(new CustomEvent('new-appointment-registered'))
          }

          if (isFirstLoad.current) {
            isFirstLoad.current = false
          }
        }
      }
    } catch (err: unknown) {
      // Gracefully ignore aborts or temporary offline/reconnect glitches without crashing UI
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    
    // Initial fetch
    fetchNotifications(controller.signal)

    // Poll periodically when tab is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchNotifications(controller.signal)
      }
    }, 10000)

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchNotifications(controller.signal)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controller.abort()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Save readIds to localStorage
  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet)
    try {
      localStorage.setItem('barber_read_notifications', JSON.stringify(Array.from(newSet)))
    } catch {
      // ignore
    }
  }

  const markAsRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    saveReadIds(next)
  }

  const markAllAsRead = () => {
    const next = new Set(readIds)
    notifications.forEach((n) => next.add(n.id))
    saveReadIds(next)
  }

  const clearAll = () => {
    markAllAsRead()
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id) && !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true
    return n.category === activeTab
  })

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'appointment':
        return <Calendar size={14} className="text-emerald-600" />
      case 'chat':
        return <MessageSquare size={14} className="text-blue-600" />
      case 'note':
        return <StickyNote size={14} className="text-amber-600" />
      case 'system':
        return <Sparkles size={14} className="text-amber-500" />
      default:
        return <Bell size={14} className="text-zinc-600" />
    }
  }

  const getRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)
      if (diffMinutes < 1) return 'Ahora mismo'
      if (diffMinutes < 60) return `Hace ${diffMinutes} m`
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `Hace ${diffHours} h`
      return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

  return (
    <>
      <div className="relative inline-block" ref={popoverRef}>
        {/* Campanita Button matching UI design */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative bg-zinc-100 dark:bg-[#121215] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-2.5 rounded-xl transition-all border border-zinc-200/60 dark:border-zinc-800 active:scale-95 flex items-center justify-center cursor-pointer ${
            isOpen ? 'ring-2' : ''
          }`}
          style={isOpen ? { borderColor: 'var(--accent)' } : undefined}
          title="Notificaciones"
          aria-label="Ver notificaciones"
        >
          <Bell size={16} className="transition-transform group-hover:rotate-12" />
          
          {/* Badge indicator dot — Dynamic Palette Color */}
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#121215] animate-pulse"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent)'
              }}
            />
          )}
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Popover Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-tight">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)'
                    }}
                  >
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck size={13} />
                    <span className="hidden sm:inline">Leídas</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-black text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition-all p-1 cursor-pointer"
                    title="Limpiar lista"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-2 bg-zinc-100/60 dark:bg-zinc-900/95 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-extrabold uppercase overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'all' ? 'shadow-sm font-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                style={activeTab === 'all' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab('appointment')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'appointment' ? 'shadow-sm font-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                style={activeTab === 'appointment' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
              >
                <Calendar size={12} />
                Citas
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'chat' ? 'shadow-sm font-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                style={activeTab === 'chat' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
              >
                <MessageSquare size={12} />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('note')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'note' ? 'shadow-sm font-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
                style={activeTab === 'note' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
              >
                <StickyNote size={12} />
                Notas
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 dark:text-zinc-500">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wider">No hay notificaciones</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isUnread = !readIds.has(notif.id) && !notif.read

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id)
                        setSelectedNotification(notif)
                        setIsOpen(false)
                      }}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/60 group relative ${
                        isUnread ? 'bg-zinc-50/90 dark:bg-zinc-900/90' : 'opacity-85 dark:bg-[#121215]'
                      }`}
                    >
                      {/* Left icon badge */}
                      <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                        isUnread ? 'bg-white dark:bg-zinc-800 shadow-xs border-zinc-200 dark:border-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200/50 dark:border-zinc-800'
                      }`}>
                        {getCategoryIcon(notif.category)}
                      </div>

                      {/* Item Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs font-extrabold truncate ${isUnread ? 'text-black dark:text-white font-black' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                            {getRelativeTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">
                          {notif.message}
                        </p>
                      </div>

                      {/* Unread Dot & Arrow */}
                      <div className="flex flex-col items-end gap-1 shrink-0 self-center">
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: 'var(--accent)',
                              boxShadow: '0 0 6px var(--accent-op60)'
                            }}
                          />
                        )}
                        <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Popover Footer */}
            <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Haz clic en una notificación para ver el mensaje completo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Screen Message Modal */}
      <NotificationModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={markAsRead}
      />
    </>
  )
}
