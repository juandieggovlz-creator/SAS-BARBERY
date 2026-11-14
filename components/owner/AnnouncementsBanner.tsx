'use client'

import React, { useState, useEffect } from 'react'
import { Megaphone, X, AlertCircle, Wrench, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'ANNOUNCEMENT' | 'UPDATE' | 'MAINTENANCE'
  createdAt: string
}

const TYPE_CONFIG = {
  ANNOUNCEMENT: {
    icon: Megaphone,
    label: 'Comunicado',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
  },
  UPDATE: {
    icon: Sparkles,
    label: 'Actualización',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
  },
  MAINTENANCE: {
    icon: Wrench,
    label: 'Mantenimiento',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
  }
}

const DISMISSED_KEY = 'barberos_dismissed_announcements'

function getDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch {
    return []
  }
}

function dismissAnnouncement(id: string) {
  if (typeof window === 'undefined') return
  const current = getDismissed()
  if (!current.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]))
  }
}

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    setDismissed(getDismissed())
    fetch('/api/owner/announcements')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.announcements) setAnnouncements(data.announcements)
      })
      .catch(() => {/* silent fail */})
  }, [])

  const visible = announcements.filter(a => !dismissed.includes(a.id))

  if (visible.length === 0) return null

  const handleDismiss = (id: string) => {
    dismissAnnouncement(id)
    setDismissed(prev => [...prev, id])
  }

  return (
    <div className="space-y-2 mb-5">
      {visible.map(ann => {
        const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.ANNOUNCEMENT
        const Icon = cfg.icon
        const isExpanded = expanded === ann.id
        const date = new Date(ann.createdAt).toLocaleDateString('es-CO', {
          year: 'numeric', month: 'short', day: 'numeric'
        })

        return (
          <div
            key={ann.id}
            className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border} transition-all`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    BarberOS — {cfg.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{date}</span>
                </div>

                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{ann.title}</p>

                {isExpanded && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpanded(isExpanded ? null : ann.id)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-500"
                  title={isExpanded ? 'Colapsar' : 'Ver más'}
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDismiss(ann.id)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-400"
                  title="Descartar comunicado"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

