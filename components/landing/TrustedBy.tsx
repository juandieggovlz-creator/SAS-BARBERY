'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Share2, 
  Globe, 
  ShieldCheck,
  MessageSquare
} from 'lucide-react'

const integrations = [
  { icon: MessageSquare, label: 'WhatsApp Cloud API', color: 'text-emerald-500' },
  { icon: Share2, label: 'Enlace en Bio Instagram', color: 'text-rose-500' },
  { icon: Globe, label: 'Google Maps', color: 'text-amber-500' },
  { icon: ShieldCheck, label: 'Google & OAuth 2.0', color: 'text-blue-500' },
]

const stats = [
  { value: '+500', label: 'Barberías activas' },
  { value: '4.9/5', label: 'Valoración promedio' },
  { value: '98%', label: 'Tasa de satisfacción' },
  { value: '24/7', label: 'Disponibilidad online' },
]

export default function TrustedBy() {
  return (
    <section className="py-12 border-y border-zinc-200/80 dark:border-white/10 bg-zinc-50/60 dark:bg-[#07080c] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 mb-10 border-b border-zinc-200/80 dark:border-white/10"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white font-mono tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Integrations row */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Sincronizado con el ecosistema que impulsa tu barbería
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {integrations.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="liquid-glass flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xs text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-amber-500/40 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <span>{item.label}</span>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
