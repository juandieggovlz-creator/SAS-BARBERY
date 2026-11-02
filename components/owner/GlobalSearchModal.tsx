'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Users, UserCheck, Scissors, Clock, ArrowRight } from 'lucide-react'

interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  type: 'client' | 'barber' | 'service' | 'appointment'
  href: string
}

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open triggered from external
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [clsRes, barbsRes, servsRes, apptsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/barbers'),
          fetch('/api/services'),
          fetch('/api/appointments')
        ])

        const [cls, barbs, servs, appts] = await Promise.all([
          clsRes.ok ? clsRes.json() : [],
          barbsRes.ok ? barbsRes.json() : [],
          servsRes.ok ? servsRes.json() : [],
          apptsRes.ok ? apptsRes.json() : []
        ])

        const searchLower = query.toLowerCase()
        const items: SearchResultItem[] = []

        if (Array.isArray(cls)) {
          cls.filter((c: { name: string; phone: string }) => 
            c.name.toLowerCase().includes(searchLower) || c.phone.includes(searchLower)
          ).slice(0, 3).forEach((c: { id: string; name: string; phone: string }) => {
            items.push({ id: c.id, title: c.name, subtitle: `Tel: ${c.phone}`, type: 'client', href: `/clients` })
          })
        }

        if (Array.isArray(barbs)) {
          barbs.filter((b: { name: string; specialty?: string }) => 
            b.name.toLowerCase().includes(searchLower) || (b.specialty && b.specialty.toLowerCase().includes(searchLower))
          ).slice(0, 3).forEach((b: { id: string; name: string; specialty?: string }) => {
            items.push({ id: b.id, title: b.name, subtitle: b.specialty || 'Barbero', type: 'barber', href: `/barbers` })
          })
        }

        if (Array.isArray(servs)) {
          servs.filter((s: { name: string }) => 
            s.name.toLowerCase().includes(searchLower)
          ).slice(0, 3).forEach((s: { id: string; name: string; price: number }) => {
            items.push({ id: s.id, title: s.name, subtitle: `$${parseFloat(String(s.price)).toLocaleString('es-CO')}`, type: 'service', href: `/services` })
          })
        }

        if (Array.isArray(appts)) {
          appts.filter((a: { reservationCode: string; client?: { name: string } }) => 
            (a.reservationCode && a.reservationCode.toLowerCase().includes(searchLower)) ||
            (a.client?.name && a.client.name.toLowerCase().includes(searchLower))
          ).slice(0, 3).forEach((a: { id: string; reservationCode: string; client?: { name: string }; date: string }) => {
            items.push({ id: a.id, title: `Cita #${a.reservationCode?.slice(0, 8)}`, subtitle: `${a.client?.name || 'Cliente'} - ${new Date(a.date).toLocaleDateString()}`, type: 'appointment', href: `/appointments` })
          })
        }

        setResults(items)
      } catch {
        // Ignore search errors
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }

  const getIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'client': return <Users size={16} className="text-zinc-500" />
      case 'barber': return <UserCheck size={16} className="text-zinc-500" />
      case 'service': return <Scissors size={16} className="text-zinc-500" />
      case 'appointment': return <Clock size={16} className="text-zinc-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] rounded-3xl w-full max-w-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Input Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <Search size={20} className="text-zinc-400 shrink-0 ml-2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, barbero, servicio o código de cita..."
            className="w-full text-base font-bold text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">Buscando en BarberOS...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-black dark:group-hover:bg-amber-400 group-hover:text-white transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:underline">{item.title}</div>
                      <div className="text-xs font-medium text-zinc-400">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">No se encontraron resultados para &quot;{query}&quot;</div>
          ) : (
            <div className="py-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">Escribe para buscar clientes, barberos, citas o servicios</div>
          )}
        </div>
      </div>
    </div>
  )
}
