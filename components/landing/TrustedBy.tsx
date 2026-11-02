'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Share2, 
  Globe,
  ShieldCheck
} from 'lucide-react'

const integrations = [
  { icon: ShieldCheck, label: 'Google Login', color: 'text-blue-600' },
  { icon: Smartphone, label: 'WhatsApp', color: 'text-emerald-600' },
  { icon: Share2, label: 'Instagram Link', color: 'text-rose-500' },
  { icon: Globe, label: 'Google Maps', color: 'text-amber-500' },
]

const stats = [
  { value: '+500', label: 'Barberías activas' },
  { value: '4.9/5', label: 'Valoración promedio' },
  { value: '98%', label: 'Tasa de satisfacción' },
  { value: '24/7', label: 'Sistema disponible' },
]

export default function TrustedBy() {
  return (
    <section className="py-12 border-y border-zinc-200/80 bg-zinc-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 mb-10 border-b border-zinc-200/80"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-zinc-950 font-mono tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Integrations row */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            Se integra con las herramientas que ya usas
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
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs text-xs font-bold text-zinc-700 hover:border-zinc-300 hover:shadow-md transition-all"
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
